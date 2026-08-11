import "./style.css";
import { profile, projects } from "./data/projects";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app not found");
}

app.innerHTML = `
  <div class="grain" aria-hidden="true"></div>

  <header class="site-nav">
    <a class="nav-brand" href="#top">${profile.brand}</a>
    <nav aria-label="Primary">
      <a href="#work">Work</a>
      &nbsp;&nbsp;
      <a href="#about">About</a>
      &nbsp;&nbsp;
      <a href="${profile.github}" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero" aria-label="Intro">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-grid" aria-hidden="true"></div>
      <h1 class="hero-brand">${profile.brand}<span>.</span></h1>
      <p class="hero-copy">${profile.blurb}</p>
      <div class="hero-meta">
        <span><strong>${profile.role}</strong></span>
        <span>${profile.location}</span>
        <span>@${profile.handle}</span>
      </div>
      <div class="cta-row">
        <a class="btn btn-primary" href="#work">查看作品</a>
        <a class="btn btn-ghost" href="${profile.github}" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </section>

    <section id="work" aria-labelledby="work-title">
      <div class="section-head">
        <p class="section-kicker">Selected Work</p>
        <h2 class="section-title" id="work-title">PROJECTS</h2>
        <p class="section-desc">
          多媒体 3D Web（FocusSpace / Luna Dining）、Rosemary 产品站、AAPL 预测、Tempe 交通事故 EDA、企微考勤自动化、电竞管理桌面端。
        </p>
      </div>
      <div class="projects">
        ${projects
          .map(
            (p) => `
          <article class="project" style="--project-accent: ${p.accent}" data-reveal>
            <div class="project-id">${p.id}</div>
            <div class="project-body">
              <div class="project-copy">
                <h3 class="project-title">
                  <a href="${p.live ?? p.repo}" target="_blank" rel="noreferrer">${p.title}</a>
                </h3>
                <p class="project-tagline">${p.tagline}</p>
                <ul class="project-stack">
                  ${p.stack.map((s) => `<li>${s}</li>`).join("")}
                </ul>
              </div>
              <a class="project-media" href="${p.live ?? p.repo}" target="_blank" rel="noreferrer" aria-label="${p.title} preview">
                <img src="${p.image}" alt="" loading="lazy" />
              </a>
            </div>
            <div class="project-links">
              ${
                p.live
                  ? `<a href="${p.live}" target="_blank" rel="noreferrer">Live ↗</a>`
                  : ""
              }
              <a href="${p.repo}" target="_blank" rel="noreferrer">Code ↗</a>
            </div>
          </article>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="about" id="about" aria-labelledby="about-title">
      <div class="section-head">
        <p class="section-kicker">Profile</p>
        <h2 class="section-title" id="about-title">ABOUT</h2>
      </div>
      <div class="about-grid">
        <p>
          我是 <strong>${profile.brand}</strong>（${profile.handle}），就读于
          University Putra Malaysia，专业方向为计算机科学（多媒体计算）。
          作品集侧重「可演示、可部署、可复现」——从 React Three Fiber 3D 站到 Firebase 产品页与 Python 数据流水线。
        </p>
        <p class="about-note">
          仓库持续迭代中。若某个项目 README 仍较薄，以本页摘要 + GitHub 最新提交为准。
        </p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <span>© ${new Date().getFullYear()} ${profile.brand}</span>
    <a href="${profile.github}" target="_blank" rel="noreferrer">${profile.github.replace("https://", "")}</a>
  </footer>
`;

const revealItems = app.querySelectorAll<HTMLElement>("[data-reveal]");
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
);

revealItems.forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
  observer.observe(el);
});
