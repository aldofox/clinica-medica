import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { especialidadesApi, medicosApi, type ScheduleSlot } from "@/lib/apiClient";
import { isValidCrm, isValidEmail, isValidPhone, normalizeText } from "@/lib/formValidation";
import type { Especialidade, Medico } from "@/lib/models";
import { normalizeMedico } from "@/lib/models";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/admin/medicos")({ component: MedicosAdmin });
const empty = {
  nome: "",
  crm: "",
  especialidade_id: 0,
  email: "",
  telefone: "",
  bio: "",
  foto: "https://i.pravatar.cc/300",
};

function MedicosAdmin() {
  const isAdmin = getSession()?.role === "admin";
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [list, setList] = useState<Medico[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Medico | null>(null);
  const [form, setForm] = useState(empty);
  const [scheduleDoctor, setScheduleDoctor] = useState<Medico | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [formError, setFormError] = useState("");
  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const refresh = () => medicosApi.list().then(setList);
  useEffect(() => {
    Promise.all([especialidadesApi.list(), medicosApi.list()]).then(([esp, doctors]) => {
      setEspecialidades(esp);
      setList(doctors);
      setForm((current) => ({ ...current, especialidade_id: esp[0]?.id ?? 0 }));
    });
  }, []);
  function openNew() {
    setEdit(null);
    setForm({ ...empty, especialidade_id: especialidades[0]?.id ?? 0 });
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Medico) {
    setEdit(item);
    setForm({
      nome: item.nome,
      crm: item.crm,
      especialidade_id: item.especialidade_id,
      email: item.email,
      telefone: item.telefone ?? "",
      bio: item.bio ?? "",
      foto: item.foto ?? "",
    });
    setFormError("");
    setOpen(true);
  }
  function validateForm() {
    const nome = normalizeText(form.nome);
    const crm = normalizeText(form.crm);
    const email = normalizeText(form.email);
    const telefone = normalizeText(form.telefone);
    const foto = normalizeText(form.foto);

    if (nome.length < 2) return "Informe o nome completo do médico.";
    if (!form.especialidade_id) return "Selecione uma especialidade antes de salvar.";
    if (!isValidCrm(crm)) return "Informe um CRM válido.";
    if (!email || !isValidEmail(email)) return "Informe um e-mail válido.";
    if (telefone && !isValidPhone(telefone)) return "Informe um telefone com DDD e número válidos.";
    if (!foto) return "Informe a URL da foto do profissional.";

    return "";
  }
  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      nome: normalizeText(form.nome),
      crm: normalizeText(form.crm),
      especialidade_id: Number(form.especialidade_id),
      email: normalizeText(form.email),
      telefone: normalizeText(form.telefone),
      bio: normalizeText(form.bio),
      foto: normalizeText(form.foto) || "https://i.pravatar.cc/300",
    };

    try {
      if (edit) await medicosApi.update(edit.id, payload);
      else await medicosApi.create(payload);
      setOpen(false);
      setFormError("");
      await refresh();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar o médico.");
    }
  }
  async function handleDelete(item: Medico) {
    if (confirm(`Excluir ${item.nome}?`)) {
      await medicosApi.remove(item.id);
      await refresh();
    }
  }
  async function openSchedule(item: Medico) {
    setScheduleDoctor(item);
    setScheduleError("");
    setScheduleLoading(true);
    try {
      setSchedule(await medicosApi.schedule(item.id));
    } catch (reason) {
      setScheduleError(
        reason instanceof Error ? reason.message : "Não foi possível carregar a agenda.",
      );
    } finally {
      setScheduleLoading(false);
    }
  }
  function addScheduleSlot(day: number) {
    setSchedule((current) => [
      ...current,
      { dia_semana: day, hora_inicio: "08:00", hora_fim: "17:00" },
    ]);
  }
  function updateScheduleSlot(index: number, field: "hora_inicio" | "hora_fim", value: string) {
    setSchedule((current) =>
      current.map((slot, position) => (position === index ? { ...slot, [field]: value } : slot)),
    );
  }
  async function saveSchedule() {
    setScheduleSaving(true);
    setScheduleError("");
    try {
      await medicosApi.updateSchedule(scheduleDoctor!.id, schedule);
      setScheduleDoctor(null);
    } catch (reason) {
      setScheduleError(
        reason instanceof Error ? reason.message : "Não foi possível salvar a agenda.",
      );
    } finally {
      setScheduleSaving(false);
    }
  }
  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Médicos</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Cadastro de profissionais.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> Novo médico
        </button>
      </header>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>CRM</th>
              <th>Especialidade</th>
              <th>Contato</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const medico = normalizeMedico(item);
              const esp = especialidades.find((entry) => entry.id === item.especialidade_id);
              return (
                <tr key={item.id}>
                  <td>
                    <img
                      src={medico.foto}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                    />
                  </td>
                  <td>
                    <strong>{item.nome}</strong>
                  </td>
                  <td>{item.crm}</td>
                  <td>{esp?.nome ?? item.especialidade_nome ?? "—"}</td>
                  <td>
                    {item.email}
                    <br />
                    <span style={{ color: "var(--color-text-muted)" }}>{medico.telefone}</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                      <i className="fa-solid fa-pen"></i>
                    </button>{" "}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openSchedule(item)}
                      aria-label={`Editar agenda de ${item.nome}`}
                    >
                      <i className="fa-solid fa-clock"></i>
                    </button>{" "}
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>{edit ? "Editar médico" : "Novo médico"}</h3>
            <form onSubmit={handleSave}>
              {formError && <p className="api-error">{formError}</p>}
              {[
                ["nome", "Nome completo"],
                ["crm", "CRM"],
                ["email", "E-mail"],
                ["telefone", "Telefone"],
                ["foto", "URL da foto"],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input
                    className="form-control"
                    required={key !== "foto"}
                    type={key === "email" ? "email" : "text"}
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Especialidade</label>
                <select
                  className="form-control"
                  required
                  value={form.especialidade_id}
                  onChange={(event) =>
                    setForm({ ...form, especialidade_id: Number(event.target.value) })
                  }
                >
                  {especialidades.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Biografia</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {scheduleDoctor && (
        <div className="modal-overlay" onClick={() => setScheduleDoctor(null)}>
          <div className="modal schedule-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Agenda de {scheduleDoctor.nome}</h3>
            <p className="auth-subtitle profile-description">
              Configure um ou mais intervalos por dia. Consultas só poderão ser agendadas nesses
              horários.
            </p>
            {scheduleLoading ? (
              <p>Carregando agenda...</p>
            ) : (
              days.map((day, dayIndex) => (
                <div className="schedule-day" key={day}>
                  <strong>{day}</strong>
                  {schedule.map(
                    (slot, index) =>
                      slot.dia_semana === dayIndex && (
                        <div className="schedule-slot" key={`${slot.id ?? "new"}-${index}`}>
                          <input
                            type="time"
                            className="form-control"
                            value={slot.hora_inicio}
                            onChange={(event) =>
                              updateScheduleSlot(index, "hora_inicio", event.target.value)
                            }
                          />
                          <span>até</span>
                          <input
                            type="time"
                            className="form-control"
                            value={slot.hora_fim}
                            onChange={(event) =>
                              updateScheduleSlot(index, "hora_fim", event.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              setSchedule((current) =>
                                current.filter((_, position) => position !== index),
                              )
                            }
                            aria-label={`Remover horário de ${day}`}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      ),
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm schedule-add"
                    onClick={() => addScheduleSlot(dayIndex)}
                  >
                    <i className="fa-solid fa-plus"></i> Adicionar intervalo
                  </button>
                </div>
              ))
            )}
            {scheduleError && <p className="api-error">{scheduleError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setScheduleDoctor(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={scheduleSaving || scheduleLoading}
                onClick={saveSchedule}
              >
                {scheduleSaving ? "Salvando..." : "Salvar agenda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
