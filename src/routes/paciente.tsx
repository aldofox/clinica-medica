import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  clearToken,
  getToken,
  notificationsApi,
  patientApi,
  type NotificationBackend,
  type PacienteBackend,
  type PatientAppointment,
} from "@/lib/apiClient";

export const Route = createFileRoute("/paciente")({
  head: () => ({ meta: [{ title: "Meus agendamentos — ClínicaSaúde" }] }),
  component: PatientArea,
});

function PatientArea() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationBackend[]>([]);
  const [profile, setProfile] = useState<PacienteBackend | null>(null);
  const [profileForm, setProfileForm] = useState({ telefone: "", email: "", data_nascimento: "" });
  const [passwordForm, setPasswordForm] = useState({
    senha_atual: "",
    nova_senha: "",
    confirmacao: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/paciente/login" });
      return;
    }
    Promise.all([patientApi.appointments(), notificationsApi.list(), patientApi.profile()])
      .then(([appointmentsData, notificationsData, profileData]) => {
        setAppointments(appointmentsData);
        setNotifications(notificationsData);
        setProfile(profileData);
        setProfileForm({
          telefone: profileData.telefone ?? "",
          email: profileData.email ?? "",
          data_nascimento: profileData.data_nascimento
            ? profileData.data_nascimento.slice(0, 10)
            : "",
        });
      })
      .catch((reason) => {
        clearToken();
        setError(
          reason instanceof Error ? reason.message : "Não foi possível carregar seus agendamentos.",
        );
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    clearToken();
    navigate({ to: "/paciente/login" });
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const updated = await patientApi.updateProfile(profileForm);
      setProfile(updated);
      setProfileMessage("Dados atualizados com sucesso.");
    } catch (reason) {
      setProfileError(
        reason instanceof Error ? reason.message : "Não foi possível atualizar seus dados.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    if (passwordForm.nova_senha !== passwordForm.confirmacao) {
      setProfileError("A confirmação da nova senha não confere.");
      return;
    }
    setChangingPassword(true);
    try {
      await patientApi.changePassword({
        senha_atual: passwordForm.senha_atual,
        nova_senha: passwordForm.nova_senha,
      });
      setPasswordForm({ senha_atual: "", nova_senha: "", confirmacao: "" });
      setProfileMessage("Senha alterada com sucesso.");
    } catch (reason) {
      setProfileError(
        reason instanceof Error ? reason.message : "Não foi possível alterar sua senha.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function cancelAppointment(appointment: PatientAppointment) {
    if (!window.confirm("Deseja realmente cancelar esta consulta?")) return;
    setCancellingId(appointment.id);
    setError("");
    try {
      await patientApi.cancelAppointment(appointment.id);
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, status: "cancelada" } : item,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível cancelar a consulta.");
    } finally {
      setCancellingId(null);
    }
  }

  const summary = useMemo(() => {
    const now = new Date();
    const futureAppointments = appointments
      .filter(
        (appointment) =>
          ["agendada", "confirmada"].includes(appointment.status) &&
          new Date(appointment.data_hora) > now,
      )
      .sort(
        (first, second) =>
          new Date(first.data_hora).getTime() - new Date(second.data_hora).getTime(),
      );

    return {
      upcoming: futureAppointments.length,
      completed: appointments.filter((appointment) => appointment.status === "realizada").length,
      cancelled: appointments.filter((appointment) => appointment.status === "cancelada").length,
      next: futureAppointments[0] ?? null,
    };
  }, [appointments]);

  const paymentLabels = {
    pix: "PIX",
    cartao_credito: "Cartão de crédito",
    convenio: "Convênio",
  } as const;

  const paymentStatusLabels = {
    pendente: "Pendente",
    pago: "Pago",
    vencido: "Vencido",
  } as const;

  const formatMoney = (value?: number) =>
    typeof value === "number"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
      : "—";

  async function markNotificationRead(id: number) {
    await notificationsApi.markRead(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, lida: 1 } : item)),
    );
  }

  async function markAllNotificationsRead() {
    await notificationsApi.markAllRead();
    setNotifications((current) => current.map((item) => ({ ...item, lida: 1 })));
  }

  return (
    <main className="patient-page">
      <header className="patient-header">
        <div>
          <h1>Meus agendamentos</h1>
          <p>Acompanhe suas consultas recentes.</p>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Sair
        </button>
      </header>
      {loading && <p>Carregando seus agendamentos...</p>}
      {error && <p className="api-error">{error}</p>}
      {!loading && !error && profile && (
        <section className="patient-profile-grid">
          <form className="card" onSubmit={saveProfile}>
            <h2>Meu perfil</h2>
            <p className="auth-subtitle profile-description">Atualize seus dados de contato.</p>
            <div className="profile-readonly">
              <span>Nome</span>
              <strong>{profile.nome}</strong>
              <span>CPF</span>
              <strong>{profile.cpf}</strong>
            </div>
            <div className="form-group">
              <label htmlFor="patient-phone">Telefone</label>
              <input
                id="patient-phone"
                className="form-control"
                value={profileForm.telefone}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, telefone: event.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="patient-profile-email">E-mail</label>
              <input
                id="patient-profile-email"
                type="email"
                required
                className="form-control"
                value={profileForm.email}
                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="patient-birth-date">Data de nascimento</label>
              <input
                id="patient-birth-date"
                type="date"
                className="form-control"
                max={new Date().toISOString().slice(0, 10)}
                value={profileForm.data_nascimento}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, data_nascimento: event.target.value })
                }
              />
            </div>
            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? "Salvando..." : "Salvar dados"}
            </button>
          </form>
          <form className="card" onSubmit={changePassword}>
            <h2>Alterar senha</h2>
            <p className="auth-subtitle profile-description">
              Use uma senha com pelo menos 8 caracteres.
            </p>
            <div className="form-group">
              <label htmlFor="current-password">Senha atual</label>
              <input
                id="current-password"
                type="password"
                required
                minLength={8}
                className="form-control"
                value={passwordForm.senha_atual}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, senha_atual: event.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                className="form-control"
                value={passwordForm.nova_senha}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, nova_senha: event.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar nova senha</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                className="form-control"
                value={passwordForm.confirmacao}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, confirmacao: event.target.value })
                }
              />
            </div>
            <button className="btn btn-outline" disabled={changingPassword}>
              {changingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        </section>
      )}
      {profileMessage && <p className="api-success">{profileMessage}</p>}
      {profileError && <p className="api-error">{profileError}</p>}
      {!loading && !error && appointments.length > 0 && (
        <>
          {notifications.length > 0 && (
            <section className="internal-notifications" aria-label="Notificações do paciente">
              <div className="notification-toolbar">
                <strong>Notificações</strong>
                {notifications.some((item) => !item.lida) && (
                  <button className="btn btn-secondary btn-sm" onClick={markAllNotificationsRead}>
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {notifications.map((notification) => (
                <article
                  className={`internal-notification notification-${notification.tipo} ${notification.lida ? "notification-read" : ""}`}
                  key={notification.id}
                >
                  <i className="fa-solid fa-bell" aria-hidden="true"></i>
                  <div>
                    <strong>{notification.titulo}</strong>
                    <p>{notification.mensagem}</p>
                  </div>
                  {!notification.lida && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      Marcar como lida
                    </button>
                  )}
                </article>
              ))}
            </section>
          )}
          <section className="patient-summary" aria-label="Resumo dos agendamentos">
            <article className="patient-summary-card">
              <span className="patient-summary-label">Próximas consultas</span>
              <strong>{summary.upcoming}</strong>
            </article>
            <article className="patient-summary-card">
              <span className="patient-summary-label">Concluídas</span>
              <strong>{summary.completed}</strong>
            </article>
            <article className="patient-summary-card">
              <span className="patient-summary-label">Canceladas</span>
              <strong>{summary.cancelled}</strong>
            </article>
          </section>
          {summary.next && (
            <section className="patient-next-appointment card">
              <div>
                <span className="patient-summary-label">Sua próxima consulta</span>
                <h2>{summary.next.especialidade_nome}</h2>
                <p>com {summary.next.medico_nome}</p>
                <p>
                  Pagamento:{" "}
                  {summary.next.forma_pagamento
                    ? paymentLabels[summary.next.forma_pagamento]
                    : "Não informado"}{" "}
                  · {formatMoney(summary.next.valor_consulta)}
                </p>
                <p>
                  Status do pagamento:{" "}
                  {summary.next.status_pagamento
                    ? paymentStatusLabels[summary.next.status_pagamento]
                    : "Pendente"}
                </p>
              </div>
              <time dateTime={summary.next.data_hora}>
                {new Date(summary.next.data_hora).toLocaleString("pt-BR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </time>
            </section>
          )}
        </>
      )}
      {!loading && !error && appointments.length === 0 && (
        <section className="card">
          <p>Você ainda não possui agendamentos.</p>
        </section>
      )}
      {!loading && !error && appointments.length > 0 && (
        <section className="card" style={{ overflowX: "auto" }}>
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.data_hora).toLocaleString("pt-BR")}</td>
                  <td>{appointment.medico_nome}</td>
                  <td>{appointment.especialidade_nome}</td>
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
                  <td>{formatMoney(appointment.valor_consulta)}</td>
                  <td>
                    {["agendada", "confirmada"].includes(appointment.status) &&
                    new Date(appointment.data_hora) > new Date() ? (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={cancellingId === appointment.id}
                        onClick={() => cancelAppointment(appointment)}
                      >
                        {cancellingId === appointment.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    ) : (
                      <span className="auth-subtitle">Indisponível</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
