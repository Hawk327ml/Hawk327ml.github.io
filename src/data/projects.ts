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
    title: "Traffic Accident Data Analysis",
    tagline:
      "交通事故数据分析流水线：预处理、Notebook 探索与可视化输出。",
    stack: ["Python", "Jupyter", "Data Viz"],
    repo: "https://github.com/Hawk327ml/Traffic-Accident-Data-Analysis",
    accent: "#5CE1E6",
  },
  {
    id: "03",
    title: "WeChat Attendance Converter",
    tagline:
      "基于 Python 的考勤数据处理系统，面向微信导出格式的结构化转换。",
    stack: ["Python", "Data Pipeline", "Automation"],
    repo: "https://github.com/Hawk327ml/wechat-attendance-converter",
    accent: "#FF8A3D",
  },
  {
    id: "04",
    title: "Esports Team Management",
    tagline: "电竞战队管理相关工程实践，覆盖组织与协作场景。",
    stack: ["Team Ops", "Product Thinking"],
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
