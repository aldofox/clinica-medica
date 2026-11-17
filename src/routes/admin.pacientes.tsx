import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { pacientesApi, type PacienteBackend } from "@/lib/apiClient";
import { getSession } from "@/lib/auth";
import {
  isValidCpf,
  isValidDateNotInFuture,
  isValidEmail,
  isValidPhone,
  normalizeText,
} from "@/lib/formValidation";

export const Route = createFileRoute("/admin/pacientes")({ component: PacientesAdmin });

const emptyForm = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  data_nascimento: "",
  senha: "",
};

function PacientesAdmin() {
  const isAdmin = getSession()?.role === "admin";
  const [list, setList] = useState<PacienteBackend[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<PacienteBackend | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function refresh() {
    setList(await pacientesApi.list());
  }

  useEffect(() => {
    refresh().catch((reason) =>
      setError(
        reason instanceof Error ? reason.message : "Não foi possível carregar os pacientes.",
      ),
    );
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return list.filter(
      (item) =>
        !term ||
        [item.nome, item.cpf, item.email, item.telefone]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [list, search]);

  function openNew() {
    setEdit(null);
    setForm(emptyForm);
    setError("");
    setFormError("");
    setOpen(true);
  }

  function openEdit(item: PacienteBackend) {
    setEdit(item);
    setForm({
      nome: item.nome,
      cpf: item.cpf,
      telefone: item.telefone ?? "",
      email: item.email ?? "",
      data_nascimento: item.data_nascimento?.slice(0, 10) ?? "",
      senha: "",
    });
    setError("");
    setFormError("");
    setOpen(true);
  }

  function validateForm() {
    const nome = normalizeText(form.nome);
    const cpf = normalizeText(form.cpf);
    const email = normalizeText(form.email);
    const telefone = normalizeText(form.telefone);
    const dataNascimento = normalizeText(form.data_nascimento);
    const senha = normalizeText(form.senha);

    if (nome.length < 2) return "Informe o nome completo do paciente.";
    if (!isValidCpf(cpf)) return "Informe um CPF válido.";
    if (email && !isValidEmail(email)) return "Informe um e-mail válido.";
    if (telefone && !isValidPhone(telefone)) return "Informe um telefone válido com DDD.";
    if (dataNascimento && !isValidDateNotInFuture(dataNascimento)) {
      return "A data de nascimento não pode ser futura e precisa ser válida.";
    }
    if (!edit && senha && senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (edit && senha && senha.length < 8) return "A nova senha deve ter pelo menos 8 caracteres.";

    return "";
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    try {
      const payload = {
        ...form,
        nome: normalizeText(form.nome),
        cpf: normalizeText(form.cpf),
        telefone: normalizeText(form.telefone),
        email: normalizeText(form.email),
        data_nascimento: normalizeText(form.data_nascimento),
        ...(edit && !form.senha ? { senha: undefined } : { senha: normalizeText(form.senha) }),
      };

      if (edit) await pacientesApi.update(edit.id, payload);
      else await pacientesApi.create(payload);
      setOpen(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o paciente.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: PacienteBackend) {
    if (!confirm(`Excluir ${item.nome}? Esta ação não pode ser desfeita.`)) return;
    try {
      await pacientesApi.remove(item.id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o paciente.");
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1>
            <i className="fa-solid fa-users"></i> Pacientes
          </h1>
          <p>Cadastre e gerencie os acessos ao portal do paciente.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> Novo paciente
        </button>
      </header>
      {error && <p className="api-error">{error}</p>}
      <section className="card patient-admin-toolbar">
        <input
          className="form-control"
          placeholder="Buscar por nome, CPF, e-mail ou telefone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span>{filtered.length} paciente(s)</span>
      </section>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Contato</th>
              <th>Nascimento</th>
              <th>Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.nome}</strong>
                  <br />
                  <small>{item.cpf}</small>
                </td>
                <td>
                  {item.email ?? "—"}
                  <br />
                  <small>{item.telefone ?? "—"}</small>
                </td>
                <td>
                  {item.data_nascimento
                    ? new Date(`${item.data_nascimento.slice(0, 10)}T00:00:00`).toLocaleDateString(
                        "pt-BR",
                      )
                    : "—"}
                </td>
                <td>
                  <span
                    className={`badge ${item.acesso_ativo ? "badge-success" : "badge-warning"}`}
                  >
                    {item.acesso_ativo ? "Ativo" : "Sem acesso"}
                  </span>
                </td>
                <td>
                  <div className="appointment-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(item)}
                      aria-label={`Editar ${item.nome}`}
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    {isAdmin && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => remove(item)}
                        aria-label={`Excluir ${item.nome}`}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="empty-state">Nenhum paciente encontrado.</p>}
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>{edit ? "Editar paciente" : "Novo paciente"}</h3>
            <form onSubmit={save}>
              {formError && <p className="api-error">{formError}</p>}
              <div className="form-group">
                <label>Nome completo</label>
                <input
                  className="form-control"
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>CPF</label>
                <input
                  className="form-control"
                  required
                  value={form.cpf}
                  onChange={(event) => setForm({ ...form, cpf: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input
                  className="form-control"
                  value={form.telefone}
                  onChange={(event) => setForm({ ...form, telefone: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Data de nascimento</label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  className="form-control"
                  value={form.data_nascimento}
                  onChange={(event) => setForm({ ...form, data_nascimento: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{edit ? "Nova senha (opcional)" : "Senha de acesso (opcional)"}</label>
                <input
                  type="password"
                  minLength={8}
                  className="form-control"
                  value={form.senha}
                  onChange={(event) => setForm({ ...form, senha: event.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" disabled={saving}>
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
