import React, { useState } from "react";
import { DashboardStats, Session, Computer, Order, Transaction, User, Role, ThemeId, Voucher } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Monitor, DollarSign, Users, ShoppingBag, Clock, Activity, Zap, ShieldAlert, UserPlus, Shield, Smartphone, Key, Trash2, Edit, Eye, EyeOff, Search, Printer, Palette, Ticket, Award, FileText, Sparkles } from "lucide-react";
import { THEMES } from "../theme";
import { ReportsModal } from "./ReportsModal";
import { VouchersAndLoyalty } from "./VouchersAndLoyalty";
import { ReferralSystem } from "./ReferralSystem";

interface AdminDashboardProps {
  stats: DashboardStats;
  sessions: Session[];
  computers: Computer[];
  orders: Order[];
  transactions: Transaction[];
  users: User[];
  currentUser: User;
  currentThemeId: ThemeId;
  onChangeTheme: (themeId: ThemeId) => Promise<void>;
  vouchers: Voucher[];
  onGenerateVouchers: (params: {
    count: number;
    title: string;
    durationMinutes: number;
    priceFcfa: number;
    createdBy: string;
  }) => Promise<void>;
  onRedeemVoucher: (code: string, userId: string) => Promise<void>;
  onAddLoyaltyStamp: (userId: string) => Promise<void>;
  onRedeemFreeSession: (userId: string) => Promise<void>;
  onStopSession: (sessionId: string) => void;
  onOpenNewSessionModal: () => void;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onAddUser: (userData: { name: string; email: string; role: Role; balance?: number; password?: string; pin?: string }) => Promise<void>;
  onUpdateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  sessions,
  computers,
  orders,
  transactions,
  users,
  currentUser,
  currentThemeId,
  onChangeTheme,
  vouchers,
  onGenerateVouchers,
  onRedeemVoucher,
  onAddLoyaltyStamp,
  onRedeemFreeSession,
  onStopSession,
  onOpenNewSessionModal,
  onUpdateOrderStatus,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"telemetry" | "employees" | "vouchers-loyalty">("telemetry");
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Employee management state
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "admin" | "customer">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showPins, setShowPins] = useState<{ [key: string]: boolean }>({});

  // Form states for adding/editing user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff" as Role,
    balance: 0,
    password: "",
    pin: "1234",
    vipTier: "standard" as "standard" | "vip" | "pro"
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock hourly revenue chart data
  const revenueChartData = [
    { time: "08:00", revenue: 45000, occupancy: 20 },
    { time: "10:00", revenue: 85000, occupancy: 40 },
    { time: "12:00", revenue: 140000, occupancy: 65 },
    { time: "14:00", revenue: 210000, occupancy: 85 },
    { time: "16:00", revenue: 290000, occupancy: 90 },
    { time: "18:00", revenue: 380000, occupancy: 95 },
    { time: "20:00", revenue: 450000, occupancy: 88 },
    { time: "22:00", revenue: 510000, occupancy: 70 }
  ];

  const activeSessions = sessions.filter((s) => s.status === "active");

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const staffCount = users.filter((u) => u.role === "staff").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      email: "",
      role: "staff",
      balance: 10000,
      password: "staff" + Math.floor(100 + Math.random() * 900),
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      vipTier: "standard"
    });
    setFormError("");
    setShowAddUserModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      password: user.password || "",
      pin: user.pin || "1234",
      vipTier: user.vipTier
    });
    setFormError("");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError("Le nom et l'adresse email sont requis.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, formData);
        setEditingUser(null);
      } else {
        await onAddUser(formData);
        setShowAddUserModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement de l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await onDeleteUser(deletingUser.id);
      setDeletingUser(null);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const togglePinVisibility = (userId: string) => {
    setShowPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Centre de Contrôle CyberCafé <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervision du parc PC, personnalisation du design, rapports financiers et tickets de fidélité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Theme Customizer Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 px-2 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              Design :
            </span>
            {Object.keys(THEMES).map((tId) => {
              const themeObj = THEMES[tId as ThemeId];
              const isSelected = currentThemeId === tId;
              return (
                <button
                  key={tId}
                  onClick={() => onChangeTheme(tId as ThemeId)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title={`Changer de design : ${themeObj.name}`}
                >
                  {themeObj.name.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Printable Report Button */}
          <button
            onClick={() => setShowReportsModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Rapport Financier
          </button>

          {/* Sub-Tabs Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setActiveAdminSubTab("telemetry")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminSubTab === "telemetry"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Télémétrie
            </button>

            <button
              onClick={() => setActiveAdminSubTab("employees")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminSubTab === "employees"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Employés ({staffCount})
            </button>

            <button
              onClick={() => setActiveAdminSubTab("vouchers-loyalty")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminSubTab === "vouchers-loyalty"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Tickets & Fidélité
            </button>

            <button
              onClick={() => setActiveAdminSubTab("referrals")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminSubTab === "referrals"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Parrainage & Primes
            </button>
          </div>

          <button
            onClick={onOpenNewSessionModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            Session PC
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TELEMETRY & DASHBOARD */}
      {activeAdminSubTab === "telemetry" && (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Sessions & Occupancy */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux d'Occupation</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{stats.occupancyRate}%</span>
                <span className="text-xs text-indigo-600 font-medium">
                  {stats.occupiedComputers} / {stats.totalComputers} PC Utilisés
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>

            {/* Card 2: Today Revenue */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenu du Jour</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {stats.todayRevenue.toLocaleString()} FCFA
                </span>
                <span className="text-xs text-emerald-600 font-medium">+18.4% vs hier</span>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Mise à jour en direct via WebSockets
              </div>
            </div>

            {/* Card 3: Active Employees & Users */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Comptes Utilisateurs</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{users.length}</span>
                <span className="text-xs text-blue-600 font-medium">{staffCount} Employés actifs</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {adminCount} Admin • {customerCount} Clients enregistrés
              </div>
            </div>

            {/* Card 4: Orders Pending */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Commandes Caisse</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{stats.pendingOrdersCount}</span>
                <span className="text-xs text-amber-600 font-medium">À Livrer aux Postes</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {orders.filter((o) => o.status === "delivered").length} livrées aujourd'hui
              </div>
            </div>
          </div>

          {/* Revenue Chart & Live Active Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Évolution des Revenus FCFA</h2>
                  <p className="text-xs text-slate-500">Courbe de chiffre d'affaires accumulé au cours de la journée</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  Heure par Heure
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenu (FCFA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Computers Quick Status Summary */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Aperçu de la Flotte PC</h2>
                <p className="text-xs text-slate-500 mb-4">Statut en direct des ordinateurs du réseau</p>

                <div className="space-y-3">
                  {computers.slice(0, 5).map((pc) => (
                    <div key={pc.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${pc.status === 'in_use' ? 'bg-indigo-600 animate-pulse' : pc.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <div>
                          <div className="font-bold text-slate-800">{pc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pc.ip}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-medium text-slate-700">{pc.hourlyRate} FCFA/h</span>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">
                          {pc.status === "in_use" ? "En utilisation" : pc.status === "available" ? "Disponible" : pc.status === "locked" ? "Verrouillé" : "Maintenance"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions & Latest Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Sessions */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Sessions Actives en Cours
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {activeSessions.length}
                  </span>
                </h2>
              </div>

              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aucune session active en ce moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((sess) => (
                    <div key={sess.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{sess.computerName}</div>
                        <div className="text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-700">{sess.userName}</span>
                          <span>•</span>
                          <span>Début : {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Coût: <strong className="text-emerald-700 font-mono">{sess.totalCost} FCFA</strong></span>
                          <span>Alloué: {sess.allocatedMinutes} min</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onStopSession(sess.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs transition cursor-pointer"
                      >
                        Arrêter Session
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders Management */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Dernières Commandes Caisse</h2>
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        Commande #{ord.id} • {ord.userName}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-emerald-700">{ord.totalPrice.toLocaleString()} FCFA</span>
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-1.5 font-medium cursor-pointer"
                      >
                        <option value="pending">En Attente</option>
                        <option value="preparing">En Préparation</option>
                        <option value="delivered">Livré au PC</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: EMPLOYEE MANAGEMENT & ACCÈS */}
      {activeAdminSubTab === "employees" && (
        <div className="space-y-6">
          
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Administrateurs</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Accès total au système</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Employés de Caisse (Staff)</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{staffCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Accès Opérationnel & POS</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Clients Enregistrés</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{customerCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Accès App Client / Réservations</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Controls & Employee Accounts Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header Toolbar */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Gestion des Comptes & Droits d'Accès
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Créez et configurez les identifiants pour vos employés et gérants de caisse.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`px-2.5 py-1 font-medium rounded-lg transition ${
                      roleFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setRoleFilter("staff")}
                    className={`px-2.5 py-1 font-medium rounded-lg transition ${
                      roleFilter === "staff" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Employés ({staffCount})
                  </button>
                  <button
                    onClick={() => setRoleFilter("admin")}
                    className={`px-2.5 py-1 font-medium rounded-lg transition ${
                      roleFilter === "admin" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Admins
                  </button>
                </div>

                {/* Add User Button */}
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Nouvel Employé
                </button>
              </div>
            </div>

            {/* Table of Users */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle & Droits</th>
                    <th className="py-3 px-4">Solde FCFA</th>
                    <th className="py-3 px-4">Code PIN Mobile</th>
                    <th className="py-3 px-4">Mot de Passe</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Aucun compte trouvé correspondant aux critères.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              usr.role === "admin"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : usr.role === "staff"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}>
                              {usr.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{usr.name}</div>
                              <div className="text-[11px] text-slate-400">{usr.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          {usr.role === "admin" && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              <Shield className="w-3 h-3" /> Administrateur
                            </span>
                          )}
                          {usr.role === "staff" && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              <Key className="w-3 h-3" /> Employé (Caisse)
                            </span>
                          )}
                          {usr.role === "customer" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              Client Cyber
                            </span>
                          )}
                        </td>

                        {/* Balance */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {usr.balance.toLocaleString()} FCFA
                        </td>

                        {/* PIN Code */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800 font-bold">
                              {showPins[usr.id] ? usr.pin || "1234" : "••••"}
                            </span>
                            <button
                              onClick={() => togglePinVisibility(usr.id)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="Afficher/Masquer le PIN"
                            >
                              {showPins[usr.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Password */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {usr.password ? usr.password : "Non défini"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(usr)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Éditer les accès"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {usr.id !== "u-admin" && (
                              <button
                                onClick={() => setDeletingUser(usr)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                title="Supprimer le compte"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guide for Mobile Deployment on Employee Phones */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Comment déployer et lancer l'application sur le téléphone de vos employés ?
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Procédure simple en 4 étapes pour installer l'application sur les smartphones Android et iPhone de vos employés.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
              
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">1</span>
                  Créer le Compte
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Créez un compte avec le rôle <strong>Employé (Staff)</strong> dans ce tableau avec un mot de passe ou code PIN dédié.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">2</span>
                  Lien de l'App
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Envoyez l'URL de l'application (ex: Cloud Run, Vercel ou IP locale Wi-Fi) à vos employés par WhatsApp ou SMS.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">3</span>
                  Raccourci Mobile
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Sur Chrome (Android) ou Safari (iPhone), touchez le menu et sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong> pour l'installer comme App Mobile.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">4</span>
                  Connexion Sécurisée
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  L'employé ouvre l'icône sur son téléphone, entre ses identifiants Employé et accède uniquement aux fonctions Caisse/POS.
                </p>
              </div>

            </div>
          </div>

          {/* Security & Access Levels Matrix */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Matrice de Sécurité & Permissions d'Accès
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Fonctionnalité / Action</th>
                    <th className="py-2.5 px-3 text-center">Administrateur (Vous)</th>
                    <th className="py-2.5 px-3 text-center">Employé (Staff Caisse)</th>
                    <th className="py-2.5 px-3 text-center">Client (Joueur)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Gestion du Personnel (Créer/Supprimer comptes)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Interdit</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Interdit</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Lancer / Arrêter les sessions PC à distance</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Seul son poste</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Recharger le solde des clients (Comptoir Caisse)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Demande Caisse</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Valider les ventes de snacks / POS</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Commande seule</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Consulter le chiffre d'affaires global & Graphiques</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Autorisé</td>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-bold">Vue restreinte</td>
                    <td className="py-2.5 px-3 text-center text-rose-500 font-bold">✕ Interdit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {(showAddUserModal || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingUser ? "Éditer le Compte Utilisateur" : "Créer un Compte Employé / Utilisateur"}
              </h3>
              <button
                onClick={() => { setShowAddUserModal(false); setEditingUser(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Sarah Employé ou Moussa Caisse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="ex: staff@cybercafe.pro"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Rôle / Niveau d'Accès</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="staff">Employé (Staff Caisse)</option>
                    <option value="admin">Administrateur</option>
                    <option value="customer">Client</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Solde Initial (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Code PIN Mobile (4 chiffres)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="ex: 1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Mot de Passe</label>
                  <input
                    type="text"
                    placeholder="ex: staff123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddUserModal(false); setEditingUser(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Enregistrement..." : editingUser ? "Enregistrer les Modifications" : "Créer le Compte"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Supprimer le compte employé ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong>{deletingUser.name}</strong> ({deletingUser.email}) ?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Confirmer Suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CODES TICKETS & FIDÉLITÉ */}
      {activeAdminSubTab === "vouchers-loyalty" && (
        <VouchersAndLoyalty
          users={users}
          vouchers={vouchers}
          currentUser={currentUser}
          onGenerateVouchers={onGenerateVouchers}
          onRedeemVoucher={onRedeemVoucher}
          onAddLoyaltyStamp={onAddLoyaltyStamp}
          onRedeemFreeSession={onRedeemFreeSession}
        />
      )}

      {/* SUB-TAB 4: PARRAINAGE & PRIMES SALAIRE */}
      {activeAdminSubTab === "referrals" && (
        <ReferralSystem
          users={users}
          currentUser={currentUser}
        />
      )}

      {/* MODAL: PRINTABLE FINANCIAL REPORTS */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        stats={stats}
        transactions={transactions}
        orders={orders}
        sessions={sessions}
        computers={computers}
      />

    </div>
  );
};
