import React, { useState, useEffect } from "react";
import { FcmToken, FcmNotificationLog } from "../types";
import { fetchFcmLogs, fetchFcmStats, sendFcmPushNotification, fetchFcmTokens } from "../api";
import { Bell, Send, ShieldCheck, Smartphone, Wifi, Radio, Zap, CheckCircle2, Clock, Megaphone, AlertCircle, RefreshCw } from "lucide-react";

export const FcmPushNotificationUI: React.FC = () => {
  const [logs, setLogs] = useState<FcmNotificationLog[]>([]);
  const [tokens, setTokens] = useState<FcmToken[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("🎉 Offre Spéciale Weekend Gaming !");
  const [body, setBody] = useState("Profitez de 2h achetées = 1h offerte sur tous les simulateurs DEK-DRIVSIM ce samedi !");
  const [targetType, setTargetType] = useState<"topic_promotions" | "all_gamers" | "specific_token">("topic_promotions");
  const [selectedToken, setSelectedToken] = useState("");
  const [notificationType, setNotificationType] = useState<"promotion" | "session_expiration" | "system_alert" | "custom">("promotion");
  const [sendingStatus, setSendingStatus] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [l, t, s] = await Promise.all([fetchFcmLogs(), fetchFcmTokens(), fetchFcmStats()]);
      setLogs(l);
      setTokens(t);
      setStats(s);
      if (t.length > 0 && !selectedToken) {
        setSelectedToken(t[0].token);
      }
    } catch (err) {
      console.error("Failed to load FCM data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetTopic = targetType === "topic_promotions" ? "promotions" : "all_gamers";
      const res = await sendFcmPushNotification({
        targetTopic: targetType !== "specific_token" ? targetTopic : undefined,
        targetToken: targetType === "specific_token" ? selectedToken : undefined,
        title,
        body,
        type: notificationType,
        metadata: { sentVia: "Admin Dashboard", timestamp: new Date().toISOString() }
      });

      setSendingStatus(`Notification envoyée avec succès ! (${res.notification.deliveryChannel === "fcm_cloud" ? "Google FCM Cloud" : "Fallback Réseau LAN WebSocket"})`);
      setTimeout(() => setSendingStatus(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              FIREBASE CLOUD MESSAGING (FCM) & LAN DUAL PUSH
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              Mode Offline LAN Prêt
            </span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" /> Centre de Notifications Push Android & Web
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Diffusion automatique d'alertes push aux téléphones des clients : fin de session (0 min), offres promotionnelles, et crédits offerts. Fonctionne en ligne via Google FCM ou hors-ligne en LAN local sans internet.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border border-slate-700 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} /> Actualiser
        </button>
      </div>

      {sendingStatus && (
        <div className="bg-emerald-900/80 border border-emerald-500/40 text-emerald-100 p-4 rounded-2xl flex items-center justify-between text-xs font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{sendingStatus}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Appareils Enregistrés</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.registeredTokensCount || tokens.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pushes Transmis</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalSentCount || logs.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pushes Promotions</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats?.promotionsSentCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Fallback LAN Offline</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats?.lanOfflineCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Wifi className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Push Form & Active Tokens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Send Push Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Megaphone className="w-4 h-4 text-indigo-600" /> Diffuser une Notification Push Immédiate
          </h3>

          <form onSubmit={handleSendPush} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Cible de Diffusion</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="topic_promotions">📢 Topic 'Promotions' (Tous les abonnés)</option>
                  <option value="all_gamers">🎮 Tous les clients du CyberCafé</option>
                  <option value="specific_token">📱 Appareil spécifique (Token FCM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Type de Notification</label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="promotion">🎉 Promotion / Offre Flash</option>
                  <option value="session_expiration">⏰ Alerte Fin de Session (0 min)</option>
                  <option value="system_alert">⚡ Alerte Système / Annonce</option>
                  <option value="custom">💬 Message Personnalisé</option>
                </select>
              </div>
            </div>

            {targetType === "specific_token" && (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sélectionner l'appareil mobile</label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tokens.map(t => (
                    <option key={t.id} value={t.token}>
                      {t.userName} ({t.deviceType.toUpperCase()}) - {t.token.substring(0, 25)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Titre de la Notification</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: 🎉 1 Heure offerte ce soir !"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Corps du Message (Texte Push)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Entrez le message à afficher sur l'écran verrouillé du téléphone..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" /> Envoyer la Notification Push FCM / LAN
            </button>
          </form>
        </div>

        {/* Registered Devices List */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" /> Appareils Mobiles Connectés
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono">
              {tokens.length} tokens
            </span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {tokens.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucun token FCM enregistré.</p>
            ) : (
              tokens.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{t.userName || "Client Anonyme"}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {t.deviceType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate" title={t.token}>
                    Token: {t.token}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Actif: {new Date(t.lastActiveAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Push Notification History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Historique des Notifications FCM Transmises
          </h3>
          <span className="text-xs text-slate-500 font-mono">{logs.length} envois</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3">Horodatage</th>
                <th className="p-3">Type</th>
                <th className="p-3">Titre & Contenu</th>
                <th className="p-3">Cible / Topic</th>
                <th className="p-3">Canal de Transmission</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucune notification push enregistrée.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.type === "promotion" ? "bg-amber-100 text-amber-800" :
                        log.type === "session_expiration" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-slate-900">{log.title}</p>
                      <p className="text-slate-500 text-[11px] truncate">{log.body}</p>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-indigo-600">
                      {log.targetTopic ? `Topic: ${log.targetTopic}` : log.targetToken ? `Token: ${log.targetToken.substring(0, 15)}...` : "Global"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                        log.deliveryChannel === "fcm_cloud" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {log.deliveryChannel === "fcm_cloud" ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <Wifi className="w-3 h-3 text-blue-600" />}
                        {log.deliveryChannel === "fcm_cloud" ? "Google FCM Cloud" : "LAN Offline Fallback"}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600 text-[11px]">
                      ✓ {log.status.toUpperCase()}
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
