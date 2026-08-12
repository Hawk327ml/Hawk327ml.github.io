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
};

export const projects: Project[] = [
  {
    id: "00",
    title: "Orb Courier",
    tagline: "小星球送货：曲面移动、目标指引、最佳用时。",
    stack: ["Three.js", "Vite", "TypeScript"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/play/",
    accent: "#FF6B3D",
    image: "/thumbs/orb-courier.svg",
    featured: true,
  },
  {
    id: "01",
    title: "FocusSpace",
    tagline: "3D 书房：物件交互、日夜切换、番茄钟。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/focusspace-3d",
    live: "https://hawk327ml.github.io/focusspace-3d/",
    accent: "#3B82F6",
    image: "/thumbs/focusspace.svg",
  },
  {
    id: "02",
    title: "Luna Dining",
    tagline: "3D 餐厅选桌与预订演示。",
    stack: ["React", "R3F", "Three.js"],
    repo: "https://github.com/Hawk327ml/luna-dining-3d",
    live: "https://hawk327ml.github.io/luna-dining-3d/",
    accent: "#1F6B58",
    image: "/thumbs/luna.svg",
  },
  {
    id: "03",
    title: "Rosemary",
    tagline: "护理品牌叙事站，手绘插画，已上线。",
    stack: ["HTML/CSS/JS", "Firebase"],
    repo: "https://github.com/Hawk327ml/Build-rosemary-profile-site",
    live: "https://rosemary-care-notebook.web.app",
    accent: "#C8F542",
    image: "/thumbs/rosemary.png",
  },
  {
    id: "04",
    title: "AAPL Forecast",
    tagline: "次日股价回归：Ridge · Notebook 可复现。",
    stack: ["Python", "scikit-learn"],
    repo: "https://github.com/Hawk327ml/AAPL-Stock-Prediction",
    live: "https://aapl-stock-prediction-3scusseltfmnzjcthk2lp8.streamlit.app/",
    accent: "#5CE1E6",
    image: "/thumbs/aapl.png",
  },
  {
    id: "05",
    title: "Tempe Crash EDA",
    tagline: "交通事故公开数据清洗与探索分析。",
    stack: ["Python", "pandas"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    accent: "#7DD3FC",
    image: "/thumbs/traffic.svg",
  },
  {
    id: "06",
    title: "Attendance Tools",
    tagline: "企微考勤月报自动汇总（桌面端）。",
    stack: ["Python", "Excel"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
    image: "/thumbs/attendance.svg",
  },
  {
    id: "07",
    title: "Esports Desk",
    tagline: "队员、合同与赛果管理。",
    stack: ["Java", "JavaFX", "MySQL"],
    repo: "https://github.com/Hawk327ml/esports-team-management",
    accent: "#F45B69",
    image: "/thumbs/esports.png",
  },
  {
    id: "WIP",
    title: "PULSEFIELD (Draft)",
    tagline: "筹备中：音频反应环形舞台。不作为 Featured，待设计确认后再重建。",
    stack: ["Draft", "Web Audio", "Three.js"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/pulse/",
    accent: "#3EE0B8",
    image: "/thumbs/pulsefield.svg",
  },
];

export const profile = {
  brand: "HAWK",
  handle: "Hawk327ml",
  role: "Multimedia Computing · UPM",
  location: "Malaysia",
  github: "https://github.com/Hawk327ml",
  blurb: "做能点开就玩的互动网页，和真正省事的小工具。",
};
