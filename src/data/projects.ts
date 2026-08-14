export type Project = {
  id: string;
  title: string;
  tagline: string;
  stack: string[];
  repo: string;
  live?: string;
  accent: string;
  image: string;
  /** Optional muted looping cover (WebM/MP4). `image` remains poster/fallback. */
  video?: string;
  featured?: boolean;
  /** selected = main list; other = supporting; draft = hidden from Selected Work */
  tier?: "selected" | "other" | "draft";
};

export const projects: Project[] = [
  {
    id: "00",
    title: "Orb Courier",
    tagline: "点开即玩的小星球送货：黄块拾取 → 橙柱送达，绿箭头指路，记最佳用时。",
    stack: ["Three.js", "Vite", "TypeScript"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/play/",
    accent: "#FF6B3D",
    image: "/thumbs/orb-courier.svg",
    video: "/thumbs/orb-courier.webm",
    featured: true,
    tier: "selected",
  },
  {
    id: "00b",
    title: "Vision Assist Lab",
    tagline: "点开即玩的射击小关卡：端侧检测框 + Assist 可关 · 非商业作弊工具。",
    stack: ["Canvas", "ONNX Runtime", "Web Worker"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/assist/",
    accent: "#5CE1E6",
    image: "/thumbs/vision-assist.svg",
    video: "/thumbs/vision-assist.webm",
    featured: true,
    tier: "selected",
  },
  {
    id: "01",
    title: "FocusSpace",
    tagline: "点开即用的 3D 书房：点物件切模式 · 灯控日夜 · 时钟开番茄钟。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/focusspace-3d",
    live: "https://focusspace-3d.web.app",
    accent: "#3B82F6",
    image: "/thumbs/focusspace.png",
    video: "/thumbs/focusspace.webm",
    featured: true,
    tier: "selected",
  },
  {
    id: "02",
    title: "Luna Dining",
    tagline: "点桌选位 → 填表预订：3D 厅堂 + localStorage 演示。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/luna-dining-3d",
    live: "https://luna-dining-3d.web.app",
    accent: "#1F6B58",
    image: "/thumbs/luna.png",
    video: "/thumbs/luna.webm",
    tier: "selected",
  },
  {
    id: "03",
    title: "Rosemary",
    tagline: "点开即用的阳台迷迭香护理站：checklist · 浇水判断 · 可登录保存。",
    stack: ["HTML/CSS/JS", "Firebase"],
    repo: "https://github.com/Hawk327ml/Build-rosemary-profile-site",
    live: "https://rosemary-care-notebook.web.app",
    accent: "#C8F542",
    image: "/thumbs/rosemary.jpg",
    video: "/thumbs/rosemary.webm",
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
    title: "Focus Portal",
    tagline: "CSM3401：Firebase 登录闸门 → Focus Command 任务台，完整 Auth 跳转流。",
    stack: ["Firebase Auth", "React", "Vite"],
    repo: "https://github.com/Hawk327ml/csm3401-focus-portal",
    live: "https://daisy-c2db8-login-task-dlbedwxz.web.app",
    accent: "#7EE0C8",
    image: "/thumbs/focus-portal.svg",
    tier: "other",
  },
  {
    id: "06",
    title: "Tempe Crash EDA",
    tagline: "Tempe 公开事故数据：5.6 万行清洗 + 时段/严重度洞察（非因果）。",
    stack: ["Python", "pandas", "Jupyter"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    accent: "#7DD3FC",
    image: "/thumbs/tempe-crashes.png",
    tier: "other",
  },
  {
    id: "07",
    title: "Attendance Tools",
    tagline: "企微考勤月报一键汇总：少抄表、少对账的桌面小工具。",
    stack: ["Python", "Excel"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
    image: "/thumbs/attendance.svg",
    tier: "other",
  },
  {
    id: "08",
    title: "Esports Desk",
    tagline: "JavaFX 队务桌面端：队员 / 合同 / 赛果三表 CRUD，Maven 一键跑。",
    stack: ["Java", "JavaFX", "MySQL"],
    repo: "https://github.com/Hawk327ml/esports-team-management",
    accent: "#F45B69",
    image: "/thumbs/esports.png",
    tier: "other",
  },
  {
    id: "09",
    title: "PULSEFIELD",
    tagline: "点 Play，环形舞台跟拍频谱：A/B 轨切换，几何跟着呼吸。",
    stack: ["Web Audio", "Three.js", "Vite"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/pulse/",
    accent: "#3EE0B8",
    image: "/thumbs/pulsefield.svg",
    video: "/thumbs/pulsefield.webm",
    featured: true,
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
