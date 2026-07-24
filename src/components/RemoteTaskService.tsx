import React, { useState, useEffect } from "react";
import { RemoteTask, Computer } from "../types";
import { fetchRemoteTasks, dispatchRemoteTask, killGamesOnPc } from "../api";
import { Shield, Terminal, Play, CheckCircle2, Clock, AlertTriangle, RefreshCw, Cpu, Monitor, Send, Lock, Power } from "lucide-react";

interface RemoteTaskServiceProps {
  computers: Computer[];
}

export const RemoteTaskServiceUI: React.FC<RemoteTaskServiceProps> = ({ computers }) => {
  const [tasks, setTasks] = useState<RemoteTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPcName, setSelectedPcName] = useState<string>(computers[0]?.name || "PC-01");
  const [commandType, setCommandType] = useState<"taskkill" | "lock_screen" | "reboot" | "message" | "custom_shell">("taskkill");
  const [customCommand, setCustomCommand] = useState("taskkill /F /IM FC25.exe /IM AssettoCorsa.exe");
  const [targetProcess, setTargetProcess] = useState("FC25.exe");
  const [notification, setNotification] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRemoteTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load remote tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let cmd = customCommand;
      if (commandType === "taskkill") {
        cmd = customCommand || `taskkill /F /IM ${targetProcess}`;
      } else if (commandType === "lock_screen") {
        cmd = "ctypes.windll.user32.LockWorkStation()";
      } else if (commandType === "reboot") {
        cmd = "shutdown /r /t 5";
      }

      const pc = computers.find(c => c.name === selectedPcName);
      await dispatchRemoteTask({
        computerId: pc?.id,
        computerName: selectedPcName,
        commandType,
        command: cmd,
        targetProcess,
        triggeredBy: "admin_manual"
      });

      setNotification(`Ordre [${commandType}] envoyé au poste ${selectedPcName} !`);
      setTimeout(() => setNotification(null), 3000);
      loadTasks();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleQuickKillAllGames = async (pc: Computer) => {
    try {
      await killGamesOnPc(pc.id, pc.name);
      setNotification(`Ordre Taskkill (Tous les jeux) envoyé à ${pc.name}`);
      setTimeout(() => setNotification(null), 3000);
      loadTasks();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const executedCount = tasks.filter(t => t.status === "executed").length;
  const autoExpiredCount = tasks.filter(t => t.triggeredBy === "auto_timer_expiration").length;
  const pendingCount = tasks.filter(t => t.status === "pending" || t.status === "dispatched").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              REMOTE TASK SERVICE ACTIVE
            </span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-indigo-400" /> Remote Task & Game Killing Agent Service
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Service d'exécution à distance de commandes système. Permet d'envoyer automatiquement des ordres <code className="text-amber-300 font-mono">taskkill</code> pour fermer les jeux (FIFA, Assetto Corsa, GTA...) dès la fin du chrono et verrouiller la session Windows.
          </p>
        </div>

        <button
          onClick={loadTasks}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border border-slate-700 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} /> Actualiser les Tâches
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-900/80 border border-emerald-500/40 text-emerald-100 p-4 rounded-2xl flex items-center justify-between text-xs font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Commandes Exécutées</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{executedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Fermetures Auto Timer (0 min)</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{autoExpiredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">En Attente sur l'Agent Local</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dispatch Manual Command Panel & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" /> Envoyer une Commande à Distance
          </h3>

          <form onSubmit={handleDispatch} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Poste PC Cible</label>
              <select
                value={selectedPcName}
                onChange={(e) => setSelectedPcName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {computers.map(pc => (
                  <option key={pc.id} value={pc.name}>
                    {pc.name} ({pc.category}) - {pc.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Type de Commande Système</label>
              <select
                value={commandType}
                onChange={(e) => setCommandType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="taskkill">🛑 Fermer Processus / Jeu (taskkill)</option>
                <option value="lock_screen">🔒 Verrouiller la Session Windows</option>
                <option value="reboot">⚡ Redémarrer l'ordinateur</option>
                <option value="message">💬 Afficher un Message sur l'écran</option>
                <option value="custom_shell">💻 Commande Shell Personnalisée</option>
              </select>
            </div>

            {commandType === "taskkill" && (
              <div>
                <label className="block text-slate-600 font-medium mb-1">Processus à Terminer</label>
                <input
                  type="text"
                  value={targetProcess}
                  onChange={(e) => setTargetProcess(e.target.value)}
                  placeholder="ex: FC25.exe, AssettoCorsa.exe"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-medium mb-1">Ligne de Commande Exécutée</label>
              <input
                type="text"
                value={
                  commandType === "taskkill" ? `taskkill /F /IM ${targetProcess}` :
                  commandType === "lock_screen" ? "ctypes.windll.user32.LockWorkStation()" :
                  commandType === "reboot" ? "shutdown /r /t 5" : customCommand
                }
                onChange={(e) => setCustomCommand(e.target.value)}
                className="w-full bg-slate-900 text-emerald-400 border border-slate-800 font-mono rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" /> Transmettre l'Ordre à l'Agent Local
            </button>
          </form>
        </div>

        {/* Quick PC Actions Grid */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-600" /> Actions Rapides 1-Click par Poste PC
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {computers.map(pc => (
              <div key={pc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{pc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pc.status === "in_use" ? "bg-amber-100 text-amber-800" :
                      pc.status === "locked" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {pc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{pc.ip}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuickKillAllGames(pc)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                    title="Forcer la fermeture de tous les jeux"
                  >
                    <Shield className="w-3 h-3" /> Kill Jeux
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Task Execution Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" /> Journal d'Exécution des Commandes Système
          </h3>
          <span className="text-xs text-slate-500 font-mono">{tasks.length} événements enregistrés</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3">Horodatage</th>
                <th className="p-3">PC Cible</th>
                <th className="p-3">Type</th>
                <th className="p-3">Commande Exécutée</th>
                <th className="p-3">Déclencheur</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Résultat Agent Python</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                    Aucune tâche exécutée pour le moment.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{task.computerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-800">
                        {task.commandType}
                      </span>
                    </td>
                    <td className="p-3 text-indigo-600 font-semibold max-w-xs truncate" title={task.command}>
                      {task.command}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        task.triggeredBy === "auto_timer_expiration" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {task.triggeredBy === "auto_timer_expiration" ? "Auto Timer 0 min" : "Action Manuelle Admin"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                        task.status === "executed" ? "bg-emerald-100 text-emerald-800" :
                        task.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {task.status === "executed" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {task.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 max-w-sm truncate" title={task.output || ""}>
                      {task.output || "En attente de retour de l'agent local..."}
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
