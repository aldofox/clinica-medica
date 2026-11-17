import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { especialidadesApi, medicosApi } from "@/lib/apiClient";
import type { EspecialidadeBackend, MedicoBackend } from "@/lib/apiClient";
import "./SearchBar.css";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{
    especialidades: EspecialidadeBackend[];
    medicos: MedicoBackend[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(value: string) {
    const nextValue = value.trim();
    setQ(value);

    if (nextValue.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const term = nextValue.toLocaleLowerCase();
      const [especialidades, medicos] = await Promise.all([
        especialidadesApi.list(),
        medicosApi.list(),
      ]);

      const filteredEspecialidades = especialidades.filter(
        (item) =>
          item.nome.toLocaleLowerCase().includes(term) ||
          item.descricao.toLocaleLowerCase().includes(term),
      );

      const filteredMedicos = medicos.filter(
        (item) =>
          item.nome.toLocaleLowerCase().includes(term) ||
          item.crm.toLocaleLowerCase().includes(term) ||
          item.especialidade_id.toString().includes(term),
      );

      setResults({
        especialidades: filteredEspecialidades,
        medicos: filteredMedicos,
      });
    } finally {
      setLoading(false);
    }
  }

  const goToEspecialidade = (slug: string) =>
    navigate({ to: "/especialidade/$slug", params: { slug } });

  return (
    <div className="search-wrapper">
      <div className="search-bar">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="search"
          placeholder="Busque por especialidade ou médico..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => q.trim() && handleSearch(q)}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {q.trim().length >= 2 &&
        !loading &&
        results &&
        results.especialidades.length === 0 &&
        results.medicos.length === 0 && (
          <div className="search-empty">
            Nenhum resultado encontrado para “{q.trim()}”. Tente outra palavra-chave.
          </div>
        )}

      {results && (results.especialidades.length > 0 || results.medicos.length > 0) && (
        <div className="search-results">
          {results.especialidades.map((e) => (
            <button
              key={`e-${e.id}`}
              className="result-item"
              onClick={() => goToEspecialidade(e.slug)}
            >
              <i className={e.icone}></i>
              <div>
                <div className="r-title">{e.nome}</div>
                <div className="r-sub">Especialidade</div>
              </div>
            </button>
          ))}
          {results.medicos.map((m) => {
            const especialidade = results.especialidades.find(
              (item) => item.id === m.especialidade_id,
            );
            return (
              <button
                key={`m-${m.id}`}
                className="result-item"
                onClick={() => {
                  if (especialidade) {
                    goToEspecialidade(especialidade.slug);
                    return;
                  }
                  navigate({ to: "/paciente/login" });
                }}
              >
                <i className="fa-solid fa-user-doctor"></i>
                <div>
                  <div className="r-title">{m.nome}</div>
                  <div className="r-sub">{m.crm}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
