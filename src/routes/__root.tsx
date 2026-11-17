import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  Link,
} from "@tanstack/react-router";

import Header from "../components/Header";
import Footer from "../components/Footer";

function NotFoundComponent() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{ fontSize: "4rem", margin: 0, color: "var(--color-primary)" }}>404</h1>
        <h2>Página não encontrada</h2>
        <p style={{ color: "var(--color-text-muted)" }}>
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Link to="/" className="btn btn-primary">
          <i className="fa-solid fa-house"></i> Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1>Algo deu errado</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Tente novamente ou volte ao início.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </button>
          <a href="/" className="btn btn-secondary">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ClínicaSaúde — Agendamento de Consultas Médicas" },
      {
        name: "description",
        content:
          "Marque consultas online com especialistas em cardiologia, neurologia, pediatria e mais.",
      },
      { name: "author", content: "ClínicaSaúde" },
      { property: "og:title", content: "ClínicaSaúde — Agendamento de Consultas Médicas" },
      {
        property: "og:description",
        content:
          "Marque consultas online com especialistas em cardiologia, neurologia, pediatria e mais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ClínicaSaúde — Agendamento de Consultas Médicas" },
      {
        name: "twitter:description",
        content:
          "Marque consultas online com especialistas em cardiologia, neurologia, pediatria e mais.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/10461910-c84f-43c2-ab70-08845d1ab895",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/10461910-c84f-43c2-ab70-08845d1ab895",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Admin e login não usam Header/Footer público
  const isBare =
    pathname.startsWith("/admin") || pathname.startsWith("/paciente") || pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      {!isBare && <Header />}
      <Outlet />
      {!isBare && <Footer />}
    </QueryClientProvider>
  );
}
