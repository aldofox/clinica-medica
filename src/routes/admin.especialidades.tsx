import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { especialidadesApi } from "@/lib/apiClient";
import { getSession } from "@/lib/auth";
import { normalizeText } from "@/lib/formValidation";
import type { Especialidade } from "@/lib/models";

export const Route = createFileRoute("/admin/especialidades")({ component: EspecialidadesAdmin });
const empty = { nome: "", descricao: "", icone: "fa-solid fa-stethoscope" };

function EspecialidadesAdmin() {
  const isAdmin = getSession()?.role === "admin";
  const [list, setList] = useState<Especialidade[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Especialidade | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const refresh = () => especialidadesApi.list().then(setList);
  useEffect(() => {
    refresh();
  }, []);
  function openNew() {
    setEdit(null);
    setForm(empty);
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Especialidade) {
    setEdit(item);
    setForm({ nome: item.nome, descricao: item.descricao ?? "", icone: item.icone });
    setFormError("");
    setOpen(true);
  }
  function validateForm() {
    const nome = normalizeText(form.nome);
    const descricao = normalizeText(form.descricao);
    const icone = normalizeText(form.icone);

    if (nome.length < 2) return "Informe um nome com pelo menos 2 caracteres.";
    if (descricao.length < 8) return "A descrição deve ter ao menos 8 caracteres.";
    if (!icone) return "Informe o ícone da especialidade.";

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
      descricao: normalizeText(form.descricao),
      icone: normalizeText(form.icone),
    };

    try {
      if (edit) await especialidadesApi.update(edit.id, payload);
      else await especialidadesApi.create(payload);
      setOpen(false);
      setFormError("");
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Não foi possível salvar a especialidade.",
      );
    }
  }
  async function handleDelete(item: Especialidade) {
    if (confirm(`Excluir "${item.nome}"?`)) {
      await especialidadesApi.remove(item.id);
      await refresh();
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
          <h1 style={{ margin: 0 }}>Especialidades</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Gerencie as áreas médicas oferecidas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> Nova
        </button>
      </header>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ícone</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>
                  <i className={item.icone}></i>
                </td>
                <td>
                  <strong>{item.nome}</strong>
                </td>
                <td>{item.descricao}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>{" "}
                  {isAdmin && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>{edit ? "Editar especialidade" : "Nova especialidade"}</h3>
            <form onSubmit={handleSave}>
              {formError && <p className="api-error">{formError}</p>}
              <div className="form-group">
                <label>Nome</label>
                <input
                  className="form-control"
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <input
                  className="form-control"
                  required
                  value={form.descricao}
                  onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ícone Font Awesome</label>
                <input
                  className="form-control"
                  value={form.icone}
                  onChange={(event) => setForm({ ...form, icone: event.target.value })}
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
    </div>
  );
}
