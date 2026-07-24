import React from "react";
import { User, Role } from "../types";
import { Monitor, Smartphone, Wallet, ShieldAlert, UserCheck, RefreshCw, Zap, PlusCircle, Bell } from "lucide-react";

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTopup: () => void;
  isConnected: boolean;
  activeSessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeTab,
  setActiveTab,
  onOpenTopup,
  isConnected,
  activeSessionCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  CyberCafé Pro
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  v2.4 En direct
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isConnected ? 'Synchro Temps Réel' : 'Reconnexion...'}
                </span>
                <span>•</span>
                <span className="text-indigo-600 font-medium">{activeSessionCount} {activeSessionCount === 1 ? 'Session Active' : 'Sessions Actives'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab("computers")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "computers"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Parc PC
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "pos"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Caisse & Snacks
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "reservations"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Réservations
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "vouchers"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Tickets & Fidélité
            </button>
            <button
              onClick={() => setActiveTab("referrals")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "referrals"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Parrainage & Primes
            </button>
            <button
              onClick={() => setActiveTab("fcm-push")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                activeTab === "fcm-push"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Bell className="w-4 h-4 text-amber-400" /> Push FCM & LAN
            </button>
            <button
              onClick={() => setActiveTab("remote-task")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "remote-task"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Remote Task Agent
            </button>
            <button
              onClick={() => setActiveTab("mobile-simulator")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === "mobile-simulator"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              App Mobile Staff
            </button>
            <button
              onClick={() => setActiveTab("code-export")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "code-export"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Docker & Code
            </button>
          </nav>

          {/* User Profile & Wallet */}
          <div className="flex items-center gap-3">
            {/* Wallet Quick Balance Button */}
            <button
              onClick={onOpenTopup}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-xl transition text-sm shadow-sm group"
            >
              <Wallet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Solde</div>
                <div className="text-sm font-bold text-emerald-600 font-mono">
                  {currentUser.balance.toLocaleString()} FCFA
                </div>
              </div>
              <PlusCircle className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
            </button>

            {/* Role Switcher Select */}
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = users.find((u) => u.id === e.target.value);
                  if (found) onSelectUser(found);
                }}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer shadow-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === "admin" ? "ADMIN" : u.role === "staff" ? "PERSONNEL" : "CLIENT"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav subbar for mobile screens */}
      <div className="md:hidden flex overflow-x-auto gap-2 p-2.5 bg-slate-900 border-t border-slate-800 text-white scrollbar-none shadow-inner">
        {[
          { id: "dashboard", label: "Synthèse", icon: "📊" },
          { id: "computers", label: "Parc PC", icon: "🖥️" },
          { id: "pos", label: "Caisse & Snacks", icon: "🍿" },
          { id: "reservations", label: "Réservations", icon: "📅" },
          { id: "vouchers", label: "Tickets", icon: "🎟️" },
          { id: "referrals", label: "Fidélité", icon: "🎁" },
          { id: "fcm-push", label: "Push FCM", icon: "🔔" },
          { id: "mobile-simulator", label: "App Staff Mobile", icon: "📱" },
          { id: "code-export", label: "Guide & Code", icon: "⚙️" },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === tabItem.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                : "text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <span>{tabItem.icon}</span>
            <span>{tabItem.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
