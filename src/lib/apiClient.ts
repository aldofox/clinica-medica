export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

const TOKEN_KEY = "clinica_token";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const TOKEN_EXPIRY_KEY = "clinica_token_expires_at";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function setToken(token: string, ttlMs = TOKEN_TTL_MS) {
  if (typeof window === "undefined") return;
  const storage = getStorage();
  const expiresAt = Date.now() + ttlMs;
  if (storage) {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const storage = getStorage();
  const activeStorage = storage ?? localStorage;
  const token = activeStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(activeStorage.getItem(TOKEN_EXPIRY_KEY) ?? "0");

  if (!token) {
    clearToken();
    return null;
  }

  if (expiresAt && Date.now() > expiresAt) {
    clearToken();
    return null;
  }

  return token;
}

export function clearToken() {
  if (typeof window === "undefined") return;

  [window.sessionStorage, localStorage].forEach((storage) => {
    if (storage) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(TOKEN_EXPIRY_KEY);
    }
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as {
        error?: string | { message?: string };
      };
      if (typeof data.error === "string") message = data.error;
      else if (data.error?.message) message = data.error.message;
    } catch {
      // Preserve the HTTP status when the server does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface EspecialidadeBackend {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string;
}

export interface MedicoBackend {
  id: number;
  nome: string;
  crm: string;
  especialidade_id: number;
  especialidade_nome?: string;
  especialidade_slug?: string;
  especialidade_icone?: string;
  email: string;
  telefone: string | null;
  bio: string | null;
  foto: string | null;
}
export interface ScheduleSlot {
  id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export type FormaPagamento = "pix" | "cartao_credito" | "convenio";
export type StatusPagamento = "pendente" | "pago" | "vencido";

export interface ConsultaBackend {
  id: number;
  medico_id: number;
  paciente_id: number;
  data_hora: string;
  status: "agendada" | "confirmada" | "cancelada" | "realizada";
  observacoes: string | null;
  forma_pagamento?: FormaPagamento;
  status_pagamento?: StatusPagamento;
  valor_consulta?: number;
  medico_nome?: string;
  crm?: string;
  especialidade_id?: number;
  especialidade_nome?: string;
  paciente_nome?: string;
  paciente_cpf?: string;
  paciente_telefone?: string;
}

export interface PacienteBackend {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  acesso_ativo?: boolean;
}

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; nome: string; role: string };
}

export interface PatientAppointment {
  id: number;
  data_hora: string;
  status: "agendada" | "confirmada" | "cancelada" | "realizada";
  observacoes: string | null;
  medico_nome: string;
  especialidade_nome: string;
  forma_pagamento?: FormaPagamento;
  status_pagamento?: StatusPagamento;
  valor_consulta?: number;
}

export interface NotificationBackend {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: "info" | "success" | "warning" | "danger";
  lida: 0 | 1;
  criado_em: string;
}
export interface AuditBackend {
  id: number;
  usuario_nome: string;
  usuario_role: "admin" | "secretaria";
  acao: string;
  entidade: string;
  entidade_id: number | null;
  detalhes: Record<string, unknown>;
  criado_em: string;
}

export const authApi = {
  login: (email: string, senha: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  patientLogin: (email: string, senha: string) =>
    request<LoginResponse>("/auth/patient-login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
};

export const patientApi = {
  appointments: () => request<PatientAppointment[]>("/consultas/minhas"),
  profile: () => request<PacienteBackend>("/pacientes/me"),
  updateProfile: (data: { telefone: string; email: string; data_nascimento: string }) =>
    request<PacienteBackend>("/pacientes/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  changePassword: (data: { senha_atual: string; nova_senha: string }) =>
    request<{ ok: true }>("/pacientes/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  cancelAppointment: (id: number) =>
    request<{ ok: true }>(`/consultas/minhas/${id}/cancelar`, { method: "PUT" }),
};

export const notificationsApi = {
  list: () => request<NotificationBackend[]>("/notificacoes"),
  markRead: (id: number) => request<{ ok: true }>(`/notificacoes/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request<{ ok: true }>("/notificacoes/read-all", { method: "PATCH" }),
};
export const auditApi = {
  list: () => request<AuditBackend[]>("/auditoria"),
};

export const especialidadesApi = {
  list: () => request<EspecialidadeBackend[]>("/especialidades"),
  getBySlug: (slug: string) =>
    request<EspecialidadeBackend>(`/especialidades/${encodeURIComponent(slug)}`),
  create: (data: { nome: string; descricao: string; icone: string }) =>
    request<{ id: number }>("/especialidades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { nome: string; descricao: string; icone: string }) =>
    request<{ ok: true }>(`/especialidades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) => request<{ ok: true }>(`/especialidades/${id}`, { method: "DELETE" }),
};

type MedicoPayload = {
  nome: string;
  crm: string;
  especialidade_id: number;
  email: string;
  telefone: string;
  bio: string;
  foto: string;
};

export const medicosApi = {
  list: (especialidadeId?: number) =>
    request<MedicoBackend[]>(
      `/medicos${especialidadeId ? `?especialidadeId=${especialidadeId}` : ""}`,
    ),
  availableTimes: (id: number, date: string) =>
    request<{ horarios: string[] }>(`/medicos/${id}/horarios?data=${encodeURIComponent(date)}`),
  schedule: (id: number) => request<ScheduleSlot[]>(`/medicos/${id}/agenda`),
  updateSchedule: (id: number, horarios: ScheduleSlot[]) =>
    request<{ ok: true; horarios: ScheduleSlot[] }>(`/medicos/${id}/agenda`, {
      method: "PUT",
      body: JSON.stringify({ horarios }),
    }),
  create: (data: MedicoPayload) =>
    request<{ id: number }>("/medicos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: MedicoPayload) =>
    request<{ ok: true }>(`/medicos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) => request<{ ok: true }>(`/medicos/${id}`, { method: "DELETE" }),
};

export const consultasApi = {
  list: (pacienteId?: number) =>
    request<ConsultaBackend[]>(`/consultas${pacienteId ? `?pacienteId=${pacienteId}` : ""}`),
  create: (data: {
    medico_id: number;
    paciente_id: number;
    data_hora: string;
    status?: string;
    observacoes?: string;
    forma_pagamento?: FormaPagamento;
    status_pagamento?: StatusPagamento;
    valor_consulta?: number;
  }) =>
    request<{ id: number }>("/consultas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      data_hora?: string;
      status?: string;
      observacoes?: string;
      forma_pagamento?: FormaPagamento;
      status_pagamento?: StatusPagamento;
      valor_consulta?: number;
    },
  ) =>
    request<{ ok: true }>(`/consultas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) => request<{ ok: true }>(`/consultas/${id}`, { method: "DELETE" }),
};

export const pacientesApi = {
  list: () => request<PacienteBackend[]>("/pacientes"),
  create: (data: {
    nome: string;
    cpf: string;
    telefone: string;
    email?: string;
    data_nascimento?: string;
    senha?: string;
  }) =>
    request<{ id: number }>("/pacientes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      nome: string;
      cpf: string;
      telefone: string;
      email?: string;
      data_nascimento?: string;
      senha?: string;
    },
  ) =>
    request<{ ok: true }>(`/pacientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) => request<{ ok: true }>(`/pacientes/${id}`, { method: "DELETE" }),
};
