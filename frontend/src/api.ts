const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}/api${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// AI
export const chatWithAI = (message: string, systemContext?: any) =>
  fetchAPI('/ai/chat', { method: 'POST', body: JSON.stringify({ message, system_context: systemContext }) });

export const getChatHistory = (sessionId = 'default', limit = 50) =>
  fetchAPI(`/ai/history?session_id=${sessionId}&limit=${limit}`);

export const clearChatHistory = (sessionId = 'default') =>
  fetchAPI(`/ai/history?session_id=${sessionId}`, { method: 'DELETE' });

export const triggerLearning = () =>
  fetchAPI('/ai/learn', { method: 'POST' });

// Knowledge
export const getKnowledge = () => fetchAPI('/ai/knowledge');
export const addKnowledge = (data: { category: string; content: string; importance?: number }) =>
  fetchAPI('/ai/knowledge', { method: 'POST', body: JSON.stringify(data) });
export const deleteKnowledge = (id: string) =>
  fetchAPI(`/ai/knowledge/${id}`, { method: 'DELETE' });
export const clearKnowledge = () =>
  fetchAPI('/ai/knowledge', { method: 'DELETE' });

// Automations
export const getAutomations = () => fetchAPI('/automations');
export const createAutomation = (data: any) =>
  fetchAPI('/automations', { method: 'POST', body: JSON.stringify(data) });
export const deleteAutomation = (id: string) =>
  fetchAPI(`/automations/${id}`, { method: 'DELETE' });
export const toggleAutomation = (id: string) =>
  fetchAPI(`/automations/${id}/toggle`, { method: 'POST' });
export const evaluateAutomations = (status: any) =>
  fetchAPI('/automations/evaluate', { method: 'POST', body: JSON.stringify(status) });

// Logs
export const getLogs = (limit = 100, logType?: string, module?: string) => {
  let url = `/logs?limit=${limit}`;
  if (logType) url += `&log_type=${logType}`;
  if (module) url += `&module=${module}`;
  return fetchAPI(url);
};
export const createLog = (data: any) =>
  fetchAPI('/logs', { method: 'POST', body: JSON.stringify(data) });
export const clearLogs = () =>
  fetchAPI('/logs', { method: 'DELETE' });

// System
export const updateSystemStatus = (data: any) =>
  fetchAPI('/system/status', { method: 'POST', body: JSON.stringify(data) });
export const getLatestStatus = () => fetchAPI('/system/status/latest');

// Docs & Stats
export const generateDocumentation = () =>
  fetchAPI('/documentation/generate', { method: 'POST' });
export const getStats = () => fetchAPI('/stats');
export const seedData = () => fetchAPI('/seed', { method: 'POST' });
