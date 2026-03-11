/**
 * Plan-and-Execute Engine
 *
 * Gives the orchestrator LangGraph-style capabilities with zero external
 * dependencies.  When a goal is too complex for a single tool-call round,
 * the orchestrator calls plan_and_execute().  This service:
 *
 *  1. Asks GPT to decompose the goal into ordered steps with dependency info
 *  2. Executes steps that have no pending dependencies in parallel
 *  3. Injects prior-step outputs as context into each subsequent step
 *  4. Routes each step to the right agent (coordinator vs researcher)
 *  5. Streams live progress into a tracking ticket the user can see
 *  6. Returns a concise summary the orchestrator can relay to the user
 *
 * The ticket system is KEPT — it becomes the execution log + user-visible
 * task tracker for every multi-step plan.
 */

import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanStep {
  id: string;           // e.g. "s1", "s2"
  name: string;         // short label
  task: string;         // full instruction for the agent
  agentRole: "coordinator" | "researcher" | "any";
  dependsOn: string[];  // step IDs that must complete first
}

export interface StepLog {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "failed";
  output: string;
  toolCalls: number;
  durationMs: number;
}

export interface PlanResult {
  success: boolean;
  goal: string;
  summary: string;
  stepLogs: StepLog[];
  ticketId: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_STEPS = 7;
const MAX_STEP_TOKENS = 1500;
const MAX_CONTEXT_PER_STEP = 1800; // chars from each prior step injected as context
const MAX_TOOL_ROUNDS_PER_STEP = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve which agent ID to use for a step based on the requested role */
async function resolveAgent(
  role: PlanStep["agentRole"],
  userId: string
): Promise<{ id: string; name: string } | null> {
  if (role === "researcher") {
    const r = await prisma.agent.findFirst({
      where: { id: `research-${userId}`, enabled: true },
      select: { id: true, name: true },
    });
    if (r) return r;
  }
  // Default: the user's orchestrator
  const o = await prisma.agent.findFirst({
    where: { OR: [{ id: `orch-${userId}` }, { userId, role: "Coordinator" }], enabled: true },
    select: { id: true, name: true },
  });
  return o ?? null;
}

/** Topological sort — returns steps in execution waves (each wave can run in parallel) */
function toExecutionWaves(steps: PlanStep[]): PlanStep[][] {
  const completed = new Set<string>();
  const remaining = [...steps];
  const waves: PlanStep[][] = [];

  while (remaining.length > 0) {
    const ready = remaining.filter((s) =>
      s.dependsOn.every((dep) => completed.has(dep))
    );
    if (ready.length === 0) {
      // Circular or unresolvable — run everything left sequentially
      waves.push(remaining.splice(0));
      break;
    }
    waves.push(ready);
    ready.forEach((s) => {
      completed.add(s.id);
      remaining.splice(remaining.indexOf(s), 1);
    });
  }

  return waves;
}

// ── Step execution ────────────────────────────────────────────────────────────

async function executeStep(
  step: PlanStep,
  priorContext: string,       // outputs from dependency steps
  agent: { id: string; name: string },
  client: OpenAI,
  userId: string
): Promise<StepLog> {
  const start = Date.now();
  const log_: StepLog = { id: step.id, name: step.name, status: "running", output: "", toolCalls: 0, durationMs: 0 };

  try {
    // Pull agent record + skills
    const agentRecord = await prisma.agent.findUniqueOrThrow({
      where: { id: agent.id },
      include: { agentSkills: { include: { skill: true } } },
    });

    const enabledSkills = agentRecord.agentSkills
      .filter((as) => as.skill.enabled)
      .map((as) => as.skill);

    const tools: OpenAI.ChatCompletionTool[] = enabledSkills.map((skill) => {
      let params = {};
      try { params = JSON.parse(skill.inputSchema || "{}"); } catch {}
      return { type: "function" as const, function: { name: skill.name, description: skill.description, parameters: params } };
    });

    // System prompt for this step
    const now = new Date();
    const systemContent = [
      agentRecord.systemPrompt,
      `\nYou are ${agentRecord.name}, executing ONE specific step of a larger plan.`,
      `\n\n## Current Date/Time\n${now.toUTCString()}`,
      priorContext
        ? `\n\n## Results from previous steps (use as context)\n${priorContext}`
        : "",
      `\n\n## Your single task for this step\n${step.task}`,
      `\n\nBe concise and complete. Return a clear, structured result.`,
    ].join("");

    const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      { role: "user", content: step.task },
    ];

    let finalContent = "";
    let round = 0;

    while (round < MAX_TOOL_ROUNDS_PER_STEP) {
      round++;

      const completion = await client.chat.completions.create({
        model: agentRecord.model,
        messages: apiMessages,
        temperature: agentRecord.temperature,
        max_tokens: MAX_STEP_TOKENS,
        ...(tools.length > 0 ? { tools } : {}),
      });

      const choice = completion.choices[0];
      const msg = choice.message;

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalContent = msg.content || "";
        break;
      }

      apiMessages.push(msg as any);

      for (const tc of msg.tool_calls) {
        const { executeSkill } = await import("./skill-executor.js");
        const result = await executeSkill(tc.function.name, tc.function.arguments, userId);
        log_.toolCalls++;
        apiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        } as any);
      }

      if (msg.content) finalContent = msg.content;
    }

    log_.output = finalContent || "Step completed (no text output).";
    log_.status = "done";
  } catch (e: any) {
    log_.output = `Step failed: ${e.message}`;
    log_.status = "failed";
  }

  log_.durationMs = Date.now() - start;
  return log_;
}

// ── Planning ──────────────────────────────────────────────────────────────────

async function createPlan(
  goal: string,
  context: string,
  client: OpenAI
): Promise<PlanStep[]> {
  const now = new Date().toISOString();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content: `You are a planning engine. Break the user's goal into a minimal set of steps (2–${MAX_STEPS} max).

Available agent roles:
- "coordinator" — can take real actions: create tasks, set reminders, add events, manage shopping/travel/finance
- "researcher"  — best for analysis, summarisation, comparison, recommendations

Rules:
- Only create steps that are genuinely necessary
- Identify which steps can run in PARALLEL (same dependsOn=[]) vs must be sequential
- Keep step tasks specific and self-contained; include all context they need
- Current date: ${now}
${context ? `\nAdditional context from user: ${context}` : ""}

Return ONLY valid JSON:
{
  "steps": [
    {
      "id": "s1",
      "name": "Short label",
      "task": "Full instruction for the agent — be specific",
      "agentRole": "coordinator" | "researcher",
      "dependsOn": []
    }
  ]
}`,
      },
      { role: "user", content: `Goal: ${goal}` },
    ],
  });

  let parsed: { steps?: any[] } = {};
  try { parsed = JSON.parse(completion.choices[0].message.content || "{}"); } catch {}

  const raw = parsed.steps || [];
  return raw.slice(0, MAX_STEPS).map((s: any) => ({
    id: String(s.id || `s${Math.random()}`),
    name: String(s.name || "Step").slice(0, 80),
    task: String(s.task || "").slice(0, 1000),
    agentRole: ["coordinator", "researcher"].includes(s.agentRole) ? s.agentRole : "coordinator",
    dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn.map(String) : [],
  }));
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function planAndExecute(
  goal: string,
  context: string,
  userId: string
): Promise<PlanResult> {
  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKeySetting?.value) {
    return { success: false, goal, summary: "OpenAI not configured.", stepLogs: [], ticketId: "" };
  }

  const client = new OpenAI({ apiKey: apiKeySetting.value });

  // 1. Create a tracking ticket immediately so user can see the plan is running
  const ticket = await prisma.ticket.create({
    data: {
      title: goal.slice(0, 120),
      description: `Multi-step plan${context ? `\n\nContext: ${context}` : ""}`,
      priority: "high",
      category: "Plan",
      status: "in_progress",
      output: "⚙ Planning steps…",
      userId,
    },
  });

  await log("info", "plan-executor", `Plan started: "${goal.slice(0, 80)}"`, { ticketId: ticket.id, userId });

  try {
    // 2. Generate the plan
    const steps = await createPlan(goal, context, client);

    if (steps.length === 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "failed", output: "Could not generate a plan for this goal." },
      });
      return { success: false, goal, summary: "Could not plan this goal.", stepLogs: [], ticketId: ticket.id };
    }

    // Update ticket with the plan overview
    const planOverview = steps.map((s, i) =>
      `Step ${i + 1}: ${s.name}${s.dependsOn.length > 0 ? ` (after ${s.dependsOn.join(", ")})` : ""}`
    ).join("\n");

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { output: `📋 Plan (${steps.length} steps):\n${planOverview}\n\n⚙ Executing…` },
    });

    // 3. Execute in waves (parallel where possible)
    const waves = toExecutionWaves(steps);
    const stepResults = new Map<string, StepLog>();
    const allLogs: StepLog[] = [];

    for (const wave of waves) {
      const waveResults = await Promise.all(
        wave.map(async (step) => {
          // Build context from completed dependencies
          const depContext = step.dependsOn
            .filter((dep) => stepResults.has(dep))
            .map((dep) => {
              const r = stepResults.get(dep)!;
              return `### ${r.name}\n${r.output.slice(0, MAX_CONTEXT_PER_STEP)}`;
            })
            .join("\n\n");

          // Resolve which agent to use
          const agent = await resolveAgent(step.agentRole, userId);
          if (!agent) {
            return {
              id: step.id, name: step.name, status: "failed" as const,
              output: `No ${step.agentRole} agent available.`, toolCalls: 0, durationMs: 0,
            };
          }

          return executeStep(step, depContext, agent, client, userId);
        })
      );

      for (const result of waveResults) {
        stepResults.set(result.id, result);
        allLogs.push(result);

        // Live-update the ticket after each wave
        const progressLines = allLogs.map((l) => {
          const icon = l.status === "done" ? "✓" : l.status === "failed" ? "✗" : "⚙";
          return `${icon} ${l.name}${l.toolCalls > 0 ? ` (${l.toolCalls} actions)` : ""}`;
        });
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { output: `📋 ${steps.length}-step plan\n\n${progressLines.join("\n")}\n\n…` },
        });
      }
    }

    // 4. Synthesise a final summary
    const stepSummaries = allLogs
      .map((l) => `### ${l.name} (${l.status})\n${l.output.slice(0, 600)}`)
      .join("\n\n");

    const synthCompletion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "Synthesise the results of a multi-step plan into one concise summary (3–6 sentences). Be specific — reference names, numbers, recommendations. End with the key outcome or next action for the user.",
        },
        { role: "user", content: `Goal: ${goal}\n\n${stepSummaries}` },
      ],
    });

    const summary = synthCompletion.choices[0].message.content || "Plan complete.";
    const succeeded = allLogs.every((l) => l.status !== "failed");
    const totalTools = allLogs.reduce((n, l) => n + l.toolCalls, 0);

    // 5. Final ticket update
    const finalOutput = [
      `## ${goal}`,
      ``,
      allLogs.map((l) => {
        const icon = l.status === "done" ? "✓" : "✗";
        return `${icon} **${l.name}** — ${(l.durationMs / 1000).toFixed(1)}s, ${l.toolCalls} action(s)`;
      }).join("\n"),
      ``,
      `## Summary`,
      summary,
    ].join("\n");

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: succeeded ? "done" : "failed",
        output: finalOutput,
      },
    });

    await log("info", "plan-executor", `Plan complete: "${goal.slice(0, 60)}" — ${allLogs.length} steps, ${totalTools} tool calls`, {
      ticketId: ticket.id, userId, succeeded,
    });

    return { success: succeeded, goal, summary, stepLogs: allLogs, ticketId: ticket.id };
  } catch (e: any) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "failed", output: `Plan executor error: ${e.message}` },
    });
    await log("error", "plan-executor", `Plan failed: ${e.message}`, { ticketId: ticket.id });
    return { success: false, goal, summary: `Plan failed: ${e.message}`, stepLogs: [], ticketId: ticket.id };
  }
}
