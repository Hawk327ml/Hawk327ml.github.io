export type Project = {
  id: string;
  title: string;
  tagline: string;
  stack: string[];
  repo: string;
  live?: string;
  accent: string;
};

export const projects: Project[] = [
  {
    id: "01",
    title: "Rosemary Care Notebook",
    tagline:
      "产品向个人档案站点：护理记录叙事与品牌呈现，已部署上线。",
    stack: ["Web", "Firebase Hosting", "Profile UI"],
    repo: "https://github.com/Hawk327ml/Build-rosemary-profile-site",
    live: "https://rosemary-care-notebook.web.app",
    accent: "#C8F542",
  },
  {
    id: "02",
    title: "AAPL Stock Prediction",
    tagline:
      "CSM3601 Group13：次日 Adj Close 回归（Ridge）。对外指标以 Notebook 为准：2024 test MAE 2.12 / RMSE 2.88 / R² 0.987。附海报与线上 Demo 链接（无源码未收录）。",
    stack: ["Python", "scikit-learn", "Jupyter"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    live: "https://aapl-stock-prediction-3scusseltfmnzjcthk2lp8.streamlit.app/",
    accent: "#5CE1E6",
  },
  {
    id: "03",
    title: "WeChat Attendance Automation",
    tagline:
      "企业微信考勤月报自动化：请假/异常/全勤报表一键生成（隐私输出未公开）。",
    stack: ["Python", "Excel", "Desktop GUI"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
  },
  {
    id: "04",
    title: "Esports Team Management",
    tagline: "JavaFX + MySQL 电竞战队管理：球员、合同与赛事结果模块。",
    stack: ["Java", "JavaFX", "MySQL"],
    repo: "https://github.com/Hawk327ml/esports-team-management",
    accent: "#F45B69",
  },
];

export const profile = {
  brand: "HAWK",
  handle: "Hawk327ml",
  role: "Multimedia Computing · UPM",
  location: "Malaysia",
  github: "https://github.com/Hawk327ml",
  blurb:
    "计算机多媒体方向学生。做能上线的站点、能复现的数据分析，以及能直接省时间的小工具。",
};
