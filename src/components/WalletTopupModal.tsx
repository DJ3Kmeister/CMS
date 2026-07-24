import React, { useState } from "react";
import { User, Transaction } from "../types";
import { Wallet, DollarSign, CreditCard, ArrowUpRight, History, CheckCircle, Plus } from "lucide-react";

interface WalletTopupModalProps {
  currentUser: User;
  transactions: Transaction[];
  onClose: () => void;
  onTopUp: (userId: string, amount: number, paymentMethod: string) => Promise<void>;
}

export const WalletTopupModal: React.FC<WalletTopupModalProps> = ({
  currentUser,
  transactions,
  onClose,
  onTopUp
}) => {
  const [topupAmount, setTopupAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<string>("Comptoir Caisse");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const presetAmounts = [2000, 5000, 10000, 25000, 50000];

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount <= 0) return;
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await onTopUp(currentUser.id, topupAmount, paymentMethod);
      setSuccessMsg(`Crédit de ${topupAmount.toLocaleString()} FCFA ajouté avec succès au solde de ${currentUser.name} !`);
      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Top-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTransactions = transactions.filter((t) => t.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Recharger le Solde & Historique</h3>
              <p className="text-xs text-slate-500">{currentUser.name} • {currentUser.role === "admin" ? "ADMINISTRATEUR" : currentUser.role === "staff" ? "PERSONNEL" : "CLIENT"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Current Balance Box */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Solde Disponible</div>
              <div className="text-3xl font-bold text-slate-900 font-mono mt-1">
                {currentUser.balance.toLocaleString()} FCFA
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white text-indigo-700 font-bold uppercase border border-indigo-200 shadow-sm">
                Niveau VIP : {currentUser.vipTier.toUpperCase()}
              </span>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Top-up Form */}
          <form onSubmit={handleTopupSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Montant du Rechargement (FCFA)</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      topupAmount === amt
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +{amt.toLocaleString()} F
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Montant Personnalisé (FCFA)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-mono cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium cursor-pointer"
                >
                  <option value="Comptoir Caisse">Comptoir Caisse</option>
                  <option value="Carte de Crédit (Simulée)">Carte de Crédit (Simulée)</option>
                  <option value="Portefeuille Mobile">Portefeuille Mobile</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Dépôt en cours..." : `Créditer +${topupAmount.toLocaleString()} FCFA`}
            </button>
          </form>

          {/* Ledger History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" /> Historique des Transactions
            </h4>

            {userTransactions.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">Aucune transaction enregistrée.</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userTransactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <span className={`font-mono font-bold ${tx.type === 'top_up' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {tx.type === 'top_up' ? '+' : '-'}{tx.amount.toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
