import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authApi, setToken } from "@/lib/apiClient";

export const Route = createFileRoute("/paciente/login")({
  head: () => ({ meta: [{ title: "Acesso do paciente — ClínicaSaúde" }] }),
  component: PatientLoginPage,
});

function PatientLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("maria@email.com");
  const [senha, setSenha] = useState("paciente123");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setEntrando(true);
    try {
      const response = await authApi.patientLogin(email, senha);
      setToken(response.token);
      navigate({ to: "/paciente" });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="card auth-card">
        <div className="auth-icon">
          <i className="fa-solid fa-user"></i>
        </div>
        <h2>Área do paciente</h2>
        <p className="auth-subtitle">Acompanhe suas consultas e agendamentos.</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="patient-email">E-mail</label>
            <input
              id="patient-email"
              className="form-control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="patient-password">Senha</label>
            <input
              id="patient-password"
              className="form-control"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>
          {erro && <p className="api-error">{erro}</p>}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={entrando}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {entrando ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="auth-demo">Demo: maria@email.com / paciente123</p>
      </div>
    </main>
  );
}
