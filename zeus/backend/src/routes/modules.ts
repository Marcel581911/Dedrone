import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import fs from "fs";
import path from "path";

const MODULES_DIR = path.resolve(import.meta.dirname, "../../../modules");

export async function moduleRoutes(app: FastifyInstance) {
  app.get("/api/modules", async () => {
    return prisma.module.findMany({ orderBy: { name: "asc" } });
  });

  app.get("/api/modules/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    return prisma.module.findUniqueOrThrow({ where: { slug } });
  });

  // Install a module from the registry
  app.post("/api/modules/:slug/install", async (req) => {
    const { slug } = req.params as { slug: string };
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug } });

    if (mod.status === "installed") {
      return { success: true, message: "Already installed" };
    }

    const manifest = JSON.parse(mod.manifest || "{}");

    // Create module directory
    const moduleDir = path.join(MODULES_DIR, slug);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    // Deploy agents defined by the module
    if (manifest.agents) {
      for (const agentDef of manifest.agents) {
        const existing = await prisma.agent.findFirst({ where: { name: agentDef.name, moduleSlug: slug } });
        if (!existing) {
          await prisma.agent.create({
            data: {
              name: agentDef.name,
              description: agentDef.description || "",
              role: agentDef.role || "",
              mission: agentDef.mission || "",
              systemPrompt: agentDef.systemPrompt || "You are a helpful assistant.",
              model: agentDef.model || "gpt-4o-mini",
              temperature: agentDef.temperature ?? 0.7,
              maxTokens: agentDef.maxTokens ?? 2048,
              enabled: true,
              moduleSlug: slug,
              tags: JSON.stringify(agentDef.tags || []),
            },
          });
        }
      }
    }

    // Deploy skills defined by the module
    if (manifest.skills) {
      for (const skillDef of manifest.skills) {
        await prisma.skill.upsert({
          where: { name: skillDef.name },
          update: {},
          create: {
            name: skillDef.name,
            description: skillDef.description || "",
            inputSchema: JSON.stringify(skillDef.inputSchema || {}),
            outputSchema: JSON.stringify(skillDef.outputSchema || {}),
            implementationPath: `modules/${slug}/${skillDef.name}.ts`,
            enabled: true,
            version: mod.version,
          },
        });
      }
    }

    // Deploy scheduled tasks
    if (manifest.scheduledTasks) {
      for (const taskDef of manifest.scheduledTasks) {
        const existing = await prisma.scheduledTask.findFirst({ where: { name: taskDef.name } });
        if (!existing) {
          await prisma.scheduledTask.create({
            data: {
              name: taskDef.name,
              description: taskDef.description || "",
              intervalMin: taskDef.intervalMin || 60,
              taskType: "module",
              taskConfig: JSON.stringify({ moduleSlug: slug }),
              enabled: true,
            },
          });
        }
      }
    }

    // Write module config file
    fs.writeFileSync(path.join(moduleDir, "manifest.json"), JSON.stringify(manifest, null, 2));

    await prisma.module.update({
      where: { slug },
      data: { status: "installed", installedAt: new Date() },
    });

    await log("info", "modules", `Module "${mod.name}" installed`, { slug });
    return { success: true, message: `Module "${mod.name}" installed` };
  });

  // Uninstall a module
  app.post("/api/modules/:slug/uninstall", async (req) => {
    const { slug } = req.params as { slug: string };
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug } });

    if (mod.status !== "installed") {
      return { success: false, message: "Not installed" };
    }

    // Remove module's agents
    await prisma.agent.deleteMany({ where: { moduleSlug: slug } });

    // Remove module's scheduled tasks
    const tasks = await prisma.scheduledTask.findMany({
      where: { taskConfig: { contains: slug } },
    });
    for (const t of tasks) {
      await prisma.scheduledTask.delete({ where: { id: t.id } });
    }

    await prisma.module.update({
      where: { slug },
      data: { status: "available", installedAt: null },
    });

    await log("info", "modules", `Module "${mod.name}" uninstalled`, { slug });
    return { success: true, message: `Module "${mod.name}" uninstalled` };
  });
}

/**
 * MODULE MANIFEST SPECIFICATION
 *
 * Each module is a JSON manifest with:
 *
 * {
 *   "slug": "finance",
 *   "name": "Finance Manager",
 *   "description": "Track expenses, budgets, and accounts",
 *   "version": "1.0.0",
 *   "author": "ZEUS",
 *   "icon": "$",
 *   "agents": [
 *     {
 *       "name": "Finance Agent",
 *       "role": "Financial analyst",
 *       "mission": "Track and analyze financial data",
 *       "systemPrompt": "You are a financial assistant...",
 *       "tags": ["finance"]
 *     }
 *   ],
 *   "skills": [
 *     {
 *       "name": "log_expense",
 *       "description": "Log an expense",
 *       "inputSchema": { "type": "object", "properties": { ... } }
 *     }
 *   ],
 *   "scheduledTasks": [
 *     {
 *       "name": "weekly_finance_report",
 *       "description": "Generate weekly spending summary",
 *       "intervalMin": 10080
 *     }
 *   ],
 *   "pages": ["dashboard", "transactions", "budgets"]
 * }
 */
