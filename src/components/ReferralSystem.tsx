import React, { useState, useEffect } from "react";
import { User, ReferralSettings, Referral } from "../types";
import {
  Users,
  Gift,
  Award,
  DollarSign,
  Settings,
  UserCheck,
  CheckCircle,
  Copy,
  PlusCircle,
  TrendingUp,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Zap,
  Tag,
  Share2
} from "lucide-react";
import {
  fetchReferralSettings,
  updateReferralSettings,
  fetchReferrals,
  linkReferral,
  payoutStaffBonus
} from "../api";

interface ReferralSystemProps {
  users: User[];
  currentUser: User;
  onRefreshData?: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({
  users,
  currentUser,
  onRefreshData
}) => {
  const [settings, setSettings] = useState<ReferralSettings>({
    customerThreshold: 3,
    customerRewardType: "free_session",
    customerRewardValue: 1,
    staffBonusPerReferralFcfa: 500,
    minSpentForQualifiedReferralFcfa: 1000,
    isSystemActive: true
  });

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Link referral form state
  const [referrerCodeInput, setReferrerCodeInput] = useState<string>("");
  const [selectedReferredUserId, setSelectedReferredUserId] = useState<string>("");
  const [linking, setLinking] = useState<boolean>(false);

  // Payout modal or trigger state
  const [payoutStaffId, setPayoutStaffId] = useState<string>("");
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payingOut, setPayingOut] = useState<boolean>(false);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, rData] = await Promise.all([
        fetchReferralSettings(),
        fetchReferrals()
      ]);
      if (sData) setSettings(sData);
      if (rData) setReferrals(rData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setMessage(null);
      await updateReferralSettings(settings);
      setMessage({ text: "Conditions et récompenses de parrainage enregistrées avec succès !", type: "success" });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessage({ text: err.message || "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLinkReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerCodeInput || !selectedReferredUserId) {
      setMessage({ text: "Veuillez saisir un code parrain et sélectionner un filleul.", type: "error" });
      return;
    }
    try {
      setLinking(true);
      setMessage(null);
      await linkReferral(referrerCodeInput.trim(), selectedReferredUserId);
      setMessage({ text: "Parrainage enregistré avec succès !", type: "success" });
      setReferrerCodeInput("");
      setSelectedReferredUserId("");
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessage({ text: err.message || "Erreur lors de l'enregistrement", type: "error" });
    } finally {
      setLinking(false);
    }
  };

  const handlePayoutStaff = async (staffUser: User) => {
    const bonus = staffUser.staffBonusBalanceFcfa || 0;
    if (bonus <= 0) {
      setMessage({ text: `Aucune prime en attente pour ${staffUser.name}`, type: "error" });
      return;
    }
    if (!window.confirm(`Confirmer le versement de la prime de ${bonus.toLocaleString()} FCFA sur le salaire de ${staffUser.name} ?`)) {
      return;
    }
    try {
      setPayingOut(true);
      setMessage(null);
      await payoutStaffBonus(staffUser.id, bonus);
      setMessage({ text: `Prime de ${bonus.toLocaleString()} FCFA versée avec succès à ${staffUser.name} !`, type: "success" });
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessage({ text: err.message || "Erreur lors du versement", type: "error" });
    } finally {
      setPayingOut(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const staffUsers = users.filter(u => u.role === "staff" || u.role === "admin");
  const customerUsers = users.filter(u => u.role === "customer");

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                DEK-DRIVSIM Rewards
              </span>
              <span className="text-xs text-indigo-300 font-mono">Module Parrainage & Primes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Programme de Parrainage & Primes Caissiers
            </h1>
            <p className="text-sm text-indigo-200/90 mt-1 max-w-2xl">
              Fidélisez les clients en leur offrant des sessions gratuites et motivez vos caissiers avec des primes sur le salaire pour chaque nouveau client recruté.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Règles Personnalisables</div>
              <div className="text-indigo-200 text-[11px]">Seuils, Primes & Récompenses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Toast Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border shadow-sm transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid Layout: Config Panel (Admin) + Quick Link Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ADMIN CONFIGURATION PANEL (2 columns on large screens) */}
        {currentUser.role === "admin" && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Configuration des Conditions & Récompenses
                  </h2>
                  <p className="text-xs text-slate-500">
                    Définissez vous-même les règles de parrainage clients et les primes du personnel
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isSystemActive}
                  onChange={(e) => setSettings({ ...settings, isSystemActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {settings.isSystemActive ? "Système Actif" : "Inactif"}
                </span>
              </label>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Customer Reward Conditions */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-indigo-600" />
                  1. Programme de Parrainage CLIENTS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre de filleuls requis (Seuil) :
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settings.customerThreshold}
                        onChange={(e) => setSettings({ ...settings, customerThreshold: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">clients amenés</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Ex: Après 3 clients parrainés, le client gagne 1 session.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Type de Récompense Client :
                    </label>
                    <select
                      value={settings.customerRewardType}
                      onChange={(e) => setSettings({ ...settings, customerRewardType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="free_session">Session(s) Gratuite(s)</option>
                      <option value="discount_fcfa">Crédit Solde FCFA Direct</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valeur de la Récompense Client :
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={settings.customerRewardValue}
                        onChange={(e) => setSettings({ ...settings, customerRewardValue: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                        {settings.customerRewardType === "free_session" ? "session(s)" : "FCFA"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dépense Min. du Filleul pour valider :
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={settings.minSpentForQualifiedReferralFcfa}
                        onChange={(e) => setSettings({ ...settings, minSpentForQualifiedReferralFcfa: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">FCFA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff / Cashier Salary Bonus Conditions */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  2. Primes de Salaire CAISSIERS / PERSONNEL
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bonus accordé sur le salaire du Caissier par client payant recruté :
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={settings.staffBonusPerReferralFcfa}
                      onChange={(e) => setSettings({ ...settings, staffBonusPerReferralFcfa: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-purple-700">FCFA / client</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Chaque fois qu'un caissier enregistre un nouveau client payant avec son code parrain, cette somme s'ajoute automatiquement à son solde de primes salariales.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {savingSettings ? "Enregistrement..." : "Enregistrer les Règles de Parrainage"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QUICK LINK REFERRAL FORM */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 ${currentUser.role !== "admin" ? "lg:col-span-3" : ""}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enregistrer un Parrainage</h2>
              <p className="text-xs text-slate-500">Associer un client à son parrain (caissier ou client)</p>
            </div>
          </div>

          <form onSubmit={handleLinkReferral} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code Parrain (Caissier ou Client) :
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: REF-MOUSSA-402 ou REF-LUCAS-101"
                  value={referrerCodeInput}
                  onChange={(e) => setReferrerCodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <Tag className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sélectionner le Filleul (Nouveau Client) :
              </label>
              <select
                value={selectedReferredUserId}
                onChange={(e) => setSelectedReferredUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choisir le client filleul --</option>
                {customerUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={linking}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {linking ? "Validation..." : "Valider le Parrainage"}
            </button>
          </form>

          {/* Quick Staff Referral Codes list helper */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
              Codes Parrain des Caissiers :
            </span>
            <div className="space-y-1.5">
              {staffUsers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">{s.name} ({s.role})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                      {s.referralCode || `REF-${s.name.split(' ')[0].toUpperCase()}`}
                    </span>
                    <button
                      onClick={() => setReferrerCodeInput(s.referralCode || `REF-${s.name.split(' ')[0].toUpperCase()}`)}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Utiliser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* STAFF & CASHIER SALARY BONUS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Suivi des Primes de Salaire des Caissiers
              </h2>
              <p className="text-xs text-slate-500">
                Chaque client payant rapporté donne droit à {settings.staffBonusPerReferralFcfa.toLocaleString()} FCFA de prime sur le salaire
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffUsers.map((staff) => {
            const bonusBalance = staff.staffBonusBalanceFcfa || 0;
            const staffRefList = referrals.filter(r => r.referrerId === staff.id);

            return (
              <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase rounded border border-purple-200">
                      Caissier / Staff
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{staff.name}</h3>
                    <p className="text-[11px] text-slate-500">{staff.email}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Code Parrain</span>
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {staff.referralCode}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Clients Parrainés</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{staffRefList.length} clients</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Primes en Attente</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">{bonusBalance.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {currentUser.role === "admin" && (
                  <button
                    onClick={() => handlePayoutStaff(staff)}
                    disabled={bonusBalance <= 0 || payingOut}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    {bonusBalance > 0 ? "Verser la Prime de Salaire" : "Aucune Prime en Attente"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOMERS REFERRAL CODES & REWARDS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Codes de Parrainage & Récompenses Clients
              </h2>
              <p className="text-xs text-slate-500">
                Objectif : {settings.customerThreshold} filleuls = {settings.customerRewardValue} {settings.customerRewardType === "free_session" ? "session gratuite" : "FCFA crédit"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Code Parrain Unique</th>
                <th className="py-3 px-4">Filleuls Amenés</th>
                <th className="py-3 px-4">Sessions Gratuites</th>
                <th className="py-3 px-4 text-right">Actions / Partage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {customerUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    Aucun client enregistré.
                  </td>
                </tr>
              ) : (
                customerUsers.map((user) => {
                  const userRefs = referrals.filter(r => r.referrerId === user.id);
                  const code = user.referralCode || `REF-${user.name.split(' ')[0].toUpperCase()}-101`;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {user.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{user.email}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <span className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
                          {code}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {userRefs.length} filleul(s)
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs border border-amber-200">
                          🎁 {user.freeSessionsCount || 0} session(s)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedCode === code ? "Copié !" : "Copier le Code"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFERRALS HISTORY & LOGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Historique Complet des Parrainages Enregistrés
              </h2>
              <p className="text-xs text-slate-500">
                Journal chronologique des liaisons parrains - filleuls
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Parrain</th>
                <th className="py-3 px-4">Rôle Parrain</th>
                <th className="py-3 px-4">Filleul (Nouveau Client)</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Prime Caissier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    Aucun parrainage enregistré pour l'instant.
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString("fr-FR")}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {ref.referrerName}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ref.referrerRole === "staff" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {ref.referrerRole === "staff" ? "Caissier" : "Client"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {ref.referredUserName}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] border border-emerald-200">
                        ✓ Qualifié
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                      {ref.staffBonusEarnedFcfa > 0 ? `+${ref.staffBonusEarnedFcfa.toLocaleString()} FCFA` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
