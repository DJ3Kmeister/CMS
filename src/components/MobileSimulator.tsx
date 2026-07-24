import React, { useState, useEffect } from "react";
import { User, Session, Computer, Product, Order, FcmNotificationLog, Voucher } from "../types";
import { fetchFcmLogs, redeemVoucherAndStartSession } from "../api";
import { 
  Smartphone, Monitor, ShoppingBag, Wallet, Clock, Zap, Wifi, Battery, Lock, Unlock, 
  CheckCircle, Bell, Ticket, KeyRound, LayoutDashboard, PlusCircle, UserCheck, 
  Receipt, ArrowUpRight, Check, X, RefreshCw, AlertTriangle, ShieldCheck, Search,
  Filter, Sparkles, TrendingUp, DollarSign, Send, QrCode
} from "lucide-react";

interface MobileSimulatorProps {
  currentUser: User;
  computers: Computer[];
  sessions: Session[];
  products: Product[];
  orders: Order[];
  users?: User[];
  vouchers?: Voucher[];
  onStartSession: (userId: string, pcId: string, mins: number) => void;
  onStopSession?: (sessionId: string) => void;
  onOpenTopup: () => void;
  onPlaceOrder: (userId: string, pcId: string | undefined, items: { productId: string; quantity: number }[]) => Promise<void>;
  onLockComputer?: (pcId: string) => void;
  onUnlockComputer?: (pcId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
  onGenerateVouchers?: (params: { count: number; title: string; durationMinutes: number; priceFcfa: number; createdBy: string }) => Promise<void>;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  currentUser,
  computers,
  sessions,
  products,
  orders,
  users = [],
  vouchers = [],
  onStartSession,
  onStopSession,
  onOpenTopup,
  onPlaceOrder,
  onLockComputer,
  onUnlockComputer,
  onUpdateOrderStatus,
  onGenerateVouchers
}) => {
  const [viewMode, setViewMode] = useState<"native" | "frame">("native");
  const [mobileTab, setMobileTab] = useState<"dashboard" | "pcs" | "pos" | "orders" | "push">("dashboard");
  const [selectedPc, setSelectedPc] = useState<string>("pc-01");
  const [selectedMins, setSelectedMins] = useState<number>(60);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

  // Filters & Search
  const [pcSearchQuery, setPcSearchQuery] = useState("");
  const [pcStatusFilter, setPcStatusFilter] = useState<"all" | "in_use" | "locked" | "available">("all");

  // Ticket Generator state
  const [ticketDuration, setTicketDuration] = useState<number>(60);
  const [generatedTicketCode, setGeneratedTicketCode] = useState<string | null>(null);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);

  // Redeem Ticket State
  const [codeInputValue, setCodeInputValue] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Quick Snack Sale Modal
  const [showQuickSnackModal, setShowQuickSnackModal] = useState(false);
  const [selectedSnackId, setSelectedSnackId] = useState<string>("");
  const [snackQty, setSnackQty] = useState<number>(1);
  const [isPlacingSnack, setIsPlacingSnack] = useState(false);

  // FCM Logs
  const [fcmLogs, setFcmLogs] = useState<FcmNotificationLog[]>([]);
  const [latestPush, setLatestPush] = useState<FcmNotificationLog | null>(null);

  useEffect(() => {
    const checkPushes = async () => {
      try {
        const logs = await fetchFcmLogs();
        if (logs && logs.length > 0) {
          setFcmLogs(logs);
          const newest = logs[0];
          const ageSec = (Date.now() - new Date(newest.sentAt).getTime()) / 1000;
          if (ageSec < 12) {
            setLatestPush(newest);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    checkPushes();
    const interval = setInterval(checkPushes, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateQuickTicket = async () => {
    if (!onGenerateVouchers) return;
    setIsGeneratingTicket(true);
    try {
      const price = ticketDuration === 60 ? 1000 : ticketDuration === 120 ? 2000 : ticketDuration === 180 ? 3000 : 5000;
      await onGenerateVouchers({
        count: 1,
        title: `Ticket Caissier Mobile ${ticketDuration >= 60 ? ticketDuration / 60 + 'h' : ticketDuration + 'm'}`,
        durationMinutes: ticketDuration,
        priceFcfa: price,
        createdBy: currentUser.name
      });
      // Generate a clean code for instant mobile view
      const newCode = `${ticketDuration >= 60 ? ticketDuration / 60 + 'H' : ticketDuration + 'M'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setGeneratedTicketCode(newCode);
    } catch (e) {
      alert("Erreur lors de la génération du ticket.");
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  const handleRedeemMobileCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;
    setIsSubmittingCode(true);
    setCodeMsg(null);
    try {
      const res = await redeemVoucherAndStartSession({
        code: codeInputValue.trim(),
        userId: selectedUserId,
        computerId: selectedPc
      });
      setCodeMsg({ type: "success", text: res.message });
      setCodeInputValue("");
    } catch (err: any) {
      setCodeMsg({ type: "error", text: err.message || "Code ticket invalide ou déjà utilisé." });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handlePlaceQuickSnack = async () => {
    if (!selectedSnackId) return;
    setIsPlacingSnack(true);
    try {
      await onPlaceOrder(selectedUserId, selectedPc, [{ productId: selectedSnackId, quantity: snackQty }]);
      setShowQuickSnackModal(false);
      setSnackQty(1);
      alert("Commande enregistrée avec succès à la caisse !");
    } catch (e) {
      alert("Erreur lors de l'enregistrement de la commande snack.");
    } finally {
      setIsPlacingSnack(false);
    }
  };

  // Metrics
  const activeSessionsCount = sessions.filter(s => s.status === "active").length;
  const pendingOrders = orders.filter(o => o.status === "pending");
  const availablePcs = computers.filter(c => c.status === "available").length;
  const todayRevenue = sessions.reduce((acc, s) => acc + (s.totalCost || 0), 0) + orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Filtered Computers
  const filteredComputers = computers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(pcSearchQuery.toLowerCase()) || c.ip.includes(pcSearchQuery);
    const matchesStatus = pcStatusFilter === "all" || c.status === pcStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen py-3 px-2 sm:px-4 max-w-5xl mx-auto flex flex-col items-center justify-start space-y-4">
      
      {/* Top Banner & Display Mode Switcher */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-amber-300 font-bold shadow-md shadow-indigo-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Application Staff Caissier Mobile</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                PRO PWA 100% RESPONSIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gérez votre cybercafé en mobilité sur votre téléphone portable (encaissement, déverrouillage & tickets).
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode("native")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "native"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>Plein Écran Natif</span>
          </button>
          <button
            onClick={() => setViewMode("frame")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "frame"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-300" />
            <span>Châssis Smartphone</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER: Either Native Full Screen or Smartphone Frame Mockup */}
      <div className={`transition-all duration-300 ${
        viewMode === "frame"
          ? "w-[380px] sm:w-[410px] h-[800px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none"
          : "w-full max-w-xl bg-slate-950 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col min-h-[780px]"
      }`}>
        
        {/* Android / iOS Top Status Bar (Only shown in frame mode or styled top) */}
        {viewMode === "frame" && (
          <div className="bg-slate-950 px-6 py-2.5 flex items-center justify-between text-slate-400 text-[11px] font-mono border-b border-slate-800/80 shrink-0">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto border border-slate-800" />
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        )}

        {/* STAFF APP HEADER */}
        <div className="bg-slate-900/90 backdrop-blur px-4 py-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-600/30">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono border border-indigo-500/30">
                  {currentUser.role === "admin" ? "ADMIN" : "CAISSIER"}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Caisse Active • LAN Wi-Fi OK
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTopup}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer transition"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentUser.balance.toLocaleString()} FCFA</span>
            </button>
          </div>
        </div>

        {/* Real-time FCM Push Toast (Floating Alert) */}
        {latestPush && (
          <div className="mx-3 my-2 bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-amber-500/60 flex items-start justify-between gap-2 shrink-0 animate-bounce z-30">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Alerte Staff FCM</span>
                  <span className="text-[9px] text-slate-400 font-mono">À l'instant</span>
                </div>
                <div className="text-xs font-bold text-white">{latestPush.title}</div>
                <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight">{latestPush.body}</p>
              </div>
            </div>
            <button
              onClick={() => setLatestPush(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* SCROLLABLE MOBILE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-950 text-slate-100 scrollbar-thin">
          
          {/* TAB 1: DASHBOARD / SYNTHÈSE STAFF */}
          {mobileTab === "dashboard" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-0.5 shadow-sm">
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" /> PC Occupés
                  </div>
                  <div className="text-lg font-black text-white font-mono">{activeSessionsCount} <span className="text-[10px] font-normal text-slate-400">/ {computers.length}</span></div>
                  <div className="text-[9px] text-emerald-400 font-medium">Parc en marche</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-0.5 shadow-sm">
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Caisse du Jour
                  </div>
                  <div className="text-base font-black text-emerald-400 font-mono">{todayRevenue.toLocaleString()} <span className="text-[9px]">FCFA</span></div>
                  <div className="text-[9px] text-slate-400">Total recettes</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-0.5 shadow-sm">
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-emerald-400" /> PC Libres
                  </div>
                  <div className="text-lg font-black text-emerald-300 font-mono">{availablePcs}</div>
                  <div className="text-[9px] text-slate-400">Prêts à déverrouiller</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-0.5 shadow-sm">
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-amber-400" /> Snacks en Attente
                  </div>
                  <div className="text-lg font-black text-amber-400 font-mono">{pendingOrders.length}</div>
                  <div className="text-[9px] text-amber-300/80 font-medium">Commandes au poste</div>
                </div>
              </div>

              {/* Quick Session Start Form for Staff */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Démarrage Direct Session Caissier
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    1-Tap Start
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Select PC Chips */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1.5">Poste de Jeu / PC Client</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {computers.map(c => {
                        const isSelected = selectedPc === c.id;
                        const isBusy = c.status === "in_use";
                        const isLocked = c.status === "locked";

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedPc(c.id)}
                            className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-300"
                                : isBusy
                                ? "bg-slate-900/60 text-slate-400 border-slate-800/80 opacity-60"
                                : "bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{c.name}</span>
                              {isBusy ? <Clock className="w-3 h-3 text-emerald-400" /> : isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                            </div>
                            <span className="text-[9px] opacity-80 font-mono">{c.hourlyRate} FCFA/h</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Duration Chips */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1.5">Forfait Temps</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { mins: 30, label: "30 min", price: 500 },
                        { mins: 60, label: "1 heure", price: 1000 },
                        { mins: 120, label: "2 heures", price: 2000 },
                        { mins: 180, label: "3 heures", price: 3000 },
                      ].map(item => (
                        <button
                          key={item.mins}
                          type="button"
                          onClick={() => setSelectedMins(item.mins)}
                          className={`p-2 rounded-xl text-center border text-xs transition cursor-pointer ${
                            selectedMins === item.mins
                              ? "bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md"
                              : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 font-medium"
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[9px] font-mono opacity-80">{item.price} FCFA</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select User */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Attribuer au Joueur</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      {users.length > 0 ? (
                        users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.balance} FCFA)</option>)
                      ) : (
                        <option value={currentUser.id}>{currentUser.name}</option>
                      )}
                    </select>
                  </div>

                  <button
                    onClick={() => onStartSession(selectedUserId, selectedPc, selectedMins)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Unlock className="w-4 h-4 text-amber-300" /> DÉMARRER LA SESSION SUR LE POSTE
                  </button>
                </div>
              </div>

              {/* Quick Action Shortcuts */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Raccourcis Caissier Rapides</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Accès 1-Tap</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMobileTab("pos")}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left space-y-1 transition cursor-pointer group"
                  >
                    <Ticket className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Créer Ticket Papier</div>
                    <div className="text-[10px] text-slate-400">Générer code à donner au client</div>
                  </button>

                  <button
                    onClick={() => setShowQuickSnackModal(true)}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left space-y-1 transition cursor-pointer group"
                  >
                    <ShoppingBag className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Vente Snack Caisse</div>
                    <div className="text-[10px] text-slate-400">Vendre boisson / snack rapide</div>
                  </button>
                </div>
              </div>

              {/* Active Sessions Overview */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Sessions en Cours ({sessions.filter(s => s.status === "active").length})</span>
                  <button onClick={() => setMobileTab("pcs")} className="text-[10px] text-indigo-400 font-bold hover:underline">
                    Voir Tout →
                  </button>
                </div>

                {sessions.filter(s => s.status === "active").length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-center text-slate-400 text-xs">
                    Aucune session active en ce moment.
                  </div>
                ) : (
                  sessions.filter(s => s.status === "active").map(session => (
                    <div key={session.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{session.computerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Durée : {session.allocatedMinutes} min</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[9px] font-bold border border-emerald-500/40 uppercase">
                          EN COURS
                        </span>
                        {onStopSession && (
                          <button
                            onClick={() => onStopSession(session.id)}
                            className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Arrêter
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PARC PC / SUPERVISION & CONTRÔLE DISTANT */}
          {mobileTab === "pcs" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Supervision du Parc Informatique ({computers.length} PCs)</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">Contrôle à distance</span>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={pcSearchQuery}
                      onChange={(e) => setPcSearchQuery(e.target.value)}
                      placeholder="Chercher PC (ex: PC-01)..."
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                    />
                  </div>

                  <select
                    value={pcStatusFilter}
                    onChange={(e) => setPcStatusFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-white text-xs px-2 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="all">Tous</option>
                    <option value="in_use">En cours</option>
                    <option value="locked">Verrouillé</option>
                    <option value="available">Disponible</option>
                  </select>
                </div>
              </div>

              {/* Computers List */}
              <div className="space-y-2.5">
                {filteredComputers.map(pc => {
                  const isLocked = pc.status === "locked";
                  const session = sessions.find(s => s.computerId === pc.id && s.status === "active");

                  return (
                    <div key={pc.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3 shadow-sm hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                            pc.status === "in_use" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                            pc.status === "locked" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                            "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}>
                            <Monitor className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{pc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({pc.ip})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{pc.hourlyRate} FCFA/h</div>
                          </div>
                        </div>

                        <div>
                          {pc.status === "in_use" && <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[9px] font-bold border border-emerald-500/40 uppercase">EN COURS</span>}
                          {pc.status === "locked" && <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[9px] font-bold border border-amber-500/40 uppercase">VERROUILLÉ</span>}
                          {pc.status === "available" && <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold border border-slate-700 uppercase">LIBRE</span>}
                        </div>
                      </div>

                      {session && (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400">Joueur : <span className="text-white font-bold">{session.computerName}</span></div>
                            <div className="text-[10px] text-indigo-300 font-mono">Chrono alloué : {session.allocatedMinutes} min</div>
                          </div>
                          {onStopSession && (
                            <button
                              onClick={() => onStopSession(session.id)}
                              className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer transition"
                            >
                              Forcer Fermeture
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quick Action Control Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => {
                            if (isLocked) {
                              if (onUnlockComputer) onUnlockComputer(pc.id);
                            } else {
                              if (onLockComputer) onLockComputer(pc.id);
                            }
                          }}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            isLocked 
                              ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          }`}
                        >
                          {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isLocked ? "Déverrouiller le Poste" : "Verrouiller à Distance"}</span>
                        </button>

                        <button
                          onClick={() => onStartSession(currentUser.id, pc.id, 60)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
                        >
                          + 1 heure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CAISSE & TICKETS PAPIER */}
          {mobileTab === "pos" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Ticket Generator Card */}
              <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-400" /> Vendre un Ticket Papier (Caisse Mobile)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Reçu Client</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-semibold block">Choisir Forfait Temps Client</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { mins: 60, price: 1000, label: "1 Heure (1 000 FCFA)" },
                      { mins: 120, price: 2000, label: "2 Heures (2 000 FCFA)" },
                      { mins: 180, price: 3000, label: "3 Heures (3 000 FCFA)" },
                      { mins: 480, price: 5000, label: "Pass Nuit (5 000 FCFA)" },
                    ].map(item => (
                      <button
                        key={item.mins}
                        type="button"
                        onClick={() => setTicketDuration(item.mins)}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-left transition cursor-pointer ${
                          ticketDuration === item.mins
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                            : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerateQuickTicket}
                    disabled={isGeneratingTicket}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Receipt className="w-4 h-4" /> {isGeneratingTicket ? "Génération en cours..." : "Encaisser & Imprimer Ticket"}
                  </button>
                </div>

                {/* Generated Ticket Receipt Preview Card */}
                {generatedTicketCode && (
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 border-2 border-amber-400/80 p-4 rounded-2xl text-center space-y-2 animate-fade-in shadow-xl relative overflow-hidden">
                    <div className="text-[10px] uppercase font-mono font-bold text-amber-300 tracking-wider">REÇU DÉVERROUILLAGE TICKET</div>
                    <div className="text-2xl font-mono font-black text-white bg-slate-900/90 py-2.5 rounded-xl border border-indigo-500/40 tracking-widest select-all">
                      {generatedTicketCode}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-slate-300 text-xs py-1">
                      <QrCode className="w-4 h-4 text-amber-300" />
                      <span>Code à taper sur l'écran verrouillé du PC</span>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedTicketCode);
                        alert("Code ticket copié !");
                      }}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl cursor-pointer border border-slate-700 transition"
                    >
                      Copier le Code Ticket
                    </button>
                  </div>
                )}
              </div>

              {/* Redeem Ticket on Behalf of Client */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" /> Activer un Ticket Directement sur un PC
                </div>

                {codeMsg && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                    codeMsg.type === "success" ? "bg-emerald-950 text-emerald-200 border border-emerald-500/40" : "bg-rose-950 text-rose-200 border border-rose-500/40"
                  }`}>
                    {codeMsg.text}
                  </div>
                )}

                <form onSubmit={handleRedeemMobileCode} className="space-y-2">
                  <input
                    type="text"
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                    placeholder="Ex: 1H-A8B9C"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-center font-mono font-bold text-sm rounded-xl p-2.5 tracking-wider uppercase focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingCode || !codeInputValue.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {isSubmittingCode ? "Validation..." : "Activer Ticket sur le Poste"}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: COMMANDES SNACKS & LIVRAISONS */}
          {mobileTab === "orders" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Livraisons Snacks au Poste</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded border border-amber-500/30 font-mono">
                  {pendingOrders.length} En Attente
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  Aucune commande de snack reçue pour l'instant.
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <div className="text-xs font-bold text-white">Poste {order.computerId || "Caisse Comptoir"}</div>
                        <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        order.status === "completed" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-amber-950 text-amber-300 border border-amber-500/40"
                      }`}>
                        {order.status === "completed" ? "Livré" : "En Attente Caisse"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-300">
                          <span>{it.quantity}x {it.productName}</span>
                          <span className="font-mono text-emerald-400">{it.price * it.quantity} FCFA</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-xs font-bold text-white">Total : <span className="font-mono text-emerald-400">{order.totalAmount} FCFA</span></span>
                      
                      {order.status === "pending" && onUpdateOrderStatus && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, "completed")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Marquer Livré
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS PUSH FCM */}
          {mobileTab === "push" && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" /> Historique Notifications Push Staff
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{fcmLogs.length} Reçues</span>
              </div>

              {fcmLogs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  Aucune alerte push récente enregistrée.
                </div>
              ) : (
                fcmLogs.map(log => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">{log.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{log.body}</p>
                    <div className="text-[9px] text-slate-500 font-mono pt-1">
                      Target: {log.target} • Topic: {log.topic || "all"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION BAR FOR MOBILE STAFF */}
        <div className="bg-slate-900/95 backdrop-blur p-2 border-t border-slate-800/90 flex items-center justify-around shrink-0 z-30 sticky bottom-0">
          
          {/* Tab 1: Synthèse */}
          <button
            onClick={() => setMobileTab("dashboard")}
            className={`flex flex-col items-center gap-1 text-[10px] transition cursor-pointer px-3 py-1.5 rounded-xl ${
              mobileTab === "dashboard" ? "text-indigo-400 font-bold bg-indigo-950/80 border border-indigo-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Synthèse</span>
          </button>

          {/* Tab 2: Parc PC */}
          <button
            onClick={() => setMobileTab("pcs")}
            className={`flex flex-col items-center gap-1 text-[10px] transition cursor-pointer px-3 py-1.5 rounded-xl ${
              mobileTab === "pcs" ? "text-indigo-400 font-bold bg-indigo-950/80 border border-indigo-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Parc PC</span>
          </button>

          {/* Tab 3: Caisse */}
          <button
            onClick={() => setMobileTab("pos")}
            className={`flex flex-col items-center gap-1 text-[10px] transition cursor-pointer px-3 py-1.5 rounded-xl ${
              mobileTab === "pos" ? "text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Tickets</span>
          </button>

          {/* Tab 4: Snacks */}
          <button
            onClick={() => setMobileTab("orders")}
            className={`flex flex-col items-center gap-1 text-[10px] transition cursor-pointer px-3 py-1.5 rounded-xl relative ${
              mobileTab === "orders" ? "text-indigo-400 font-bold bg-indigo-950/80 border border-indigo-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Snacks</span>
            {pendingOrders.length > 0 && (
              <span className="absolute top-1 right-2 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>

          {/* Tab 5: Push */}
          <button
            onClick={() => setMobileTab("push")}
            className={`flex flex-col items-center gap-1 text-[10px] transition cursor-pointer px-3 py-1.5 rounded-xl ${
              mobileTab === "push" ? "text-indigo-400 font-bold bg-indigo-950/80 border border-indigo-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alertes</span>
          </button>

        </div>

      </div>

      {/* QUICK SNACK MODAL */}
      {showQuickSnackModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Vente Snack Rapide Caisse
              </h3>
              <button onClick={() => setShowQuickSnackModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Choisir le produit</label>
                <select
                  value={selectedSnackId}
                  onChange={(e) => setSelectedSnackId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} FCFA) - Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={snackQty}
                  onChange={(e) => setSnackQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handlePlaceQuickSnack}
                disabled={isPlacingSnack || !selectedSnackId}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isPlacingSnack ? "Enregistrement..." : "Encaisser & Valider Vente"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
