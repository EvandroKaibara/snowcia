export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function apiFetch(path, { token, body, headers, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message ?? "Não foi possível concluir esta ação.");
    error.status = response.status;
    throw error;
  }
  return payload;
}
