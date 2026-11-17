import { authApi, clearToken, getToken, setToken } from "./apiClient";

const STORAGE_KEY = "clinica_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface AdminSession {
  email: string;
  nome: string;
  role: "admin" | "secretaria";
  loggedAt: number;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export async function login(email: string, senha: string): Promise<AdminSession> {
  const response = await authApi.login(email, senha);
  setToken(response.token, SESSION_TTL_MS);
  const session: AdminSession = {
    email: response.user.email,
    nome: response.user.nome,
    role: response.user.role === "admin" ? "admin" : "secretaria",
    loggedAt: Date.now(),
  };
  const storage = getStorage() ?? localStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    const storage = getStorage() ?? localStorage;
    storage.removeItem(STORAGE_KEY);
  }
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const storage = getStorage() ?? localStorage;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AdminSession;
    const hasValidToken = Boolean(getToken());
    const isFreshSession = Date.now() - (session.loggedAt ?? 0) < SESSION_TTL_MS;

    if (!hasValidToken || !isFreshSession) {
      logout();
      return null;
    }

    return session;
  } catch {
    logout();
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}
