export type Project = {
  id: string;
  title: string;
  tagline: string;
  stack: string[];
  repo: string;
  live?: string;
  accent: string;
  image: string;
  featured?: boolean;
  /** selected = main list; other = supporting; draft = hidden from Selected Work */
  tier?: "selected" | "other" | "draft";
};

export const projects: Project[] = [
  {
    id: "00",
    title: "Orb Courier",
    tagline: "30 秒可玩的小星球送货：曲面移动、目标指引、最佳用时。Vanilla Three.js。",
    stack: ["Three.js", "Vite", "TypeScript"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/play/",
    accent: "#FF6B3D",
    image: "/thumbs/orb-courier.svg",
    featured: true,
    tier: "selected",
  },
  {
    id: "01",
    title: "FocusSpace",
    tagline: "可点开的 3D 书房：物件交互、日夜切换、番茄钟——沉浸式专注场景。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/focusspace-3d",
    live: "https://hawk327ml.github.io/focusspace-3d/",
    accent: "#3B82F6",
    image: "/thumbs/focusspace.png",
    featured: true,
    tier: "selected",
  },
  {
    id: "02",
    title: "Luna Dining",
    tagline: "3D 餐厅里完成选桌与预订流程演示，适合展示空间交互叙事。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/luna-dining-3d",
    live: "https://hawk327ml.github.io/luna-dining-3d/",
    accent: "#1F6B58",
    image: "/thumbs/luna.png",
    tier: "selected",
  },
  {
    id: "03",
    title: "Rosemary",
    tagline: "阳台迷迭香护理站：手绘插画 + checklist / 浇水工具，Firebase 已上线。",
    stack: ["HTML/CSS/JS", "Firebase"],
    repo: "https://github.com/Hawk327ml/Build-rosemary-profile-site",
    live: "https://rosemary-care-notebook.web.app",
    accent: "#C8F542",
    image: "/thumbs/rosemary.jpg",
    featured: true,
    tier: "selected",
  },
  {
    id: "04",
    title: "AAPL Forecast",
    tagline: "次日 Adj Close：Ridge · Test MAE 2.12 / R² 0.987（Notebook 口径，非交易建议）。",
    stack: ["Python", "scikit-learn", "Jupyter"],
    repo: "https://github.com/Hawk327ml/AAPL-Stock-Prediction",
    live: "https://aapl-stock-prediction-3scusseltfmnzjcthk2lp8.streamlit.app/",
    accent: "#5CE1E6",
    image: "/thumbs/aapl.png",
    tier: "selected",
  },
  {
    id: "05",
    title: "Tempe Crash EDA",
    tagline: "公开交通事故数据清洗与探索：把脏表变成可读洞察。",
    stack: ["Python", "pandas"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    accent: "#7DD3FC",
    image: "/thumbs/traffic.svg",
    tier: "other",
  },
  {
    id: "06",
    title: "Attendance Tools",
    tagline: "企微考勤月报一键汇总：少抄表、少对账的桌面小工具。",
    stack: ["Python", "Excel"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
    image: "/thumbs/attendance.svg",
    tier: "other",
  },
  {
    id: "07",
    title: "Esports Desk",
    tagline: "JavaFX 队务桌面端：队员 / 合同 / 赛果三表 CRUD，Maven 一键跑。",
    stack: ["Java", "JavaFX", "MySQL"],
    repo: "https://github.com/Hawk327ml/esports-team-management",
    accent: "#F45B69",
    image: "/thumbs/esports.png",
    tier: "other",
  },
  {
    id: "08",
    title: "PULSEFIELD",
    tagline: "环形脉冲舞台 · 频谱驱动 · 点 Play 即跟拍。",
    stack: ["Web Audio", "Three.js", "Vite"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/pulse/",
    accent: "#3EE0B8",
    image: "/thumbs/pulsefield.svg",
    tier: "selected",
  },
];

export const profile = {
  brand: "HAWK",
  handle: "Hawk327ml",
  role: "Multimedia Computing · UPM",
  location: "Malaysia",
  github: "https://github.com/Hawk327ml",
  email: "13136378760@163.com",
  blurb: "做能点开就玩的互动网页，和真正省事的小工具。",
  seeking: "开放实习 / 协作：互动网页、3D Web、数据可视化与小工具。",
  contactNote: "邮件或 GitHub 均可联系。",
};
