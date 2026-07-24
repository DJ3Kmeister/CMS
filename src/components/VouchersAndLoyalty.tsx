import React, { useState } from "react";
import { User, Voucher } from "../types";
import { Ticket, Award, Plus, Printer, CheckCircle2, Gift, QrCode, Search, Copy, Sparkles, Check, RefreshCw, Smartphone } from "lucide-react";

interface VouchersAndLoyaltyProps {
  users: User[];
  vouchers: Voucher[];
  currentUser: User;
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
}

export const VouchersAndLoyalty: React.FC<VouchersAndLoyaltyProps> = ({
  users,
  vouchers,
  currentUser,
  onGenerateVouchers,
  onRedeemVoucher,
  onAddLoyaltyStamp,
  onRedeemFreeSession
}) => {
  const [activeTab, setActiveTab] = useState<"vouchers" | "loyalty">("vouchers");

  // Vouchers state
  const [ticketPreset, setTicketPreset] = useState<"1h" | "2h" | "nuit" | "custom">("1h");
  const [customTitle, setCustomTitle] = useState("Pass Gaming 1 Heure");
  const [customDuration, setCustomDuration] = useState(60);
  const [customPrice, setCustomPrice] = useState(1000);
  const [ticketCount, setTicketCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Voucher redemption
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [redeemTargetUserId, setRedeemTargetUserId] = useState(currentUser.id);
  const [redeemMsg, setRedeemMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Printable tickets modal state
  const [printingVouchers, setPrintingVouchers] = useState<Voucher[] | null>(null);

  // Loyalty state
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [selectedLoyaltyUser, setSelectedLoyaltyUser] = useState<User>(
    users.find((u) => u.role === "customer") || users[0] || currentUser
  );
  const [loyaltyMsg, setLoyaltyMsg] = useState<string | null>(null);
  const [printingLoyaltyCard, setPrintingLoyaltyCard] = useState<User | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Handle Ticket preset change
  const handlePresetSelect = (preset: "1h" | "2h" | "nuit" | "custom") => {
    setTicketPreset(preset);
    if (preset === "1h") {
      setCustomTitle("Pass Gaming 1 Heure");
      setCustomDuration(60);
      setCustomPrice(1000);
    } else if (preset === "2h") {
      setCustomTitle("Pass Duo 2 Heures");
      setCustomDuration(120);
      setCustomPrice(2000);
    } else if (preset === "nuit") {
      setCustomTitle("Pass Nuit All-Night (8h)");
      setCustomDuration(480);
      setCustomPrice(5000);
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGenerateVouchers({
        count: ticketCount,
        title: customTitle,
        durationMinutes: customDuration,
        priceFcfa: customPrice,
        createdBy: currentUser.name
      });
      alert(`🎉 ${ticketCount} Ticket(s) de recharge généré(s) avec succès !`);
    } catch (err: any) {
      alert(err.message || "Erreur de génération des tickets");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) return;
    setRedeemMsg(null);
    try {
      await onRedeemVoucher(redeemCodeInput, redeemTargetUserId);
      setRedeemMsg({
        type: "success",
        text: `✅ Code valide ! Solde rechargé avec succès.`
      });
      setRedeemCodeInput("");
    } catch (err: any) {
      setRedeemMsg({
        type: "error",
        text: err.message || "Impossible d'activer ce code."
      });
    }
  };

  const handleAddStampClick = async (userId: string) => {
    try {
      await onAddLoyaltyStamp(userId);
      setLoyaltyMsg("🎉 1 Tampon de fidélité ajouté avec succès !");
      setTimeout(() => setLoyaltyMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'ajout du tampon");
    }
  };

  const handleRedeemFreeClick = async (userId: string) => {
    try {
      await onRedeemFreeSession(userId);
      setLoyaltyMsg("🎁 1 Session gratuite (1000 FCFA credit) activée avec succès !");
      setTimeout(() => setLoyaltyMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'échange de session");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const customers = users.filter((u) => u.role === "customer" || u.role === "staff");
  const filteredLoyaltyUsers = customers.filter(
    (u) =>
      u.name.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
      u.email.toLowerCase().includes(loyaltySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Codes Tickets & Cartes de Fidélité <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Générez des tickets d'accès imprimables pour la caisse et gérez le programme de tampons à points client (10 sessions = 1 offerte).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex items-center border border-slate-200">
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === "vouchers"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Générateur Codes Tickets ({vouchers.filter((v) => !v.isUsed).length} Actifs)
          </button>

          <button
            onClick={() => setActiveTab("loyalty")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === "loyalty"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="w-4 h-4" />
            Cartes à Points Fidélité
          </button>
        </div>
      </div>

      {/* TAB 1: CODES TICKETS IMPRIMABLES */}
      {activeTab === "vouchers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Generate Form & Redeem Code */}
          <div className="space-y-6">
            
            {/* Generator Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Ticket className="w-5 h-5 text-indigo-600" />
                Générer des Tickets d'Accès
              </h2>

              <form onSubmit={handleGenerateSubmit} className="space-y-4">
                
                {/* Presets buttons */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Tarifs Prédéfinis</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handlePresetSelect("1h")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        ticketPreset === "1h"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold">Pass 1 Heure</div>
                      <div className="text-indigo-600 font-mono font-bold mt-0.5">1 000 FCFA</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetSelect("2h")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        ticketPreset === "2h"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold">Pass 2 Heures</div>
                      <div className="text-indigo-600 font-mono font-bold mt-0.5">2 000 FCFA</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetSelect("nuit")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        ticketPreset === "nuit"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold">Pass Nuit 8h</div>
                      <div className="text-indigo-600 font-mono font-bold mt-0.5">5 000 FCFA</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Titre du Ticket</label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Durée (Minutes)</label>
                    <input
                      type="number"
                      step="15"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Valeur (FCFA)</label>
                    <input
                      type="number"
                      step="500"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Quantité à Imprimer</label>
                  <select
                    value={ticketCount}
                    onChange={(e) => setTicketCount(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={1}>1 Ticket unique</option>
                    <option value={3}>3 Tickets d'accès</option>
                    <option value={5}>5 Tickets d'accès</option>
                    <option value={10}>10 Tickets d'accès</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isGenerating ? "Création en cours..." : `Générer ${ticketCount} Code(s) Ticket`}
                </button>

              </form>
            </div>

            {/* Redeem Code Card (For Staff / Admin / Customer Desk) */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Valider un Code Coupon au Comptoir
              </h2>

              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                
                {redeemMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      redeemMsg.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                        : "bg-rose-50 border-rose-200 text-rose-800 font-medium"
                    }`}
                  >
                    {redeemMsg.text}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Activer pour l'utilisateur</label>
                  <select
                    value={redeemTargetUserId}
                    onChange={(e) => setRedeemTargetUserId(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) — Solde: {u.balance.toLocaleString()} FCFA
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Code Ticket Imprimé</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: CYBER-1H-8921"
                    value={redeemCodeInput}
                    onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Valider et Recharger le Solde FCFA
                </button>

              </form>
            </div>

          </div>

          {/* Right Column: Vouchers List & Imprimer Tickets */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Historique des Codes Tickets Générés
                  </h2>
                  <p className="text-xs text-slate-500">
                    {vouchers.length} codes générés au total • {vouchers.filter((v) => !v.isUsed).length} disponibles
                  </p>
                </div>

                {vouchers.length > 0 && (
                  <button
                    onClick={() => setPrintingVouchers(vouchers.filter((v) => !v.isUsed).slice(0, 8))}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer la Planche de Tickets
                  </button>
                )}
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                      <th className="py-2.5 px-3">Code Ticket</th>
                      <th className="py-2.5 px-3">Intitulé</th>
                      <th className="py-2.5 px-3">Valeur FCFA</th>
                      <th className="py-2.5 px-3">Durée</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {vouchers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Aucun code ticket généré pour le moment.
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                            {v.code}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{v.title}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                            {v.priceFcfa.toLocaleString()} FCFA
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">{v.durationMinutes} min</td>
                          <td className="py-3 px-3">
                            {v.isUsed ? (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                Utilisé ({v.usedByUserName})
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                En Attente (Actif)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button
                              onClick={() => copyToClipboard(v.code)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              title="Copier le code"
                            >
                              {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setPrintingVouchers([v])}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              title="Imprimer ce ticket"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CARTES À POINTS & FIDÉLITÉ */}
      {activeTab === "loyalty" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Customer Selector */}
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                Sélectionner un Client
              </h2>

              <input
                type="text"
                placeholder="Chercher nom ou email client..."
                value={loyaltySearch}
                onChange={(e) => setLoyaltySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredLoyaltyUsers.map((u) => {
                  const stamps = u.loyaltyStamps || 0;
                  const isSelected = selectedLoyaltyUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedLoyaltyUser(u)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-indigo-700">{stamps}/10 Tampons</span>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {(u.freeSessionsCount || 0) > 0 ? `${u.freeSessionsCount} Offerte(s)` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Digital Loyalty Card */}
          <div className="lg:col-span-2 space-y-6">
            
            {loyaltyMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl flex items-center gap-2 animate-bounce">
                <Gift className="w-5 h-5 text-emerald-600" />
                {loyaltyMsg}
              </div>
            )}

            {/* Loyalty Card Canvas Box */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-indigo-800/50 relative overflow-hidden space-y-6">
              
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    CARTE DE FIDÉLITÉ CYBERCAFÉ
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">{selectedLoyaltyUser.name}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Membre : {selectedLoyaltyUser.email}</p>
                </div>

                <div className="text-right">
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase shadow-md">
                    10 Sessions = 1 Offerte
                  </span>
                  <div className="text-[11px] text-indigo-200 font-mono mt-1">ID: MEM-{selectedLoyaltyUser.id.toUpperCase()}</div>
                </div>
              </div>

              {/* 10 Stamp Grid (Interactive) */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Progression des Tampons ({selectedLoyaltyUser.loyaltyStamps || 0} / 10)</span>
                  {(selectedLoyaltyUser.freeSessionsCount || 0) > 0 && (
                    <span className="text-amber-400 font-extrabold flex items-center gap-1 animate-pulse">
                      <Gift className="w-4 h-4" /> {selectedLoyaltyUser.freeSessionsCount} Session(s) Gratuite(s) Débloquée(s) !
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isStamped = idx < (selectedLoyaltyUser.loyaltyStamps || 0);
                    const isTenth = idx === 9;

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all duration-300 ${
                          isStamped
                            ? "bg-amber-400 border-amber-300 text-slate-950 shadow-lg shadow-amber-400/30 scale-105 font-black"
                            : isTenth
                            ? "bg-indigo-900/60 border-amber-400/80 text-amber-300 animate-pulse font-bold"
                            : "bg-white/5 border-white/20 text-slate-400"
                        }`}
                      >
                        {isStamped ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-6 h-6 text-slate-950 fill-slate-950" />
                            <span className="text-[10px] font-black uppercase mt-1">Valide</span>
                          </div>
                        ) : isTenth ? (
                          <div className="flex flex-col items-center">
                            <Gift className="w-6 h-6 text-amber-400" />
                            <span className="text-[9px] font-extrabold uppercase mt-0.5">Offerte !</span>
                          </div>
                        ) : (
                          <span className="text-sm font-mono font-bold opacity-40">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Controls for Staff / Admin */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-indigo-200">
                  Solde Actuel : <strong className="text-emerald-400 font-mono text-sm">{selectedLoyaltyUser.balance.toLocaleString()} FCFA</strong>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setPrintingLoyaltyCard(selectedLoyaltyUser)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer Carte Client
                  </button>

                  <button
                    onClick={() => handleAddStampClick(selectedLoyaltyUser.id)}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    +1 Tampon (Valider Session)
                  </button>

                  {(selectedLoyaltyUser.freeSessionsCount || 0) > 0 && (
                    <button
                      onClick={() => handleRedeemFreeClick(selectedLoyaltyUser.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <Gift className="w-4 h-4" />
                      Utiliser 1 Session Gratuite
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL: PRINTABLE TICKETS PAGE */}
      {printingVouchers && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 overflow-hidden space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                Impression de Tickets de Recharge ({printingVouchers.length})
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Lancer Impression
                </button>
                <button
                  onClick={() => setPrintingVouchers(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Tickets Print Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2" id="printable-tickets">
              {printingVouchers.map((v) => (
                <div
                  key={v.id}
                  className="border-2 border-dashed border-slate-400 p-4 rounded-2xl bg-slate-50 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <div className="font-extrabold text-xs text-indigo-900">CYBERCAFÉ PRO</div>
                      <div className="text-[10px] text-slate-500 font-medium">{v.title}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-700">{v.priceFcfa.toLocaleString()} FCFA</span>
                      <div className="text-[9px] text-slate-400 font-bold">{v.durationMinutes} min d'Accès</div>
                    </div>
                  </div>

                  <div className="text-center py-2 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Code Coupon</div>
                    <div className="text-lg font-mono font-black text-indigo-700 tracking-wider">
                      {v.code}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <QrCode className="w-4 h-4 text-slate-700" />
                      <span>Scanner à la caisse ou mobile</span>
                    </div>
                    <span>Émis par : {v.createdBy}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE LOYALTY CARD */}
      {printingLoyaltyCard && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                Impression Carte de Fidélité
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Imprimer
                </button>
                <button
                  onClick={() => setPrintingLoyaltyCard(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Pocket Loyalty Card */}
            <div className="border-2 border-slate-900 rounded-2xl p-6 bg-slate-900 text-white space-y-4 shadow-md" id="printable-loyalty-card">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400">CARTE DE FIDÉLITÉ OFFICIELLE</div>
                  <h4 className="text-base font-black text-white">{printingLoyaltyCard.name}</h4>
                  <p className="text-[10px] text-slate-400">{printingLoyaltyCard.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">
                    10 SESSIONS = 1 OFFERTE
                  </span>
                </div>
              </div>

              {/* 10 Boxes */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const isStamped = idx < (printingLoyaltyCard.loyaltyStamps || 0);
                  return (
                    <div
                      key={idx}
                      className={`h-10 rounded-lg border flex items-center justify-center text-xs font-bold ${
                        isStamped ? "bg-amber-400 border-amber-300 text-slate-950 font-black" : "border-slate-700 bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isStamped ? "✓" : idx === 9 ? "🎁" : idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Presentez cette carte au comptoir</span>
                <span className="font-mono">ID: {printingLoyaltyCard.id}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
