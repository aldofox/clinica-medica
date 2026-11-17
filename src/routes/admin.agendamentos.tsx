import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  consultasApi,
  especialidadesApi,
  medicosApi,
  pacientesApi,
  type ConsultaBackend,
  type EspecialidadeBackend,
  type FormaPagamento,
  type MedicoBackend,
  type PacienteBackend,
  type StatusPagamento,
} from "@/lib/apiClient";
import { getSession } from "@/lib/auth";

const FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentLabels: Record<FormaPagamento, string> = {
  pix: "PIX",
  cartao_credito: "Cartão de crédito",
  convenio: "Convênio",
};

const paymentStatusLabels: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
};

const getValorConsultaPorEspecialidade = (especialidade?: EspecialidadeBackend) => {
  if (!especialidade) return 180;

  const valores: Record<string, number> = {
    cardiologia: 280,
    dermatologia: 220,
    endocrinologia: 240,
    ginecologia: 260,
    ortopedia: 250,
    neurologia: 290,
    pediatria: 210,
    "clínica geral": 180,
    "clinica geral": 180,
  };

  const key = especialidade.nome.toLowerCase();
  return valores[key] ?? 180;
};

export const Route = createFileRoute("/admin/agendamentos")({ component: AgendamentosPage });

function AgendamentosPage() {
  const isAdmin = getSession()?.role === "admin";
  const [list, setList] = useState<ConsultaBackend[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadeBackend[]>([]);
  const [medicos, setMedicos] = useState<MedicoBackend[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteBackend[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(0);
  const [recentAppointments, setRecentAppointments] = useState<ConsultaBackend[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [paymentUpdatingId, setPaymentUpdatingId] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [appointmentFilters, setAppointmentFilters] = useState({
    search: "",
    status: "todos",
    statusPagamento: "todos",
    especialidadeId: "todas",
    from: "",
    to: "",
  });
  const [sort, setSort] = useState<{
    field: "data_hora" | "paciente_nome" | "medico_nome" | "status" | "status_pagamento";
    direction: "asc" | "desc";
  }>({ field: "data_hora", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    especialidade_id: 0,
    medico_id: 0,
    paciente_id: 0,
    data: "",
    hora: "",
    observacoes: "",
    forma_pagamento: "pix" as FormaPagamento,
    status_pagamento: "pendente" as StatusPagamento,
    valor_consulta: 180,
  });
  const refresh = () =>
    Promise.all([
      consultasApi.list(),
      especialidadesApi.list(),
      medicosApi.list(),
      pacientesApi.list(),
    ]).then(([consultas, specialties, doctors, patients]) => {
      setList(consultas);
      setEspecialidades(specialties);
      setMedicos(doctors);
      setPacientes(patients);
      setSelectedPatientId((current) => current || patients[0]?.id || 0);
      setForm((current) => {
        const nextEspecialidade =
          doctors.find((item) => item.id === current.medico_id)?.especialidade_id ||
          current.especialidade_id ||
          doctors[0]?.especialidade_id ||
          specialties[0]?.id ||
          0;
        const nextMedico =
          doctors.find(
            (item) => item.id === current.medico_id && item.especialidade_id === nextEspecialidade,
          )?.id ??
          doctors[0]?.id ??
          0;
        const nextEspecialidadeData = specialties.find((item) => item.id === nextEspecialidade);

        return {
          ...current,
          especialidade_id: nextEspecialidade,
          medico_id: nextMedico,
          paciente_id: current.paciente_id || patients[0]?.id || 0,
          valor_consulta:
            current.valor_consulta || getValorConsultaPorEspecialidade(nextEspecialidadeData),
        };
      });
    });
  useEffect(() => {
    if (!selectedPatientId) {
      setRecentAppointments([]);
      return;
    }
    setLoadingRecent(true);
    setRecentError(null);
    consultasApi
      .list(selectedPatientId)
      .then(setRecentAppointments)
      .catch((error) =>
        setRecentError(
          error instanceof Error ? error.message : "Não foi possível carregar os agendamentos.",
        ),
      )
      .finally(() => setLoadingRecent(false));
  }, [selectedPatientId]);
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!form.medico_id || !form.data) {
      setAvailableTimes([]);
      return;
    }
    setLoadingTimes(true);
    setSaveError(null);
    medicosApi
      .availableTimes(form.medico_id, form.data)
      .then(({ horarios }) => {
        setAvailableTimes(horarios);
        setForm((current) =>
          horarios.includes(current.hora) ? current : { ...current, hora: "" },
        );
      })
      .catch((error) =>
        setSaveError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os horários disponíveis.",
        ),
      )
      .finally(() => setLoadingTimes(false));
  }, [form.medico_id, form.data]);
  async function handleSpecialtyChange(especialidade_id: number) {
    setSaveError(null);
    const especialidade = especialidades.find((item) => item.id === especialidade_id);
    setForm((current) => ({
      ...current,
      especialidade_id,
      medico_id: 0,
      valor_consulta: getValorConsultaPorEspecialidade(especialidade),
    }));
    if (!especialidade_id) {
      setMedicos([]);
      return;
    }

    setLoadingMedicos(true);
    setMedicos([]);
    try {
      const doctors = await medicosApi.list(especialidade_id);
      setMedicos(doctors);
      setForm((current) => ({
        ...current,
        medico_id: doctors[0]?.id ?? 0,
        valor_consulta: getValorConsultaPorEspecialidade(especialidade),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os profissionais da especialidade.",
      );
    } finally {
      setLoadingMedicos(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);
    const specialty = especialidades.find((item) => item.id === form.especialidade_id);
    const doctor = medicos.find((item) => item.id === form.medico_id);
    const appointmentDate = new Date(`${form.data}T${form.hora}`);
    const now = new Date();
    const dateTimeValue = `${form.data} ${form.hora}:00`;

    if (!specialty) {
      setSaveError("Selecione uma especialidade.");
      return;
    }
    if (!doctor || doctor.especialidade_id !== specialty.id) {
      setSaveError("O profissional não pertence à especialidade selecionada.");
      return;
    }
    if (!form.data || !form.hora || Number.isNaN(appointmentDate.getTime())) {
      setSaveError("Informe uma data e um horário válidos.");
      return;
    }
    if (appointmentDate <= now) {
      setSaveError("A consulta deve ser agendada para uma data e horário futuros.");
      return;
    }
    if (!availableTimes.includes(form.hora)) {
      setSaveError("Selecione um horário disponível para este profissional.");
      return;
    }
    const occupied = list.some(
      (item) =>
        item.medico_id === doctor.id &&
        item.data_hora.replace("T", " ").slice(0, 16) === dateTimeValue.slice(0, 16),
    );
    if (occupied) {
      setSaveError("Este profissional já possui um agendamento nesse horário.");
      return;
    }

    setSaving(true);
    try {
      await consultasApi.create({
        medico_id: form.medico_id,
        paciente_id: form.paciente_id,
        data_hora: `${form.data} ${form.hora}:00`,
        observacoes: form.observacoes,
        forma_pagamento: form.forma_pagamento,
        status_pagamento: form.status_pagamento,
        valor_consulta: form.valor_consulta,
      });
      setOpen(false);
      setForm((current) => ({
        ...current,
        data: "",
        hora: "",
        observacoes: "",
        forma_pagamento: "pix",
        status_pagamento: "pendente",
      }));
      await refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar a consulta.");
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(item: ConsultaBackend, status: ConsultaBackend["status"]) {
    if (item.status === status) return;
    setStatusUpdatingId(item.id);
    setStatusError(null);
    try {
      await consultasApi.update(item.id, { status });
      await refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "Não foi possível atualizar o status.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }
  async function markPaymentAsPaid(item: ConsultaBackend) {
    if (item.status_pagamento === "pago") return;
    setPaymentUpdatingId(item.id);
    setPaymentError(null);
    try {
      await consultasApi.update(item.id, { status_pagamento: "pago" });
      await refresh();
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Não foi possível atualizar o pagamento.",
      );
    } finally {
      setPaymentUpdatingId(null);
    }
  }
  async function remove(item: ConsultaBackend) {
    if (confirm("Excluir esta consulta?")) {
      await consultasApi.remove(item.id);
      await refresh();
    }
  }
  const filteredAppointments = useMemo(() => {
    const search = appointmentFilters.search.trim().toLocaleLowerCase("pt-BR");
    const filtered = list.filter((item) => {
      const appointmentDate = item.data_hora.slice(0, 10);
      const matchesSearch =
        !search ||
        [item.paciente_nome, item.medico_nome, item.especialidade_nome, item.paciente_cpf]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("pt-BR").includes(search));
      const matchesStatus =
        appointmentFilters.status === "todos" || item.status === appointmentFilters.status;
      const paymentStatus = item.status_pagamento ?? "pendente";
      const matchesPaymentStatus =
        appointmentFilters.statusPagamento === "todos" ||
        paymentStatus === appointmentFilters.statusPagamento;
      const matchesSpecialty =
        appointmentFilters.especialidadeId === "todas" ||
        item.especialidade_id?.toString() === appointmentFilters.especialidadeId;
      const matchesFrom = !appointmentFilters.from || appointmentDate >= appointmentFilters.from;
      const matchesTo = !appointmentFilters.to || appointmentDate <= appointmentFilters.to;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentStatus &&
        matchesSpecialty &&
        matchesFrom &&
        matchesTo
      );
    });
    return filtered.sort((first, second) => {
      const firstValue = first[sort.field] ?? "";
      const secondValue = second[sort.field] ?? "";
      const comparison =
        sort.field === "data_hora"
          ? String(firstValue).localeCompare(String(secondValue))
          : String(firstValue).localeCompare(String(secondValue), "pt-BR", {
              sensitivity: "base",
            });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [appointmentFilters, list, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const visibleAppointments = filteredAppointments.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function updateAppointmentFilter(field: keyof typeof appointmentFilters, value: string) {
    setAppointmentFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  }

  function clearAppointmentFilters() {
    setAppointmentFilters({
      search: "",
      status: "todos",
      statusPagamento: "todos",
      especialidadeId: "todas",
      from: "",
      to: "",
    });
    setPage(1);
  }

  function exportAppointments() {
    const escapeCsv = (value: string | null | undefined) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Data/Hora",
      "Paciente",
      "CPF",
      "Médico",
      "Especialidade",
      "Pagamento",
      "Status do pagamento",
      "Valor",
      "Status",
      "Observações",
    ];
    const rows = filteredAppointments.map((item) => [
      new Date(item.data_hora).toLocaleString("pt-BR"),
      item.paciente_nome,
      item.paciente_cpf,
      item.medico_nome,
      item.especialidade_nome,
      item.forma_pagamento ? paymentLabels[item.forma_pagamento] : "Não informado",
      item.status_pagamento ? paymentStatusLabels[item.status_pagamento] : "Pendente",
      item.valor_consulta ? FORMATTER.format(item.valor_consulta) : "R$ 0,00",
      item.status === "agendada"
        ? "Agendado"
        : item.status === "confirmada"
          ? "Confirmado"
          : item.status === "cancelada"
            ? "Cancelado"
            : "Concluído",
      item.observacoes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agendamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function updateSort(field: typeof sort.field) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
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
          <h1 style={{ margin: 0 }}>
            <i className="fa-solid fa-calendar-check"></i> Agendamentos
          </h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Consultas cadastradas no banco de dados.
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSaveError(null);
              setOpen(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Nova consulta
          </button>
        )}
      </header>
      {statusError && <p className="api-error">{statusError}</p>}
      {paymentError && <p className="api-error">{paymentError}</p>}
      <section className="card appointment-filters" aria-label="Filtros de agendamentos">
        <div className="section-head-inline">
          <div>
            <h2>Filtrar agendamentos</h2>
            <p>
              {filteredAppointments.length} de {list.length} agendamento(s) exibido(s).
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={clearAppointmentFilters}
          >
            Limpar filtros
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={filteredAppointments.length === 0}
            onClick={exportAppointments}
          >
            <i className="fa-solid fa-download"></i> Exportar CSV
          </button>
        </div>
        <div className="appointment-filter-grid">
          <div className="form-group">
            <label htmlFor="appointment-search">Buscar</label>
            <input
              id="appointment-search"
              className="form-control"
              placeholder="Paciente, médico ou CPF"
              value={appointmentFilters.search}
              onChange={(event) => updateAppointmentFilter("search", event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="appointment-status-filter">Status</label>
            <select
              id="appointment-status-filter"
              className="form-control"
              value={appointmentFilters.status}
              onChange={(event) => updateAppointmentFilter("status", event.target.value)}
            >
              <option value="todos">Todos os status</option>
              <option value="agendada">Agendado</option>
              <option value="confirmada">Confirmado</option>
              <option value="cancelada">Cancelado</option>
              <option value="realizada">Concluído</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appointment-payment-status-filter">Status do pagamento</label>
            <select
              id="appointment-payment-status-filter"
              className="form-control"
              value={appointmentFilters.statusPagamento}
              onChange={(event) => updateAppointmentFilter("statusPagamento", event.target.value)}
            >
              <option value="todos">Todos os pagamentos</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appointment-specialty-filter">Especialidade</label>
            <select
              id="appointment-specialty-filter"
              className="form-control"
              value={appointmentFilters.especialidadeId}
              onChange={(event) => updateAppointmentFilter("especialidadeId", event.target.value)}
            >
              <option value="todas">Todas as especialidades</option>
              {especialidades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appointment-from">De</label>
            <input
              id="appointment-from"
              type="date"
              className="form-control"
              value={appointmentFilters.from}
              onChange={(event) => updateAppointmentFilter("from", event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="appointment-to">Até</label>
            <input
              id="appointment-to"
              type="date"
              className="form-control"
              value={appointmentFilters.to}
              onChange={(event) => updateAppointmentFilter("to", event.target.value)}
            />
          </div>
        </div>
      </section>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {(
                [
                  ["data_hora", "Data/Hora"],
                  ["paciente_nome", "Paciente"],
                  ["medico_nome", "Médico"],
                  ["status", "Status"],
                  ["forma_pagamento", "Pagamento"],
                  ["status_pagamento", "Status do pagamento"],
                  ["valor_consulta", "Valor"],
                ] as const
              ).map(([field, label]) => (
                <th key={field}>
                  <button
                    type="button"
                    className="table-sort-button"
                    onClick={() => updateSort(field)}
                    aria-label={`Ordenar por ${label}`}
                  >
                    {label}
                    <span aria-hidden="true">
                      {sort.field === field ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}
                    </span>
                  </button>
                </th>
              ))}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleAppointments.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.data_hora).toLocaleString("pt-BR")}</td>
                <td>{item.paciente_nome ?? "—"}</td>
                <td>{item.medico_nome ?? "—"}</td>
                <td>
                  <span
                    className={`badge badge-${item.status === "cancelada" ? "danger" : item.status === "agendada" ? "warning" : "success"}`}
                  >
                    {item.status === "confirmada"
                      ? "Confirmado"
                      : item.status === "cancelada"
                        ? "Cancelado"
                        : item.status === "realizada"
                          ? "Concluído"
                          : "Agendado"}
                  </span>
                </td>
                <td>
                  {item.forma_pagamento ? paymentLabels[item.forma_pagamento] : "Não informado"}
                </td>
                <td>
                  <span
                    className={`badge badge-${
                      item.status_pagamento === "vencido"
                        ? "danger"
                        : item.status_pagamento === "pago"
                          ? "success"
                          : "warning"
                    }`}
                  >
                    {item.status_pagamento
                      ? paymentStatusLabels[item.status_pagamento]
                      : "Pendente"}
                  </span>
                </td>
                <td>{item.valor_consulta ? FORMATTER.format(item.valor_consulta) : "—"}</td>
                <td>
                  <div className="appointment-actions">
                    {item.status_pagamento !== "pago" && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={paymentUpdatingId === item.id}
                        onClick={() => markPaymentAsPaid(item)}
                      >
                        {paymentUpdatingId === item.id ? "Atualizando..." : "Marcar pago"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={statusUpdatingId === item.id}
                      onClick={() => changeStatus(item, "confirmada")}
                    >
                      Confirmado
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={statusUpdatingId === item.id}
                      onClick={() => changeStatus(item, "cancelada")}
                    >
                      Cancelado
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={statusUpdatingId === item.id}
                      onClick={() => changeStatus(item, "realizada")}
                    >
                      Concluído
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(item)}
                      aria-label={`Excluir consulta de ${item.paciente_nome ?? "paciente"}`}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAppointments.length === 0 && (
          <p className="empty-state">Nenhum agendamento corresponde aos filtros selecionados.</p>
        )}
      </div>
      {filteredAppointments.length > 0 && (
        <div className="table-pagination" aria-label="Paginação de agendamentos">
          <span>
            Página {page} de {totalPages} · mostrando {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredAppointments.length)} de{" "}
            {filteredAppointments.length}
          </span>
          <div className="appointment-actions">
            <select
              className="form-control pagination-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Itens por página"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      <section className="card recent-appointments">
        <div className="section-head-inline">
          <div>
            <h2>Agendamentos recentes do paciente</h2>
            <p>Consulte os últimos agendamentos e seus status.</p>
          </div>
          <select
            className="form-control"
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(Number(event.target.value))}
            aria-label="Selecionar paciente"
          >
            <option value={0}>Selecione um paciente</option>
            {pacientes.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.nome} — {patient.cpf}
              </option>
            ))}
          </select>
        </div>
        {loadingRecent && <p>Carregando agendamentos...</p>}
        {recentError && <p className="api-error">{recentError}</p>}
        {!loadingRecent && !recentError && selectedPatientId && recentAppointments.length === 0 && (
          <p>Nenhum agendamento encontrado para este paciente.</p>
        )}
        {!loadingRecent && recentAppointments.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Profissional</th>
                  <th>Especialidade</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Status do pagamento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{new Date(appointment.data_hora).toLocaleString("pt-BR")}</td>
                    <td>{appointment.medico_nome ?? "—"}</td>
                    <td>{appointment.especialidade_nome ?? "—"}</td>
                    <td>
                      <span
                        className={`badge badge-${appointment.status === "cancelada" ? "danger" : appointment.status === "agendada" ? "warning" : "success"}`}
                      >
                        {appointment.status === "confirmada"
                          ? "Confirmado"
                          : appointment.status === "cancelada"
                            ? "Cancelado"
                            : appointment.status === "realizada"
                              ? "Concluído"
                              : "Agendado"}
                      </span>
                    </td>
                    <td>
                      {appointment.forma_pagamento
                        ? paymentLabels[appointment.forma_pagamento]
                        : "Não informado"}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          appointment.status_pagamento === "vencido"
                            ? "danger"
                            : appointment.status_pagamento === "pago"
                              ? "success"
                              : "warning"
                        }`}
                      >
                        {appointment.status_pagamento
                          ? paymentStatusLabels[appointment.status_pagamento]
                          : "Pendente"}
                      </span>
                    </td>
                    <td>
                      {appointment.valor_consulta
                        ? FORMATTER.format(appointment.valor_consulta)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Nova consulta</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label htmlFor="appointment-specialty">Especialidade</label>
                <select
                  id="appointment-specialty"
                  className="form-control"
                  required
                  value={form.especialidade_id}
                  onChange={(event) => handleSpecialtyChange(Number(event.target.value))}
                >
                  <option value={0}>Selecione uma especialidade</option>
                  {especialidades.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="appointment-doctor">Profissional</label>
                <select
                  id="appointment-doctor"
                  className="form-control"
                  required
                  value={form.medico_id}
                  disabled={loadingMedicos || !form.especialidade_id}
                  onChange={(event) => setForm({ ...form, medico_id: Number(event.target.value) })}
                >
                  <option value={0}>
                    {loadingMedicos ? "Carregando profissionais..." : "Selecione um profissional"}
                  </option>
                  {medicos
                    .filter((item) => item.especialidade_id === form.especialidade_id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Paciente</label>
                <select
                  className="form-control"
                  required
                  value={form.paciente_id}
                  onChange={(event) =>
                    setForm({ ...form, paciente_id: Number(event.target.value) })
                  }
                >
                  {pacientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} — {item.cpf}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Data</label>
                <input
                  min={new Date().toISOString().slice(0, 10)}
                  type="date"
                  className="form-control"
                  required
                  value={form.data}
                  onChange={(event) => setForm({ ...form, data: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="appointment-time">Horário disponível</label>
                <select
                  id="appointment-time"
                  className="form-control"
                  required
                  value={form.hora}
                  disabled={loadingTimes || !form.data || !form.medico_id}
                  onChange={(event) => setForm({ ...form, hora: event.target.value })}
                >
                  <option value={0}>
                    {loadingTimes
                      ? "Carregando horários..."
                      : form.data
                        ? "Selecione um horário"
                        : "Selecione a data primeiro"}
                  </option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {!loadingTimes && form.data && availableTimes.length === 0 && (
                  <small className="api-error">
                    Não há horários disponíveis para este profissional nessa data.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="appointment-payment">Forma de pagamento</label>
                <select
                  id="appointment-payment"
                  className="form-control"
                  value={form.forma_pagamento}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      forma_pagamento: event.target.value as FormaPagamento,
                    })
                  }
                >
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="convenio">Convênio</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="appointment-payment-status">Status do pagamento</label>
                <select
                  id="appointment-payment-status"
                  className="form-control"
                  value={form.status_pagamento}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status_pagamento: event.target.value as StatusPagamento,
                    })
                  }
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor da consulta</label>
                <input
                  className="form-control"
                  value={FORMATTER.format(form.valor_consulta)}
                  readOnly
                  aria-readonly="true"
                />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  className="form-control"
                  value={form.observacoes}
                  onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
                />
              </div>
              {saveError && <p className="api-error">{saveError}</p>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
