import React, { useState } from "react";
import { Computer, Session, User } from "../types";
import { Monitor, Lock, Unlock, Play, Square, Cpu, HardDrive, Wifi, Plus, Power, ShieldAlert, Check, Ticket, KeyRound } from "lucide-react";
import { killGamesOnPc, redeemVoucherAndStartSession } from "../api";

interface ComputerGridProps {
  computers: Computer[];
  sessions: Session[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (pcId: string, status: string) => void;
  onLockComputer?: (pcId: string) => void;
  onUnlockComputer?: (pcId: string) => void;
  onStartSession: (userId: string, pcId: string, minutes: number) => void;
  onStopSession: (sessionId: string) => void;
  onAddComputer: (pc: { name: string; ip: string; hourlyRate: number; specs: string; category: string }) => void;
}

export const ComputerGrid: React.FC<ComputerGridProps> = ({
  computers,
  sessions,
  users,
  currentUser,
  onUpdateStatus,
  onLockComputer,
  onUnlockComputer,
  onStartSession,
  onStopSession,
  onAddComputer
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("TOUS");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPcForSession, setSelectedPcForSession] = useState<Computer | null>(null);
  
  // New session modal states
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);

  // Code Ticket Unlock Modal State
  const [selectedPcForCodeUnlock, setSelectedPcForCodeUnlock] = useState<Computer | null>(null);
  const [voucherInputCode, setVoucherInputCode] = useState("");
  const [codeUnlockMsg, setCodeUnlockMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // New PC form states
  const [newPcName, setNewPcName] = useState("");
  const [newPcIp, setNewPcIp] = useState("192.168.1.");
  const [newPcRate, setNewPcRate] = useState(1000);
  const [newPcCategory, setNewPcCategory] = useState<"VIP Gaming PC" | "Standard Rig" | "Streaming Station" | "Console Booth">("VIP Gaming PC");
  const [newPcSpecs, setNewPcSpecs] = useState("i7-14700K, RTX 4080, 32GB RAM, Écran 240Hz");
  const [taskNotification, setTaskNotification] = useState<string | null>(null);

  const handleRedeemCodeForPc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInputCode.trim() || !selectedPcForCodeUnlock) return;
    setIsSubmittingCode(true);
    setCodeUnlockMsg(null);
    try {
      const res = await redeemVoucherAndStartSession({
        code: voucherInputCode.trim(),
        userId: currentUser.id,
        computerId: selectedPcForCodeUnlock.id
      });
      setCodeUnlockMsg({ type: "success", text: res.message });
      setTaskNotification(res.message);
      setTimeout(() => {
        setSelectedPcForCodeUnlock(null);
        setVoucherInputCode("");
        setCodeUnlockMsg(null);
      }, 1500);
    } catch (err: any) {
      setCodeUnlockMsg({ type: "error", text: err.message || "Code ticket invalide ou déjà utilisé" });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleForceKillGames = async (pc: Computer) => {
    try {
      const res = await killGamesOnPc(pc.id, pc.name);
      setTaskNotification(`Taskkill envoyé à ${pc.name} ! Jeux fermés à distance.`);
      setTimeout(() => setTaskNotification(null), 3500);
    } catch (err: any) {
      setTaskNotification(`Erreur: ${err.message || "Impossible d'envoyer la commande"}`);
      setTimeout(() => setTaskNotification(null), 3500);
    }
  };

  const categories = ["TOUS", "VIP Gaming PC", "Streaming Station", "Standard Rig", "Console Booth"];

  const filteredComputers = selectedCategory === "TOUS"
    ? computers
    : computers.filter((c) => c.category === selectedCategory);

  const handleCreatePc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPcName) return;
    onAddComputer({
      name: newPcName,
      ip: newPcIp,
      hourlyRate: Number(newPcRate),
      specs: newPcSpecs,
      category: newPcCategory
    });
    setShowAddModal(false);
    setNewPcName("");
  };

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPcForSession) return;
    onStartSession(selectedUserId, selectedPcForSession.id, sessionMinutes);
    setSelectedPcForSession(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification for RemoteTaskService */}
      {taskNotification && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{taskNotification}</span>
          </div>
          <button onClick={() => setTaskNotification(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Category Filter & Add PC Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {currentUser.role === "admin" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> Ajouter un Poste PC
          </button>
        )}
      </div>

      {/* PC Workstations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredComputers.map((pc) => {
          const activeSess = sessions.find((s) => s.computerId === pc.id && s.status === "active");

          const getStatusText = (status: string) => {
            switch (status) {
              case "in_use": return "EN UTILISATION";
              case "available": return "DISPONIBLE";
              case "locked": return "VERROUILLÉ";
              case "maintenance": return "MAINTENANCE";
              default: return status.toUpperCase();
            }
          };

          const handleLockUnlockClick = () => {
            if (pc.status === "locked") {
              if (onUnlockComputer) onUnlockComputer(pc.id);
              else onUpdateStatus(pc.id, "available");
            } else {
              if (onLockComputer) onLockComputer(pc.id);
              else onUpdateStatus(pc.id, "locked");
            }
          };

          return (
            <div
              key={pc.id}
              className={`relative bg-white border rounded-2xl p-5 transition flex flex-col justify-between shadow-sm ${
                pc.status === "in_use"
                  ? "border-blue-300 bg-blue-50/20"
                  : pc.status === "available"
                  ? "border-emerald-300 hover:border-emerald-400 bg-emerald-50/10"
                  : pc.status === "locked"
                  ? "border-amber-300 bg-amber-50/10"
                  : "border-slate-300 bg-slate-50 opacity-80"
              }`}
            >
              {/* Category Badge & Status Indicator */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    {pc.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      pc.status === "in_use"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : pc.status === "available"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : pc.status === "locked"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      pc.status === 'in_use' ? 'bg-blue-500 animate-ping' :
                      pc.status === 'available' ? 'bg-emerald-500' :
                      pc.status === 'locked' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {getStatusText(pc.status)}
                  </span>
                </div>

                {/* PC Icon & Title */}
                <div className="mt-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${
                    pc.status === "in_use" ? "bg-blue-100 border-blue-200 text-blue-600" :
                    pc.status === "available" ? "bg-emerald-100 border-emerald-200 text-emerald-600" :
                    "bg-slate-100 border-slate-200 text-slate-500"
                  }`}>
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{pc.name}</h3>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Wifi className="w-3 h-3 text-slate-400" /> {pc.ip}
                    </p>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{pc.specs}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                    <span>Tarif Horaire</span>
                    <span className="font-mono font-bold text-emerald-700">{pc.hourlyRate} FCFA/h</span>
                  </div>
                </div>

                {/* Active Session Timer Info */}
                {activeSess && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-medium text-indigo-900">
                      <span>Utilisateur : {activeSess.userName}</span>
                      <span className="font-mono font-bold text-emerald-700">{activeSess.totalCost} FCFA</span>
                    </div>
                    <div className="text-[11px] text-indigo-700/80">
                      Durée allouée : {activeSess.allocatedMinutes} min
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                {pc.status === "available" && (
                  <>
                    <button
                      onClick={() => setSelectedPcForSession(pc)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Démarrer
                    </button>
                    <button
                      onClick={() => { setSelectedPcForCodeUnlock(pc); setVoucherInputCode(""); setCodeUnlockMsg(null); }}
                      className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Déverrouiller le poste en saisissant un Code Ticket"
                    >
                      <Ticket className="w-3.5 h-3.5 text-indigo-600" /> Saisir Code
                    </button>
                  </>
                )}

                {pc.status === "locked" && (
                  <button
                    onClick={() => { setSelectedPcForCodeUnlock(pc); setVoucherInputCode(""); setCodeUnlockMsg(null); }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-300" /> Entrer Code Ticket
                  </button>
                )}

                {pc.status === "in_use" && activeSess && (
                  <button
                    onClick={() => onStopSession(activeSess.id)}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" /> Arrêter Session
                  </button>
                )}

                {/* Lock / Unlock Toggle Button for Admin/Staff */}
                {(currentUser.role === "admin" || currentUser.role === "staff") && (
                  <>
                    <button
                      onClick={() => handleForceKillGames(pc)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Forcer la fermeture de tous les jeux (Taskkill à distance)"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    </button>

                    <button
                      onClick={handleLockUnlockClick}
                      className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        pc.status === "locked"
                          ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={pc.status === "locked" ? "Déverrouiller le PC" : "Verrouiller à distance"}
                    >
                      {pc.status === "locked" ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </>
                )}

                {/* Maintenance Toggle */}
                {currentUser.role === "admin" && (
                  <button
                    onClick={() => onUpdateStatus(pc.id, pc.status === "maintenance" ? "available" : "maintenance")}
                    className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      pc.status === "maintenance"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                    title="Basculer le Mode Maintenance"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Session Modal */}
      {selectedPcForSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" /> Démarrer la session sur {selectedPcForSession.name}
            </h3>
            
            <form onSubmit={handleStartSessionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Associer un compte client</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Solde : {u.balance.toLocaleString()} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Durée de la session (Minutes)</label>
                <select
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-mono"
                >
                  <option value={30}>30 Minutes ({selectedPcForSession.hourlyRate * 0.5} FCFA)</option>
                  <option value={60}>1 Heure ({selectedPcForSession.hourlyRate} FCFA)</option>
                  <option value={120}>2 Heures ({selectedPcForSession.hourlyRate * 2} FCFA)</option>
                  <option value={180}>3 Heures ({selectedPcForSession.hourlyRate * 3} FCFA)</option>
                  <option value={300}>Pass 5 Heures ({selectedPcForSession.hourlyRate * 4} FCFA - Remise)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPcForSession(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Confirmer & Lancer le minuteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add PC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Ajouter une Station de Travail</h3>
            <form onSubmit={handleCreatePc} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Nom du Poste PC</label>
                <input
                  type="text"
                  value={newPcName}
                  onChange={(e) => setNewPcName(e.target.value)}
                  placeholder="ex: PC-09 (RTX 4080)"
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Adresse IP</label>
                  <input
                    type="text"
                    value={newPcIp}
                    onChange={(e) => setNewPcIp(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Tarif Horaire (FCFA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPcRate}
                    onChange={(e) => setNewPcRate(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Catégorie</label>
                <select
                  value={newPcCategory}
                  onChange={(e) => setNewPcCategory(e.target.value as any)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-sm"
                >
                  <option value="VIP Gaming PC">VIP Gaming PC</option>
                  <option value="Streaming Station">Streaming Station</option>
                  <option value="Standard Rig">Standard Rig</option>
                  <option value="Console Booth">Console Booth</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Spécifications Matérielles</label>
                <input
                  type="text"
                  value={newPcSpecs}
                  onChange={(e) => setNewPcSpecs(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Ajouter le Poste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Ticket Unlock Modal */}
      {selectedPcForCodeUnlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Saisir le Code Ticket de Caisse</h3>
                  <p className="text-xs text-slate-500">Poste : <span className="font-bold text-indigo-600">{selectedPcForCodeUnlock.name}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPcForCodeUnlock(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {codeUnlockMsg && (
              <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                codeUnlockMsg.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}>
                {codeUnlockMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                <span>{codeUnlockMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRedeemCodeForPc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Code Ticket fourni par le Caissier
                </label>
                <input
                  type="text"
                  value={voucherInputCode}
                  onChange={(e) => setVoucherInputCode(e.target.value.toUpperCase())}
                  placeholder="Ex: 1H-9A8B7C ou DEK-88219"
                  className="w-full bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl p-3 text-center text-lg font-mono font-black text-slate-900 tracking-wider focus:outline-none uppercase"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Entrez le code imprimé sur votre reçu de caisse pour démarrer immédiatement la session.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPcForCodeUnlock(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCode || !voucherInputCode.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  {isSubmittingCode ? "Validation..." : "Valider & Déverrouiller le PC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
