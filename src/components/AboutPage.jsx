export function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-card">
        <div className="about-handle">n0m4d</div>
        <div className="about-tagline">
          <span className="logo-dim">// </span>offensive security enthusiast
        </div>
        <a
          className="about-github"
          href="https://github.com/n0m4d-eng"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/n0m4d-eng
        </a>
        <div className="about-divider" />
        <div className="about-section-title">Certifications &amp; Goals</div>
        <div className="about-list">
          <div className="about-list-item">
            <span className="about-bullet">[*]</span> OSCP — in progress
          </div>
          <div className="about-list-item">
            <span className="about-bullet">[*]</span> CPTS — in progress
          </div>
        </div>
        <div className="about-divider" />
        <div className="about-section-title">This Site</div>
        <p className="about-body">
          A live attack methodology map built from personal playbooks and CTF writeups.
          Each node represents a technique; edges show how techniques chain into full attack paths.
          Click a node to see its connections — green edges are outgoing paths, blue edges are incoming.
        </p>
      </div>
    </div>
  )
}
