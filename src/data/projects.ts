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
    title: "Orb Courier — Mini Planet Demo",
    tagline:
      "作品集可玩页：小星球送货、地标、最佳用时、轻音效。Messenger 气质的简化实装（Vanilla Three.js）。",
    stack: ["Playable", "Three.js", "Vite", "TypeScript"],
    repo: "https://github.com/Hawk327ml/Hawk327ml.github.io",
    live: "/play/",
    accent: "#FF6B3D",
    image: "/thumbs/orb-courier.svg",
    featured: true,
  },
  {
    id: "01",
    title: "FocusSpace — 3D Study Room",
    tagline:
      "React Three Fiber 互动书房：点击物件切换专注模式 / 日夜灯光 / Pomodoro。",
    stack: ["React", "R3F", "Three.js", "DaisyUI"],
    repo: "https://github.com/Hawk327ml/focusspace-3d",
    live: "https://hawk327ml.github.io/focusspace-3d/",
    accent: "#3B82F6",
    image: "/thumbs/focusspace.svg",
  },
  {
    id: "02",
    title: "Luna Dining — 3D Reservation",
    tagline:
      "3D 餐厅选桌预订：桌况着色、表单校验、localStorage 持久化演示。",
    stack: ["React", "R3F", "Three.js", "Vite"],
    repo: "https://github.com/Hawk327ml/luna-dining-3d",
    live: "https://hawk327ml.github.io/luna-dining-3d/",
    accent: "#1F6B58",
    image: "/thumbs/luna.svg",
  },
  {
    id: "03",
    title: "Rosemary Care Notebook",
    tagline:
      "CSM3401 产品档案站：护理叙事 + 手绘插画，Firebase Hosting 已上线。",
    stack: ["HTML/CSS/JS", "Firebase Hosting"],
    repo: "https://github.com/Hawk327ml/Build-rosemary-profile-site",
    live: "https://rosemary-care-notebook.web.app",
    accent: "#C8F542",
    image: "/thumbs/rosemary.png",
  },
  {
    id: "04",
    title: "AAPL Stock Prediction",
    tagline:
      "CSM3601 Group13：次日 Adj Close 回归（Ridge）。对外指标以 Notebook 为准：2024 test MAE 2.12 / RMSE 2.88 / R² 0.987。附海报与 Demo 链接（网页源码未收录）。",
    stack: ["Python", "scikit-learn", "Jupyter"],
    repo: "https://github.com/Hawk327ml/AAPL-Stock-Prediction",
    live: "https://aapl-stock-prediction-3scusseltfmnzjcthk2lp8.streamlit.app/",
    accent: "#5CE1E6",
    image: "/thumbs/aapl.png",
  },
  {
    id: "05",
    title: "Tempe Traffic Crash EDA",
    tagline:
      "CSM3601：Tempe 交通事故公开数据清洗、EDA 与特征工程（Data.gov）。",
    stack: ["Python", "pandas", "EDA"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    accent: "#7DD3FC",
    image: "/thumbs/traffic.svg",
  },
  {
    id: "06",
    title: "WeChat Attendance Automation",
    tagline:
      "企业微信考勤月报自动化：请假 / 异常 / 全勤报表（隐私输出未公开）。",
    stack: ["Python", "Excel", "Desktop GUI"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
    image: "/thumbs/attendance.svg",
  },
  {
    id: "07",
    title: "Esports Team Management",
    tagline: "JavaFX + MySQL：队员、合同与赛事结果管理桌面应用。",
    stack: ["Java", "JavaFX", "MySQL"],
    repo: "https://github.com/Hawk327ml/esports-team-management",
    accent: "#F45B69",
    image: "/thumbs/esports.png",
  },
];

export const profile = {
  brand: "HAWK",
  handle: "Hawk327ml",
  role: "Multimedia Computing · UPM",
  location: "Malaysia",
  github: "https://github.com/Hawk327ml",
  blurb:
    "计算机多媒体方向学生。做能上线的站点、能玩的 3D Web demo、能复现的数据分析，以及能直接省时间的小工具。",
};
