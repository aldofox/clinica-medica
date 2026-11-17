import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  consultasApi,
  especialidadesApi,
  medicosApi,
  notificationsApi,
  pacientesApi,
  type ConsultaBackend,
  type NotificationBackend,
} from "@/lib/apiClient";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [medicos, setMedicos] = useState(0);
  const [especialidades, setEspecialidades] = useState(0);
  const [pacientes, setPacientes] = useState(0);
  const [consultas, setConsultas] = useState<ConsultaBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<NotificationBackend[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [medicosData, espData, pacientesData, consultasData, notificationsData] =
        await Promise.all([
          medicosApi.list(),
          especialidadesApi.list(),
          pacientesApi.list(),
          consultasApi.list(),
          notificationsApi.list(),
        ]);

      setMedicos(medicosData.length);
      setEspecialidades(espData.length);
      setPacientes(pacientesData.length);
      setConsultas(consultasData);
      setNotifications(notificationsData);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar o dashboard. Tente novamente em alguns segundos.",
      );
    } finally {
      setLoading(false);
    }
  }

  const operational = useMemo(() => {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const future = consultas
      .filter(
        (consulta) =>
          ["agendada", "confirmada"].includes(consulta.status) &&
          new Date(consulta.data_hora) >= now,
      )
      .sort(
        (first, second) =>
          new Date(first.data_hora).getTime() - new Date(second.data_hora).getTime(),
      );
    return {
      today: consultas.filter((consulta) => consulta.data_hora.slice(0, 10) === today).length,
      pending: consultas.filter((consulta) => consulta.status === "agendada").length,
      confirmed: consultas.filter((consulta) => consulta.status === "confirmada").length,
      cancelled: consultas.filter((consulta) => consulta.status === "cancelada").length,
      next: future.slice(0, 5),
    };
  }, [consultas]);

  const paymentSummary = useMemo(() => {
    const paymentLabels = {
      pix: "PIX",
      cartao_credito: "Cartão",
      convenio: "Convênio",
    } as const;

    const totals = {
      pix: 0,
      cartao_credito: 0,
      convenio: 0,
    } as Record<keyof typeof paymentLabels, number>;

    for (const consulta of consultas) {
      if (consulta.status_pagamento !== "pago") continue;
      const method = consulta.forma_pagamento;
      if (!method || !paymentLabels[method as keyof typeof paymentLabels]) continue;
      totals[method as keyof typeof paymentLabels] += consulta.valor_consulta ?? 0;
    }

    const totalRevenue = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return {
      totalRevenue,
      formattedTotal: formatter.format(totalRevenue),
      methods: Object.entries(paymentLabels).map(([key, label]) => ({
        key,
        label,
        value: totals[key as keyof typeof paymentLabels],
        formatted: formatter.format(totals[key as keyof typeof paymentLabels]),
      })),
    };
  }, [consultas]);

  const paymentStatusSummary = useMemo(() => {
    const statusCounts = {
      pendente: 0,
      pago: 0,
      vencido: 0,
    } as Record<"pendente" | "pago" | "vencido", number>;

    for (const consulta of consultas) {
      const status = consulta.status_pagamento ?? "pendente";
      if (status === "pendente" || status === "pago" || status === "vencido") {
        statusCounts[status] += 1;
      }
    }

    return [
      { key: "pendente", label: "Pendente", value: statusCounts.pendente },
      { key: "pago", label: "Pago", value: statusCounts.pago },
      { key: "vencido", label: "Vencido", value: statusCounts.vencido },
    ];
  }, [consultas]);

  const monthlyRevenue = useMemo(() => {
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: date
          .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
          .replace(".", ""),
        value: 0,
      };
    });
    const totalsByMonth = new Map(months.map((month) => [month.key, 0]));

    for (const consulta of consultas) {
      if (consulta.status_pagamento !== "pago") continue;
      const month = consulta.data_hora.slice(0, 7);
      if (totalsByMonth.has(month)) {
        totalsByMonth.set(month, (totalsByMonth.get(month) ?? 0) + (consulta.valor_consulta ?? 0));
      }
    }

    const values = months.map((month) => ({
      ...month,
      value: totalsByMonth.get(month.key) ?? 0,
    }));

    return {
      values,
      maxValue: Math.max(0, ...values.map((month) => month.value)),
    };
  }, [consultas]);

  const chartData = useMemo(() => {
    const status = [
      { key: "agendada", label: "Agendadas", className: "chart-bar-pending" },
      { key: "confirmada", label: "Confirmadas", className: "chart-bar-confirmed" },
      { key: "realizada", label: "Concluídas", className: "chart-bar-completed" },
      { key: "cancelada", label: "Canceladas", className: "chart-bar-cancelled" },
    ] as const;
    const statusValues = status.map((item) => ({
      ...item,
      value: consultas.filter((consulta) => consulta.status === item.key).length,
    }));
    const maxStatus = Math.max(1, ...statusValues.map((item) => item.value));
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      return {
        key,
        label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: consultas.filter((consulta) => consulta.data_hora.slice(0, 10) === key).length,
      };
    });
    return {
      status: statusValues,
      maxStatus,
      days,
      maxDays: Math.max(1, ...days.map((day) => day.value)),
    };
  }, [consultas]);

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

  const stats = [
    { label: "Médicos", value: medicos, icon: "fa-solid fa-user-doctor", to: "/admin/medicos" },
    {
      label: "Especialidades",
      value: especialidades,
      icon: "fa-solid fa-stethoscope",
      to: "/admin/especialidades",
    },
    {
      label: "Consultas",
      value: consultas.length,
      icon: "fa-solid fa-calendar-check",
      to: "/admin/agendamentos",
    },
    { label: "Pacientes", value: pacientes, icon: "fa-solid fa-users", to: "/admin/agendamentos" },
  ];

  return (
    <div>
      <header className="page-hero">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do sistema.</p>
        </div>
      </header>
      {loading && (
        <div className="stats-grid" aria-live="polite" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="skeleton-card" key={`skeleton-${index}`}>
              <div className="skeleton-box skeleton-icon" />
              <div style={{ flex: 1, display: "grid", gap: 10 }}>
                <div className="skeleton-box skeleton-line medium" />
                <div className="skeleton-box skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div
          className="card"
          style={{ padding: 20, marginBottom: 20, borderColor: "var(--color-danger)" }}
        >
          <p className="api-error" style={{ margin: 0 }}>
            {error}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDashboard}
            style={{ marginTop: 12 }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="stats-grid">
        {stats.map((stat) => (
          <Link to={stat.to} key={stat.label} className="stat-card">
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>
      {!loading && !error && (
        <>
          <section className="dashboard-operational" aria-label="Indicadores operacionais">
            <article className="dashboard-indicator dashboard-indicator-today">
              <span>Consultas hoje</span>
              <strong>{operational.today}</strong>
            </article>
            <article className="dashboard-indicator dashboard-indicator-pending">
              <span>Pendentes</span>
              <strong>{operational.pending}</strong>
            </article>
            <article className="dashboard-indicator dashboard-indicator-confirmed">
              <span>Confirmadas</span>
              <strong>{operational.confirmed}</strong>
            </article>
            <article className="dashboard-indicator dashboard-indicator-cancelled">
              <span>Canceladas</span>
              <strong>{operational.cancelled}</strong>
            </article>
          </section>
          {notifications.length > 0 ? (
            <section className="internal-notifications" aria-label="Notificações administrativas">
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
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
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
          ) : (
            <section className="internal-notifications" aria-label="Notificações administrativas">
              <div className="notification-toolbar">
                <strong>Notificações</strong>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <p className="empty-state" style={{ padding: 0, background: "transparent" }}>
                  Nenhuma notificação no momento.
                </p>
              </div>
            </section>
          )}
          <section className="dashboard-operational" aria-label="Resumo financeiro">
            <article className="dashboard-indicator dashboard-indicator-confirmed">
              <span>Receita recebida</span>
              <strong>{paymentSummary.formattedTotal}</strong>
            </article>
            {paymentSummary.methods.map((item) => (
              <article
                key={item.key}
                className={`dashboard-indicator ${
                  item.key === "pix"
                    ? "dashboard-indicator-pending"
                    : item.key === "cartao_credito"
                      ? "dashboard-indicator-completed"
                      : "dashboard-indicator-cancelled"
                }`}
              >
                <span>{item.label}</span>
                <strong>{item.formatted}</strong>
              </article>
            ))}
          </section>
          <section className="dashboard-operational" aria-label="Status de pagamento">
            {paymentStatusSummary.map((item) => (
              <article
                key={item.key}
                className={`dashboard-indicator ${
                  item.key === "pendente"
                    ? "dashboard-indicator-pending"
                    : item.key === "pago"
                      ? "dashboard-indicator-confirmed"
                      : "dashboard-indicator-cancelled"
                }`}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>
          <section className="dashboard-charts" aria-label="Gráficos de agendamentos">
            <article className="card dashboard-chart">
              <div className="section-head-inline">
                <div>
                  <h3>Distribuição por status</h3>
                  <p>Visão geral das consultas cadastradas.</p>
                </div>
              </div>
              <div className="chart-bars">
                {chartData.status.map((item) => (
                  <div className="chart-row" key={item.key}>
                    <span className="chart-label">{item.label}</span>
                    <div className="chart-track">
                      <span
                        className={`chart-bar ${item.className}`}
                        style={{ width: `${(item.value / chartData.maxStatus) * 100}%` }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="card dashboard-chart">
              <div className="section-head-inline">
                <div>
                  <h3>Próximos 7 dias</h3>
                  <p>Volume diário de consultas agendadas.</p>
                </div>
              </div>
              <div className="daily-chart">
                {chartData.days.map((day) => (
                  <div
                    className="daily-column"
                    key={day.key}
                    title={`${day.value} consulta(s) em ${day.date}`}
                  >
                    <strong>{day.value}</strong>
                    <div className="daily-track">
                      <span
                        className="daily-bar"
                        style={{
                          height: `${Math.max(day.value ? 12 : 3, (day.value / chartData.maxDays) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>{day.label}</span>
                    <small>{day.date}</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="card dashboard-chart dashboard-chart-monthly">
              <div className="section-head-inline">
                <div>
                  <h3>Faturamento mensal</h3>
                  <p>Valores marcados como pagos, agrupados pelo mês da consulta.</p>
                </div>
              </div>
              <div className="monthly-chart">
                {monthlyRevenue.values.map((month) => (
                  <div
                    className="monthly-column"
                    key={month.key}
                    title={`${month.label}: ${new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(month.value)}`}
                  >
                    <strong>
                      {new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 1,
                      }).format(month.value)}
                    </strong>
                    <div className="monthly-track">
                      <span
                        className="monthly-bar"
                        style={{
                          height: `${
                            monthlyRevenue.maxValue
                              ? (month.value / monthlyRevenue.maxValue) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span>{month.label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
          <div className="card dashboard-next">
            <div className="section-head-inline">
              <div>
                <h3>Próximas consultas</h3>
                <p>Agenda futura que exige acompanhamento da equipe.</p>
              </div>
              <Link className="btn btn-outline btn-sm" to="/admin/agendamentos">
                Ver todos
              </Link>
            </div>
            {operational.next.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>Nenhuma consulta agendada.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Paciente</th>
                    <th>Médico</th>
                    <th>Status</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {operational.next.map((consulta) => (
                    <tr key={consulta.id}>
                      <td>{new Date(consulta.data_hora).toLocaleString("pt-BR")}</td>
                      <td>{consulta.paciente_nome ?? "—"}</td>
                      <td>{consulta.medico_nome ?? "—"}</td>
                      <td>
                        <span
                          className={`badge badge-${consulta.status === "cancelada" ? "danger" : consulta.status === "agendada" ? "warning" : "success"}`}
                        >
                          {consulta.status === "confirmada" ? "Confirmada" : "Agendada"}
                        </span>
                      </td>
                      <td>
                        {consulta.forma_pagamento
                          ? {
                              pix: "PIX",
                              cartao_credito: "Cartão de crédito",
                              convenio: "Convênio",
                            }[consulta.forma_pagamento]
                          : "Não informado"}
                      </td>
                      <td>
                        {typeof consulta.valor_consulta === "number"
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(consulta.valor_consulta)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
