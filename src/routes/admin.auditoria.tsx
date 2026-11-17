import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { auditApi, type AuditBackend } from "@/lib/apiClient";

export const Route = createFileRoute("/admin/auditoria")({ component: AuditPage });

function AuditPage() {
  const [items, setItems] = useState<AuditBackend[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    auditApi
      .list()
      .then(setItems)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Não foi possível carregar a auditoria.",
        ),
      );
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return items.filter(
      (item) =>
        !term ||
        [item.usuario_nome, item.acao, item.entidade].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(term),
        ),
    );
  }, [items, search]);

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1>
            <i className="fa-solid fa-clock-rotate-left"></i> Auditoria
          </h1>
          <p>Histórico das ações realizadas pela equipe administrativa.</p>
        </div>
      </header>
      {error && <p className="api-error">{error}</p>}
      <section className="card patient-admin-toolbar">
        <input
          className="form-control"
          placeholder="Buscar por usuário, ação ou entidade"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span>{filtered.length} registro(s)</span>
      </section>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Ação</th>
              <th>Registro</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.criado_em).toLocaleString("pt-BR")}</td>
                <td>{item.usuario_nome}</td>
                <td>{item.usuario_role === "admin" ? "Administrador" : "Secretaria"}</td>
                <td>
                  <span className="badge badge-info">{item.acao}</span>
                </td>
                <td>
                  {item.entidade} #{item.entidade_id ?? "—"}
                </td>
                <td>
                  <code className="audit-details">{JSON.stringify(item.detalhes)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="empty-state">Nenhum registro de auditoria encontrado.</p>
        )}
      </div>
    </div>
  );
}
