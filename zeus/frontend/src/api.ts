const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Dashboard
  dashboard: () => request<any>("/dashboard"),

  // Settings
  getSettings: () => request<Record<string, string>>("/settings"),
  updateSettings: (data: Record<string, string>) =>
    request<any>("/settings", { method: "PUT", body: JSON.stringify(data) }),
  testConnection: () => request<any>("/settings/test", { method: "POST" }),

  // Agents
  getAgents: () => request<any[]>("/agents"),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) =>
    request<any>("/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: any) =>
    request<any>(`/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<any>(`/agents/${id}`, { method: "DELETE" }),

  // Agent skills
  assignSkill: (agentId: string, skillId: string) =>
    request<any>(`/agents/${agentId}/skills`, {
      method: "POST",
      body: JSON.stringify({ skillId }),
    }),
  removeSkill: (agentId: string, skillId: string) =>
    request<any>(`/agents/${agentId}/skills/${skillId}`, { method: "DELETE" }),

  // Conversations
  getConversations: (agentId: string) =>
    request<any[]>(`/agents/${agentId}/conversations`),
  createConversation: (agentId: string, title?: string) =>
    request<any>(`/agents/${agentId}/conversations`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  getMessages: (conversationId: string) =>
    request<any[]>(`/conversations/${conversationId}/messages`),

  // Chat
  chat: (agentId: string, conversationId: string, message: string) =>
    request<any>(`/agents/${agentId}/chat`, {
      method: "POST",
      body: JSON.stringify({ conversationId, message }),
    }),

  // Memory
  getMemory: (agentId: string) => request<any[]>(`/agents/${agentId}/memory`),
  addMemory: (agentId: string, data: any) =>
    request<any>(`/agents/${agentId}/memory`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Tickets
  getTickets: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/tickets${qs}`);
  },
  getTicket: (id: string) => request<any>(`/tickets/${id}`),
  createTicket: (data: any) =>
    request<any>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTicket: (id: string, data: any) =>
    request<any>(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTicket: (id: string) =>
    request<any>(`/tickets/${id}`, { method: "DELETE" }),
  processTicket: () =>
    request<any>("/tickets/process", { method: "POST" }),

  // Skills
  getSkills: () => request<any[]>("/skills"),
  getSkill: (id: string) => request<any>(`/skills/${id}`),
  createSkill: (data: any) =>
    request<any>("/skills", { method: "POST", body: JSON.stringify(data) }),
  updateSkill: (id: string, data: any) =>
    request<any>(`/skills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSkill: (id: string) =>
    request<any>(`/skills/${id}`, { method: "DELETE" }),

  // Skill Gaps
  getSkillGaps: () => request<any[]>("/skill-gaps"),
  generateStub: (id: string) =>
    request<any>(`/skill-gaps/${id}/generate`, { method: "POST" }),

  // Logs
  getLogs: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/logs${qs}`);
  },
  clearLogs: () => request<any>("/logs", { method: "DELETE" }),
};
