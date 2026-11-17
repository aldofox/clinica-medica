import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Área Restrita — ClínicaSaúde" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@clinica.com");
  const [senha, setSenha] = useState("admin123");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailValue = email.trim();
    const senhaValue = senha.trim();

    if (!emailValue || !senhaValue) {
      setErro("Informe o e-mail e a senha para continuar.");
      return;
    }

    setErro("");
    setEntrando(true);
    try {
      await login(emailValue, senhaValue);
      navigate({ to: "/admin" });
    } catch (error) {
      setErro(
        error instanceof Error && error.message
          ? error.message
          : "E-mail ou senha inválidos ou API indisponível.",
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 12px",
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
            }}
          >
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <h2 style={{ margin: 0 }}>Área Restrita</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "6px 0 0" }}>
            Acesso para administradores e secretaria
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <p style={{ color: "var(--color-danger)", fontSize: "0.9rem", margin: "0 0 12px" }}>
              <i className="fa-solid fa-circle-exclamation"></i> {erro}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={entrando}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <i className="fa-solid fa-right-to-bracket"></i> Entrar
          </button>
        </form>

        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
            marginTop: 18,
          }}
        >
          Demo: <strong>admin@clinica.com</strong> / <strong>admin123</strong>
        </p>
      </div>
    </main>
  );
}
