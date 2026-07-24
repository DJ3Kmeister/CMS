import React, { useState } from "react";
import { Reservation, Computer, User } from "../types";
import { Calendar, Clock, Monitor, CheckCircle, ShieldCheck, Plus, User as UserIcon } from "lucide-react";

interface ReservationPlannerProps {
  reservations: Reservation[];
  computers: Computer[];
  currentUser: User;
  onCreateReservation: (userId: string, computerId: string, date: string, timeSlot: string, durationHours: number) => Promise<void>;
}

export const ReservationPlanner: React.FC<ReservationPlannerProps> = ({
  reservations,
  computers,
  currentUser,
  onCreateReservation
}) => {
  const [selectedPcId, setSelectedPcId] = useState<string>(computers[0]?.id || "pc-01");
  const [date, setDate] = useState<string>("2026-07-23");
  const [timeSlot, setTimeSlot] = useState<string>("18:00 - 20:00");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const timeSlots = [
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
    "18:00 - 20:00",
    "20:00 - 22:00",
    "22:00 - 02:00 (Overnight)"
  ];

  const selectedPc = computers.find((c) => c.id === selectedPcId);
  const calculatedPrice = selectedPc ? selectedPc.hourlyRate * durationHours : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onCreateReservation(currentUser.id, selectedPcId, date, timeSlot, durationHours);
      setSuccessMessage("Workstation reserved successfully! Check reservation log.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Reservation Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Réserver un Poste PC</h2>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Sélectionner un Poste PC</label>
            <select
              value={selectedPcId}
              onChange={(e) => setSelectedPcId(e.target.value)}
              className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-medium cursor-pointer"
            >
              {computers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.hourlyRate} FCFA/h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-mono cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Créneau Horaire</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-medium cursor-pointer"
            >
              {timeSlots.map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Durée (Heures)</label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-mono cursor-pointer"
            >
              <option value={1}>1 Heure</option>
              <option value={2}>2 Heures</option>
              <option value={3}>3 Heures</option>
              <option value={5}>Pass 5 Heures</option>
            </select>
          </div>

          {selectedPc && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">{selectedPc.specs}</div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-800 font-bold">
                <span>Prix Calculé :</span>
                <span className="text-emerald-700 font-mono text-sm">{calculatedPrice.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer"
          >
            {isSubmitting ? "Réservation en cours..." : "Confirmer la Réservation"}
          </button>
        </form>
      </div>

      {/* Reservation Log List */}
      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Calendrier des Réservations Actives
          </h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
            {reservations.length} Créneaux Réservés
          </span>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Aucune réservation à venir.
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((resv) => (
              <div
                key={resv.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{resv.computerName}</span>
                    <span className="text-xs text-indigo-700 font-medium px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                      {resv.userName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Date : <strong className="text-slate-800">{resv.date}</strong></span>
                    <span>Créneau : <strong className="text-slate-800">{resv.timeSlot}</strong></span>
                    <span>Durée : {resv.durationHours}h</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-700 font-mono">
                    {resv.totalPrice.toLocaleString()} FCFA
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {resv.status === "confirmed" ? "CONFIRMÉE" : resv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
