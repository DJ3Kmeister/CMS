import React, { useState } from "react";
import { DashboardStats, Transaction, Order, Session, Computer } from "../types";
import { Printer, Calendar, FileText, TrendingUp, DollarSign, Clock, Download, FileSpreadsheet, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats;
  transactions: Transaction[];
  orders: Order[];
  sessions: Session[];
  computers: Computer[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  stats,
  transactions,
  orders,
  sessions,
  computers
}) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  if (!isOpen) return null;

  // Filter transactions according to selected period
  const now = new Date();
  const filteredTransactions = transactions.filter((t) => {
    const txDate = new Date(t.createdAt);
    if (period === "daily") {
      return txDate.toDateString() === now.toDateString();
    }
    if (period === "weekly") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return txDate >= sevenDaysAgo;
    }
    if (period === "monthly") {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (period === "yearly") {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const periodTitle =
    period === "daily"
      ? "Journalier (" + now.toLocaleDateString("fr-FR") + ")"
      : period === "weekly"
      ? "Hebdomadaire (7 Derniers Jours)"
      : period === "monthly"
      ? "Mensuel (" + now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) + ")"
      : "Annuel (" + now.getFullYear() + ")";

  // Calculate metrics
  const totalPeriodRevenue = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  const posRevenue = filteredTransactions
    .filter((t) => t.type === "pos_purchase")
    .reduce((acc, t) => acc + t.amount, 0);
  const topupRevenue = filteredTransactions
    .filter((t) => t.type === "top_up")
    .reduce((acc, t) => acc + t.amount, 0);
  const sessionFeesRevenue = filteredTransactions
    .filter((t) => t.type === "session_fee")
    .reduce((acc, t) => acc + t.amount, 0);

  // Completed sessions count & duration
  const completedSessions = sessions.filter((s) => s.status === "completed" || s.status === "active");
  const totalHoursLogged = Math.round(
    completedSessions.reduce((acc, s) => acc + s.elapsedSeconds, 0) / 3600
  );

  const handlePrint = () => {
    window.print();
  };

  // Export PDF using jsPDF and jspdf-autotable
  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = now.toLocaleDateString("fr-FR");
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Document Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CYBERCAFE GAMING PRO", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`RAPPORT FINANCIER & BILAN - ${periodTitle.toUpperCase()}`, 14, 23);
    doc.text(`Edite le : ${dateStr} a ${timeStr}`, 140, 23);

    // Summary Cards / Financial Overview
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. CHIFFRES CLES ET RECETTES", 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Indicateur", "Valeur / Quantite", "Observation"]],
      body: [
        ["Chiffre d'Affaires Total", `${totalPeriodRevenue.toLocaleString()} FCFA`, `${filteredTransactions.length} transaction(s)`],
        ["Rechargements Caisse", `${topupRevenue.toLocaleString()} FCFA`, "Achats de solde & coupons"],
        ["Ventes POS / Snacks", `${posRevenue.toLocaleString()} FCFA`, "Boissons & nourriture"],
        ["Frais de Sessions PC", `${sessionFeesRevenue.toLocaleString()} FCFA`, "Temps de jeu chiffre"],
        ["Volume d'Utilisation PC", `${totalHoursLogged} Heures`, `Sur ${computers.length} ordinateurs`]
      ],
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      theme: "striped"
    });

    // Transactions Detail Table
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 110;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`2. DETAIL CHRONOLOGIQUE DES TRANSACTIONS (${filteredTransactions.length})`, 14, finalY);

    const txRows = filteredTransactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("fr-FR") + " " + new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      t.userName,
      t.type === "top_up" ? "Recharge" : t.type === "pos_purchase" ? "Caisse POS" : "Session PC",
      t.description,
      `${t.amount.toLocaleString()} FCFA`
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [["Date & Heure", "Utilisateur", "Type", "Description", "Montant"]],
      body: txRows.length > 0 ? txRows : [["-", "Aucune transaction", "-", "-", "0 FCFA"]],
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold" },
      theme: "grid",
      styles: { fontSize: 8 }
    });

    // Save File
    const fileName = `Rapport_Financier_${period}_${now.toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  // Export CSV
  const exportToCSV = () => {
    const csvRows: string[] = [];

    // Title & Metadata
    csvRows.push(`"CYBERCAFÉ GAMING PRO - RAPPORT FINANCIER"`);
    csvRows.push(`"Période:","${periodTitle}"`);
    csvRows.push(`"Date d'édition:","${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}"`);
    csvRows.push("");

    // Summary Section
    csvRows.push(`"RÉSUMÉ FINANCIER"`);
    csvRows.push(`"Indicateur","Montant (FCFA)"`);
    csvRows.push(`"Chiffre d'Affaires Total",${totalPeriodRevenue}`);
    csvRows.push(`"Rechargements Caisse",${topupRevenue}`);
    csvRows.push(`"Ventes POS Snacks",${posRevenue}`);
    csvRows.push(`"Frais Sessions PC",${sessionFeesRevenue}`);
    csvRows.push(`"Heures PC Consommées (h)",${totalHoursLogged}`);
    csvRows.push("");

    // Transactions Table Header
    csvRows.push(`"DÉTAIL DES TRANSACTIONS"`);
    csvRows.push(`"ID Transaction","Date","Heure","Utilisateur","Type","Description","Montant (FCFA)"`);

    filteredTransactions.forEach((t) => {
      const d = new Date(t.createdAt);
      const dateFormatted = d.toLocaleDateString("fr-FR");
      const timeFormatted = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const typeLabel = t.type === "top_up" ? "Recharge" : t.type === "pos_purchase" ? "Caisse POS" : "Session";

      csvRows.push(
        `"${t.id}","${dateFormatted}","${timeFormatted}","${t.userName.replace(/"/g, '""')}","${typeLabel}","${t.description.replace(/"/g, '""')}",${t.amount}`
      );
    });

    // Create CSV Blob with UTF-8 BOM (\uFEFF) for Excel compatibility
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_financier_${period}_${now.toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header toolbar (Hidden during print) */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Générateur de Rapports Financiers</h2>
              <p className="text-xs text-slate-400">Exportation officielle aux formats PDF, CSV ou impression papier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger le rapport au format PDF (jsPDF)"
            >
              <Download className="w-4 h-4" />
              Télécharger PDF
            </button>

            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger les données au format CSV Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Imprimer le document officiel"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Period Selector Bar (Hidden during print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Période du Rapport :
          </div>

          <div className="bg-white p-1 rounded-xl flex items-center border border-slate-300 shadow-xs text-xs">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                period === "daily" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Journalier
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                period === "weekly" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hebdomadaire
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                period === "monthly" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                period === "yearly" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Annuel
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 print:p-0 print:overflow-visible" id="printable-report">
          
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-indigo-600 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-900 tracking-tight">CYBERCAFÉ GAMING PRO</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border border-indigo-200">
                  DOCUMENT OFFICIEL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rapport Financier & Bilan d'Activité Opérationnel
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adresse: Plateau CyberZone, Rue 12 • Tél: +225 07 00 00 00 00 • Email: caisse@cybercafe.pro
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="font-bold text-slate-900">Rapport : <span className="text-indigo-700">{periodTitle}</span></div>
              <div className="text-slate-500">Date d'édition : {now.toLocaleDateString("fr-FR")} à {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="text-slate-400 font-mono text-[10px]">ID RPT-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Revenue Key Indicators Cards */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Chiffres Clés de la Période
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Chiffre d'Affaires Total</div>
                <div className="text-xl font-mono font-black text-indigo-700 mt-1">
                  {totalPeriodRevenue.toLocaleString()} FCFA
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{filteredTransactions.length} transactions enregistrées</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Rechargements Caisse</div>
                <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
                  {topupRevenue.toLocaleString()} FCFA
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Comptoir & Cartes</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Ventes Snacks / POS</div>
                <div className="text-xl font-mono font-bold text-amber-700 mt-1">
                  {posRevenue.toLocaleString()} FCFA
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Boissons & Nourriture</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Heures PC Consommées</div>
                <div className="text-xl font-mono font-bold text-blue-700 mt-1">
                  {totalHoursLogged} h
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Sur {computers.length} ordinateurs</p>
              </div>
            </div>
          </div>

          {/* Operational Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden p-4 bg-white">
              <h4 className="font-bold text-xs uppercase text-slate-700 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Ventilation des Recettes</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </h4>
              <table className="w-full text-xs text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 text-slate-600">Rechargements de Solde en Caisse</td>
                    <td className="py-2 font-mono font-bold text-right text-slate-900">{topupRevenue.toLocaleString()} FCFA</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600">Ventes Produits & Snacks (POS)</td>
                    <td className="py-2 font-mono font-bold text-right text-slate-900">{posRevenue.toLocaleString()} FCFA</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600">Frais de Sessions Chronométrées</td>
                    <td className="py-2 font-mono font-bold text-right text-slate-900">{sessionFeesRevenue.toLocaleString()} FCFA</td>
                  </tr>
                  <tr className="bg-indigo-50/60 font-bold">
                    <td className="py-2.5 px-2 text-indigo-900">Total Recettes Brut</td>
                    <td className="py-2.5 px-2 font-mono text-indigo-900 text-right">{totalPeriodRevenue.toLocaleString()} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Occupancy & Computer Network Status */}
            <div className="border border-slate-200 rounded-xl overflow-hidden p-4 bg-white">
              <h4 className="font-bold text-xs uppercase text-slate-700 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Statistiques du Parc Informatique</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Nombre de Postes PC Installés</span>
                  <span className="font-bold font-mono">{stats.totalComputers} Postes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Taux d'Occupation Actuel</span>
                  <span className="font-bold font-mono text-indigo-700">{stats.occupancyRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Sessions Exécutées (Période)</span>
                  <span className="font-bold font-mono">{completedSessions.length} Sessions</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Commandes Caisse Livrées</span>
                  <span className="font-bold font-mono text-amber-700">{orders.filter(o => o.status === "delivered").length} Commandes</span>
                </div>
              </div>
            </div>

          </div>

          {/* Detailed Transactions Table */}
          <div>
            <h4 className="font-extrabold text-xs uppercase text-slate-600 mb-2">
              Détail Chronologique des Transactions ({filteredTransactions.length})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Horodatage</th>
                    <th className="py-2.5 px-3">Utilisateur</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Montant FCFA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        Aucune transaction pour la période sélectionnée.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 15).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString("fr-FR")} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{t.userName}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.type === "top_up" ? "bg-emerald-100 text-emerald-800" : t.type === "pos_purchase" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {t.type === "top_up" ? "Recharge" : t.type === "pos_purchase" ? "Caisse POS" : "Session"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{t.description}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {t.amount.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature & Validation Footer for Printing */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800">L'Agent / Caissier de Service :</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nom et Signature</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-48"></div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-800">Le Gérant / Administrateur :</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cachet et Validation Finale</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-48 ml-auto"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

