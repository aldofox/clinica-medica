import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { isLoggedIn } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) navigate({ to: "/login" });
    else setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-soft)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "28px 24px", minWidth: 0 }}>
        <Outlet />
      </div>
      <style>{`
        @media (max-width: 860px) {
          div[style*="display: flex"][style*="min-height"] { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
