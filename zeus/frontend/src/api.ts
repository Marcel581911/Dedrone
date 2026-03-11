const BASE = "/api";

export class GuardrailError extends Error {
  action?: string;
  constructor(message: string, action?: string) {
    super(message);
    this.name = "GuardrailError";
    this.action = action;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (err.error === "not_authenticated") window.dispatchEvent(new CustomEvent("zeus:logout"));
    // Guardrail errors get a special type so the UI can offer ticket logging
    if (err.code === "GUARDRAIL" || err.canLogTicket) {
      const ge = new GuardrailError(err.message || err.error || "Action not permitted", err.action);
      window.dispatchEvent(new CustomEvent("zeus:guardrail", { detail: ge }));
      throw ge;
    }
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  authStatus: () => request<{ setup: boolean; authenticated?: boolean; user?: any }>("/auth/status"),
  setup: (name: string, password: string, assistantName?: string, assistantPersonality?: string, city?: string, timezone?: string) =>
    request<any>("/auth/setup", { method: "POST", body: JSON.stringify({ name, password, assistantName, assistantPersonality, city, timezone }) }),
  login: (name: string, password: string) =>
    request<any>("/auth/login", { method: "POST", body: JSON.stringify({ name, password }) }),
  logout: () => request<any>("/auth/logout", { method: "POST" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>("/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }),
  validateInvite: (code: string) => request<any>(`/auth/invite/${code}`),
  register: (code: string, name: string, password: string, assistantName?: string, assistantPersonality?: string, city?: string, timezone?: string) =>
    request<any>("/auth/register", { method: "POST", body: JSON.stringify({ code, name, password, assistantName, assistantPersonality, city, timezone }) }),

  // Users
  getMe: () => request<any>("/users/me"),
  updateMe: (data: any) => request<any>("/users/me", { method: "PUT", body: JSON.stringify(data) }),
  getUsers: () => request<any[]>("/users"),
  updateUser: (id: string, data: any) => request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: "DELETE" }),
  createInvite: (role?: string) => request<any>("/invites", { method: "POST", body: JSON.stringify({ role }) }),
  getInvites: () => request<any[]>("/invites"),

  // Settings
  dashboard: () => request<any>("/dashboard"),
  getSettings: () => request<Record<string, string>>("/settings"),
  updateSettings: (data: Record<string, string>) => request<any>("/settings", { method: "PUT", body: JSON.stringify(data) }),
  testConnection: () => request<any>("/settings/test", { method: "POST" }),

  // Agents
  getAgents: () => request<any[]>("/agents"),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) => request<any>("/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: any) => request<any>(`/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgent: (id: string) => request<any>(`/agents/${id}`, { method: "DELETE" }),
  assignSkill: (agentId: string, skillId: string) => request<any>(`/agents/${agentId}/skills`, { method: "POST", body: JSON.stringify({ skillId }) }),
  removeSkill: (agentId: string, skillId: string) => request<any>(`/agents/${agentId}/skills/${skillId}`, { method: "DELETE" }),

  // Conversations
  getConversations: (agentId: string) => request<any[]>(`/agents/${agentId}/conversations`),
  createConversation: (agentId: string, title?: string) => request<any>(`/agents/${agentId}/conversations`, { method: "POST", body: JSON.stringify({ title }) }),
  getMessages: (conversationId: string) => request<any[]>(`/conversations/${conversationId}/messages`),
  chat: (agentId: string, conversationId: string, message: string) =>
    request<any>(`/agents/${agentId}/chat`, { method: "POST", body: JSON.stringify({ conversationId, message }) }),

  // Memory
  getMemory: (agentId: string) => request<any[]>(`/agents/${agentId}/memory`),
  addMemory: (agentId: string, data: any) => request<any>(`/agents/${agentId}/memory`, { method: "POST", body: JSON.stringify(data) }),
  deleteMemory: (agentId: string, memId: string) => request<any>(`/agents/${agentId}/memory/${memId}`, { method: "DELETE" }),
  importMemory: async (agentId: string, file: File): Promise<any> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/agents/${agentId}/memory/import`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({ error: res.statusText })); throw new Error(e.error || "Import failed"); }
    return res.json();
  },

  // Tickets
  getTickets: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/tickets${qs}`); },
  createTicket: (data: any) => request<any>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTicket: (id: string, data: any) => request<any>(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTicket: (id: string) => request<any>(`/tickets/${id}`, { method: "DELETE" }),
  processTicket: () => request<any>("/tickets/process", { method: "POST" }),

  // Skills
  getSkills: () => request<any[]>("/skills"),
  createSkill: (data: any) => request<any>("/skills", { method: "POST", body: JSON.stringify(data) }),
  updateSkill: (id: string, data: any) => request<any>(`/skills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSkill: (id: string) => request<any>(`/skills/${id}`, { method: "DELETE" }),
  getSkillGaps: () => request<any[]>("/skill-gaps"),
  generateStub: (id: string) => request<any>(`/skill-gaps/${id}/generate`, { method: "POST" }),

  // Logs
  getLogs: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/logs${qs}`); },
  clearLogs: () => request<any>("/logs", { method: "DELETE" }),

  // Telegram
  telegramStatus: () => request<any>("/telegram/status"),
  telegramStart: () => request<any>("/telegram/start", { method: "POST" }),
  telegramStop: () => request<any>("/telegram/stop", { method: "POST" }),
  telegramPair: (agentId: string) => request<any>(`/telegram/pair/${agentId}`, { method: "POST" }),
  telegramPairings: () => request<any[]>("/telegram/pairings"),
  telegramUnpair: (id: string) => request<any>(`/telegram/pairings/${id}`, { method: "DELETE" }),
  telegramRestart: () => request<any>("/telegram/restart", { method: "POST" }),

  // Automations
  getAutomations: () => request<any[]>("/automations"),
  createAutomation: (data: any) => request<any>("/automations", { method: "POST", body: JSON.stringify(data) }),
  testAutomation: (id: string) => request<any>(`/automations/${id}/test`, { method: "POST" }),
  confirmAutomation: (id: string) => request<any>(`/automations/${id}/confirm`, { method: "POST" }),
  deleteAutomation: (id: string) => request<any>(`/automations/${id}`, { method: "DELETE" }),
  getScheduledTasks: () => request<any[]>("/scheduled-tasks"),
  updateScheduledTask: (id: string, data: any) => request<any>(`/scheduled-tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Email
  getEmails: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/emails${qs}`); },
  getEmail: (id: string) => request<any>(`/emails/${id}`),
  deleteEmail: (id: string) => request<any>(`/emails/${id}`, { method: "DELETE" }),
  syncEmails: () => request<any>("/emails/sync", { method: "POST" }),
  sendNewEmail: (to: string, subject: string, body: string) => request<any>("/emails/send", { method: "POST", body: JSON.stringify({ to, subject, body }) }),
  testImap: () => request<any>("/emails/test-imap", { method: "POST" }),
  testSmtp: () => request<any>("/emails/test-smtp", { method: "POST" }),

  // Modules
  getModules: () => request<any[]>("/modules"),
  installModule: (slug: string) => request<any>(`/modules/${slug}/install`, { method: "POST" }),
  uninstallModule: (slug: string) => request<any>(`/modules/${slug}/uninstall`, { method: "POST" }),
  updateModuleConfig: (slug: string, config: Record<string, string>) => request<any>(`/modules/${slug}/config`, { method: "PUT", body: JSON.stringify(config) }),
  activateModule: (slug: string) => request<any>(`/modules/${slug}/activate`, { method: "POST" }),

  // Reminders
  getReminders: () => request<any[]>("/reminders"),
  createReminder: (data: any) => request<any>("/reminders", { method: "POST", body: JSON.stringify(data) }),
  deleteReminder: (id: string) => request<any>(`/reminders/${id}`, { method: "DELETE" }),

  // Notifications
  getNotifications: (unread?: boolean) => request<any[]>(`/notifications${unread ? "?unread=true" : ""}`),
  notifCount: () => request<any>("/notifications/count"),
  readNotif: (id: string) => request<any>(`/notifications/${id}/read`, { method: "POST" }),
  readAllNotifs: () => request<any>("/notifications/read-all", { method: "POST" }),

  // Calendar
  getEvents: (start?: string, end?: string) => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    const qs = p.toString();
    return request<any[]>(`/calendar${qs ? "?" + qs : ""}`);
  },
  createEvent: (data: any) => request<any>("/calendar", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => request<any>(`/calendar/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<any>(`/calendar/${id}`, { method: "DELETE" }),

  // Notes
  getNotes: () => request<any[]>("/notes"),
  createNote: (data: any) => request<any>("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: any) => request<any>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => request<any>(`/notes/${id}`, { method: "DELETE" }),

  // Search
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),

  // Usage
  getUsage: (period?: string) => request<any>(`/usage${period ? "?period=" + period : ""}`),
  setUsageLimit: (limit: number) => request<any>("/usage/limit", { method: "PUT", body: JSON.stringify({ limit }) }),

  // Backup
  createBackup: () => request<any>("/backup", { method: "POST" }),
  getBackups: () => request<any>("/backups"),
  restoreBackup: (name: string) => request<any>(`/backup/restore/${name}`, { method: "POST" }),

  // Weather
  getWeather: () => request<any>("/weather"),

  // Updates
  getVersion: () => request<any>("/version"),
  checkUpdate: () => request<any>("/version/check", { method: "POST" }),
  applyUpdate: () => request<any>("/version/update", { method: "POST" }),

  // Alerts
  testAlert: (channel?: "telegram" | "sms" | "all") =>
    request<any>("/alerts/test", { method: "POST", body: JSON.stringify({ channel: channel || "all" }) }),

  // Support
  getSupportTickets: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/support/tickets${qs}`); },
  getSupportTicket: (id: string) => request<any>(`/support/tickets/${id}`),
  createSupportTicket: (data: any) => request<any>("/support/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateSupportTicket: (id: string, data: any) => request<any>(`/support/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSupportTicket: (id: string) => request<any>(`/support/tickets/${id}`, { method: "DELETE" }),
  addSupportComment: (id: string, content: string) => request<any>(`/support/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  getSupportStats: () => request<any>("/support/stats"),

  // Finance
  financeSummary: () => request<any>("/finance/summary"),
  getAccounts: () => request<any[]>("/finance/accounts"),
  createAccount: (data: any) => request<any>("/finance/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) => request<any>(`/finance/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) => request<any>(`/finance/accounts/${id}`, { method: "DELETE" }),
  importStatement: async (accountId: string, file: File): Promise<any> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/finance/accounts/${accountId}/import`, { method: "POST", credentials: "include", body: form });
    if (!res.ok) { const e = await res.json().catch(() => ({ error: res.statusText })); throw new Error(e.error || "Import failed"); }
    return res.json();
  },
  getTransactions: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/finance/transactions${qs}`); },
  createTransaction: (data: any) => request<any>("/finance/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => request<any>(`/finance/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => request<any>(`/finance/transactions/${id}`, { method: "DELETE" }),
  getAssets: () => request<any[]>("/finance/assets"),
  createAsset: (data: any) => request<any>("/finance/assets", { method: "POST", body: JSON.stringify(data) }),
  updateAsset: (id: string, data: any) => request<any>(`/finance/assets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAsset: (id: string) => request<any>(`/finance/assets/${id}`, { method: "DELETE" }),
  getStocks: () => request<any[]>("/finance/stocks"),
  createStock: (data: any) => request<any>("/finance/stocks", { method: "POST", body: JSON.stringify(data) }),
  updateStock: (id: string, data: any) => request<any>(`/finance/stocks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStock: (id: string) => request<any>(`/finance/stocks/${id}`, { method: "DELETE" }),
  getStockPrices: () => request<any>("/finance/stocks/prices"),
  getDebts: () => request<any[]>("/finance/debts"),
  createDebt: (data: any) => request<any>("/finance/debts", { method: "POST", body: JSON.stringify(data) }),
  updateDebt: (id: string, data: any) => request<any>(`/finance/debts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDebt: (id: string) => request<any>(`/finance/debts/${id}`, { method: "DELETE" }),
  getSpending: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any>(`/finance/spending${qs}`); },

  // Shopping
  getShops: () => request<any[]>("/shopping/shops"),
  createShop: (data: any) => request<any>("/shopping/shops", { method: "POST", body: JSON.stringify(data) }),
  updateShop: (id: string, data: any) => request<any>(`/shopping/shops/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteShop: (id: string) => request<any>(`/shopping/shops/${id}`, { method: "DELETE" }),
  getShoppingItems: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/shopping/items${qs}`); },
  createShoppingItem: (data: any) => request<any>("/shopping/items", { method: "POST", body: JSON.stringify(data) }),
  updateShoppingItem: (id: string, data: any) => request<any>(`/shopping/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteShoppingItem: (id: string) => request<any>(`/shopping/items/${id}`, { method: "DELETE" }),
  setItemStatus: (id: string, status: string) => request<any>(`/shopping/items/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
  getPriceAlerts: () => request<any[]>("/shopping/alerts"),
  createPriceAlert: (data: any) => request<any>("/shopping/alerts", { method: "POST", body: JSON.stringify(data) }),
  updatePriceAlert: (id: string, data: any) => request<any>(`/shopping/alerts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePriceAlert: (id: string) => request<any>(`/shopping/alerts/${id}`, { method: "DELETE" }),
  checkPrice: (id: string) => request<any>(`/shopping/alerts/${id}/check`, { method: "POST" }),
  getPriceHistory: (id: string) => request<any[]>(`/shopping/alerts/${id}/history`),
  getShoppingRules: () => request<any[]>("/shopping/rules"),
  createShoppingRule: (data: any) => request<any>("/shopping/rules", { method: "POST", body: JSON.stringify(data) }),
  updateShoppingRule: (id: string, data: any) => request<any>(`/shopping/rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteShoppingRule: (id: string) => request<any>(`/shopping/rules/${id}`, { method: "DELETE" }),
  searchProducts: (query: string, marketplace?: string) => request<any>("/shopping/search", { method: "POST", body: JSON.stringify({ query, marketplace }) }),

  // Travel
  getTravelTrips: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/travel/trips${qs}`); },
  getTravelTrip: (id: string) => request<any>(`/travel/trips/${id}`),
  createTravelTrip: (data: any) => request<any>("/travel/trips", { method: "POST", body: JSON.stringify(data) }),
  updateTravelTrip: (id: string, data: any) => request<any>(`/travel/trips/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTravelTrip: (id: string) => request<any>(`/travel/trips/${id}`, { method: "DELETE" }),
  addTravelEvent: (tripId: string, data: any) => request<any>(`/travel/trips/${tripId}/events`, { method: "POST", body: JSON.stringify(data) }),
  updateTravelEvent: (tripId: string, eventId: string, data: any) => request<any>(`/travel/trips/${tripId}/events/${eventId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTravelEvent: (tripId: string, eventId: string) => request<any>(`/travel/trips/${tripId}/events/${eventId}`, { method: "DELETE" }),
  trackFlight: (tripId: string, eventId: string) => request<any>(`/travel/trips/${tripId}/events/${eventId}/track`, { method: "POST" }),
  untrackFlight: (tripId: string, eventId: string) => request<any>(`/travel/trips/${tripId}/events/${eventId}/track`, { method: "DELETE" }),
  checkFlight: (tripId: string, eventId: string) => request<any>(`/travel/trips/${tripId}/events/${eventId}/check`, { method: "POST" }),
  ingestTravelEmails: () => request<any>("/travel/ingest", { method: "POST" }),
  getTravelPOIs: (params?: Record<string, string>) => { const qs = params ? "?" + new URLSearchParams(params).toString() : ""; return request<any[]>(`/travel/pois${qs}`); },
  createTravelPOI: (data: any) => request<any>("/travel/pois", { method: "POST", body: JSON.stringify(data) }),
  updateTravelPOI: (id: string, data: any) => request<any>(`/travel/pois/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTravelPOI: (id: string) => request<any>(`/travel/pois/${id}`, { method: "DELETE" }),
  getTravelCalendar: (from: string, to: string) => request<any[]>(`/travel/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  uploadTravelFile: async (file: File): Promise<any> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/travel/upload", { method: "POST", credentials: "include", body: form });
    if (!res.ok) { const e = await res.json().catch(() => ({ error: res.statusText })); throw new Error(e.error || "Upload failed"); }
    return res.json();
  },

  // Connection requests
  getConnectionRequests: () => request<any[]>("/connections/requests"),
  createConnectionRequest: (service: string, description: string) =>
    request<any>("/connections/requests", { method: "POST", body: JSON.stringify({ service, description }) }),
  reviewConnectionRequest: (id: string, status: "approved" | "denied", adminNote?: string) =>
    request<any>(`/connections/requests/${id}`, { method: "PUT", body: JSON.stringify({ status, adminNote }) }),
  deleteConnectionRequest: (id: string) => request<any>(`/connections/requests/${id}`, { method: "DELETE" }),
};
