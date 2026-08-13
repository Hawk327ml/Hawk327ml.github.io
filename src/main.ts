import "./style.css";
import { profile, projects, type Project } from "./data/projects";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app not found");
}

function renderProject(p: Project) {
  const href = p.live ?? p.repo;
  const external = !p.live || p.live.startsWith("http");
  const extAttrs = external ? 'target="_blank" rel="noreferrer"' : "";
  const media = p.video
    ? `<video
          src="${p.video}"
          poster="${p.image}"
          muted
          loop
          playsinline
          autoplay
          preload="metadata"
          aria-label="${p.title} 预览"
        ></video>`
    : `<img src="${p.image}" alt="${p.title} 预览" loading="lazy" />`;
  return `
    <article class="project${p.featured ? " is-featured" : ""}" style="--project-accent: ${p.accent}" data-reveal>
      <div class="project-id">${p.id}</div>
      <div class="project-body">
        <div class="project-copy">
          ${p.featured ? `<p class="project-badge">Featured</p>` : ""}
          <h3 class="project-title">
            <a href="${href}" ${extAttrs}>${p.title}</a>
          </h3>
          <p class="project-tagline">${p.tagline}</p>
          <ul class="project-stack">
            ${p.stack.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        <a class="project-media" href="${href}" ${extAttrs} aria-label="${p.title} 预览">
          ${media}
        </a>
      </div>
      <div class="project-links">
        ${
          p.live
            ? `<a href="${p.live}" ${p.live.startsWith("/") ? "" : 'target="_blank" rel="noreferrer"'}>Live ↗</a>`
            : ""
        }
        <a href="${p.repo}" target="_blank" rel="noreferrer">Code ↗</a>
      </div>
    </article>
  `;
}

const selected = projects.filter((p) => (p.tier ?? "selected") === "selected");
const other = projects.filter((p) => p.tier === "other");

app.innerHTML = `
  <div class="grain" aria-hidden="true"></div>

  <header class="site-nav">
    <a class="nav-brand" href="#top">${profile.brand}</a>
    <nav aria-label="Primary">
      <a href="#work">Work</a>
      &nbsp;&nbsp;
      <a href="/play/">Play</a>
      &nbsp;&nbsp;
      <a href="/assist/">Assist</a>
      &nbsp;&nbsp;
      <a href="/pulse/">Pulse</a>
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
        <a class="btn btn-primary" href="/play/">试玩 Orb Courier</a>
        <a class="btn btn-ghost" href="/assist/">Vision Assist</a>
        <a class="btn btn-ghost" href="#work">查看作品</a>
      </div>
    </section>

    <section id="work" aria-labelledby="work-title">
      <div class="section-head">
        <p class="section-kicker">Selected Work</p>
        <h2 class="section-title" id="work-title">WORK</h2>
        <p class="section-desc">先看可玩 demo 与已上线产品；课设与桌面工具在下方 Other。</p>
      </div>
      <div class="projects">
        ${selected.map(renderProject).join("")}
      </div>
    </section>

    <section id="other" class="other-work" aria-labelledby="other-title">
      <div class="section-head">
        <p class="section-kicker">Also</p>
        <h2 class="section-title" id="other-title">OTHER</h2>
        <p class="section-desc">数据课设与桌面工具——看代码与思路即可。</p>
      </div>
      <div class="projects projects-compact">
        ${other.map(renderProject).join("")}
      </div>
    </section>

    <section class="about" id="about" aria-labelledby="about-title">
      <div class="section-head">
        <p class="section-kicker">Profile</p>
        <h2 class="section-title" id="about-title">ABOUT</h2>
      </div>
      <div class="about-grid">
        <p>
          <strong>${profile.brand}</strong> · ${profile.role}<br />
          ${profile.blurb}
        </p>
        <p class="about-note">${profile.seeking}</p>
        <p class="about-note">${profile.contactNote}</p>
        <div class="cta-row about-cta">
          <a class="btn btn-primary" href="mailto:${profile.email}">${profile.email}</a>
          <a class="btn btn-ghost" href="${profile.github}" target="_blank" rel="noreferrer">GitHub @${profile.handle}</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <span>© ${new Date().getFullYear()} ${profile.brand}</span>
    <a href="mailto:${profile.email}">${profile.email}</a>
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
  el.style.transitionDelay = `${Math.min(i, 8) * 70}ms`;
  observer.observe(el);
});

const coverVideos = [
  ...app.querySelectorAll<HTMLVideoElement>(".project-media video"),
];
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const playCover = (video: HTMLVideoElement) => {
  video.setAttribute("autoplay", "");
  void video.play().catch(() => {});
};

const pauseCover = (video: HTMLVideoElement) => {
  video.pause();
};

const syncCoverMotion = () => {
  for (const video of coverVideos) {
    if (motionQuery.matches) {
      pauseCover(video);
      video.removeAttribute("autoplay");
    } else if (video.dataset.inView === "1") {
      playCover(video);
    } else {
      pauseCover(video);
    }
  }
};

const coverObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      video.dataset.inView = entry.isIntersecting ? "1" : "0";
      if (motionQuery.matches) continue;
      if (entry.isIntersecting) playCover(video);
      else pauseCover(video);
    }
  },
  { threshold: 0.35 },
);

coverVideos.forEach((video) => {
  video.dataset.inView = "0";
  coverObserver.observe(video);
});

syncCoverMotion();
motionQuery.addEventListener("change", syncCoverMotion);