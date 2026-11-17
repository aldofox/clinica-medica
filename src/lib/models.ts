import type { EspecialidadeBackend, MedicoBackend } from "./apiClient";

export type Especialidade = EspecialidadeBackend;
export type Medico = MedicoBackend;

export function normalizeMedico(medico: MedicoBackend) {
  return {
    ...medico,
    telefone: medico.telefone ?? "",
    bio: medico.bio ?? "",
    foto: medico.foto ?? "https://i.pravatar.cc/300",
  };
}
