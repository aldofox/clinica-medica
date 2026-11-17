import { Link } from "@tanstack/react-router";
import { useState } from "react";
import "./Header.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <i className="fa-solid fa-heart-pulse" aria-hidden="true"></i>
          <span>
            Clínica<strong>Saúde</strong>
          </span>
        </Link>

        <button className="nav-toggle" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`}></i>
        </button>

        <nav className={`main-nav ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <Link to="/">Início</Link>
          <a href="#especialidades">Especialidades</a>
          <a href="#especialistas">Especialistas</a>
          <a href="#prevencao">Prevenção</a>
          <Link to="/paciente/login" className="btn btn-outline btn-sm">
            <i className="fa-solid fa-user"></i> Área do paciente
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-user-shield"></i> Área Restrita
          </Link>
        </nav>
      </div>
    </header>
  );
}
