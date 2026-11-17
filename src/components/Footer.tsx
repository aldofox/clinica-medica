import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h4>
            <i className="fa-solid fa-heart-pulse"></i> ClínicaSaúde
          </h4>
          <p>Cuidando da sua saúde com excelência e tecnologia há mais de 20 anos.</p>
          <div className="social">
            <a href="#" aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="#" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" aria-label="YouTube">
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Institucional</h4>
          <ul>
            <li>
              <a href="#">Sobre nós</a>
            </li>
            <li>
              <a href="#">Nossa equipe</a>
            </li>
            <li>
              <a href="#">Trabalhe conosco</a>
            </li>
            <li>
              <a href="#">Política de privacidade</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Serviços</h4>
          <ul>
            <li>
              <a href="#especialidades">Especialidades</a>
            </li>
            <li>
              <a href="#">Exames</a>
            </li>
            <li>
              <a href="#">Check-up</a>
            </li>
            <li>
              <a href="#">Telemedicina</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contato</h4>
          <ul>
            <li>
              <i className="fa-solid fa-location-dot"></i> Av. Paulista, 1000 - São Paulo/SP
            </li>
            <li>
              <i className="fa-solid fa-phone"></i> (11) 4002-8922
            </li>
            <li>
              <i className="fa-solid fa-envelope"></i> contato@clinicasaude.com.br
            </li>
            <li>
              <i className="fa-solid fa-clock"></i> Seg a Sex 7h às 20h
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} ClínicaSaúde — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
