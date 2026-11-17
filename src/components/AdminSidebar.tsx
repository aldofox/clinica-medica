import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/auth";
import { notificationsApi, type NotificationBackend } from "@/lib/apiClient";
import "./AdminSidebar.css";

const items = [
  { to: "/admin", label: "Dashboard", icon: "fa-solid fa-gauge-high" },
  { to: "/admin/medicos", label: "Médicos", icon: "fa-solid fa-user-doctor" },
  { to: "/admin/especialidades", label: "Especialidades", icon: "fa-solid fa-stethoscope" },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: "fa-solid fa-calendar-check" },
  { to: "/admin/pacientes", label: "Pacientes", icon: "fa-solid fa-users" },
  { to: "/admin/auditoria", label: "Auditoria", icon: "fa-solid fa-clock-rotate-left" },
] as const;

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationBackend[]>([]);
  const session = getSession();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    notificationsApi
      .list()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

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

  function handleLogout() {
    logout();
    router.navigate({ to: "/login" });
  }

  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-logo">
        <i className="fa-solid fa-heart-pulse"></i>
        <span>ClínicaSaúde</span>
      </Link>
      {session && (
        <div className="admin-user-info">
          <strong>{session.nome}</strong>
          <span>{isAdmin ? "Administrador" : "Secretaria"}</span>
        </div>
      )}

      <nav className="admin-nav">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className={`admin-link ${pathname === it.to ? "active" : ""}`}
          >
            <i className={it.icon}></i> <span>{it.label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-notification-center">
        <button
          type="button"
          className="admin-notification-trigger"
          onClick={() => setNotificationsOpen((current) => !current)}
          aria-expanded={notificationsOpen}
        >
          <i className="fa-solid fa-bell"></i>
          <span>Notificações</span>
          {notifications.some((item) => !item.lida) && (
            <strong>{notifications.filter((item) => !item.lida).length}</strong>
          )}
        </button>
        {notificationsOpen && (
          <div className="admin-notification-panel">
            <div className="admin-notification-heading">
              <strong>Notificações</strong>
              {notifications.some((item) => !item.lida) && (
                <button type="button" onClick={markAllNotificationsRead}>
                  Ler todas
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="admin-notification-empty">Nenhuma notificação.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <button
                  type="button"
                  className={`admin-notification-item ${notification.lida ? "read" : ""}`}
                  key={notification.id}
                  onClick={() => !notification.lida && markNotificationRead(notification.id)}
                >
                  <span className={`notification-dot notification-dot-${notification.tipo}`}></span>
                  <span>
                    <strong>{notification.titulo}</strong>
                    <small>{notification.mensagem}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button className="admin-logout" onClick={handleLogout}>
        <i className="fa-solid fa-right-from-bracket"></i> Sair
      </button>
    </aside>
  );
}
