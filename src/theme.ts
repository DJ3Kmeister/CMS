import { ThemeConfig, ThemeId } from "./types";

export const THEMES: Record<ThemeId, ThemeConfig> = {
  slate: {
    id: "slate",
    name: "Slate Modern (Lumineux)",
    description: "Design clair, épuré et professionnel avec des touches Indigo & Ardoise.",
    bgClass: "bg-slate-50 text-slate-900",
    cardClass: "bg-white border-slate-200 text-slate-800 shadow-sm",
    textClass: "text-slate-800",
    primaryBtnClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
    accentBadgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    headerClass: "bg-white border-slate-200 text-slate-800 shadow-xs",
    borderClass: "border-slate-200"
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Night (Sombre Neon)",
    description: "Style gaming immersif sombre avec néons cyan, magenta et noirs mats.",
    bgClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-slate-900/90 border-cyan-500/30 text-slate-100 shadow-lg shadow-cyan-950/20",
    textClass: "text-slate-100",
    primaryBtnClass: "bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white shadow-md shadow-cyan-500/20",
    accentBadgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
    headerClass: "bg-slate-900/95 border-cyan-500/30 text-white shadow-md",
    borderClass: "border-slate-800"
  },
  gold: {
    id: "gold",
    name: "Gold VIP Lounge (Obsidienne & Or)",
    description: "Ambiance haut de gamme VIP avec accents dorés et fond sombre feutré.",
    bgClass: "bg-stone-950 text-stone-100",
    cardClass: "bg-stone-900/90 border-amber-500/30 text-stone-100 shadow-md",
    textClass: "text-stone-100",
    primaryBtnClass: "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-500/20",
    accentBadgeClass: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    headerClass: "bg-stone-900/95 border-amber-500/30 text-stone-100 shadow-sm",
    borderClass: "border-stone-800"
  },
  emerald: {
    id: "emerald",
    name: "Emerald Matrix (Vert Émeraude High-Tech)",
    description: "Style high-tech émeraude, vif et énergique pour club e-Sport.",
    bgClass: "bg-emerald-950/95 text-emerald-50",
    cardClass: "bg-slate-900/90 border-emerald-500/30 text-slate-100 shadow-md",
    textClass: "text-emerald-50",
    primaryBtnClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20",
    accentBadgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    headerClass: "bg-slate-900/95 border-emerald-500/30 text-white shadow-sm",
    borderClass: "border-emerald-900/50"
  },
  indigo: {
    id: "indigo",
    name: "Indigo Glass (Futuriste Soft)",
    description: "Design futuriste doux avec effets de verre fumé et teintes bleu roi.",
    bgClass: "bg-slate-900 text-slate-100",
    cardClass: "bg-slate-800/80 backdrop-blur-md border-indigo-500/30 text-slate-100 shadow-md",
    textClass: "text-slate-100",
    primaryBtnClass: "bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20",
    accentBadgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40",
    headerClass: "bg-slate-800/90 backdrop-blur-md border-indigo-500/30 text-white shadow-sm",
    borderClass: "border-slate-700/60"
  }
};
