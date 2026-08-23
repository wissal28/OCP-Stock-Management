import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { buildNotifications, type AppNotification } from "./notificationsRules";
import { readStockSnapshots, resolveTodaySnapshot } from "../components/stock/stockRules";
import * as api from "../api";

const REFRESH_MS = 60000;

const SEVERITY_DOT: Record<AppNotification["severity"], string> = {
  critique: "#9a2f2f",
  attention: "#a5460f",
  info: "#5e7166"
};

/** Centre de notifications — cloche dans l'en-tête, dropdown listant les anomalies détectées en
 * direct (stock mort critique, incidents/inspections/actions HSE, trains en retard, arrêts
 * prolongés). Ne stocke rien : recalculé depuis les données déjà exposées par l'API à chaque
 * ouverture / toutes les 60s, comme le fait déjà le Dashboard pour le stock. */
export default function NotificationBell({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const [snapshots, incidents, inspections, actions, trains, arretsNavire, arretsTrain] = await Promise.all([
        readStockSnapshots(),
        api.listIncidents(),
        api.listInspections(),
        api.listActions(),
        api.listTrains(),
        api.listArrets(),
        api.listArretsTrain()
      ]);
      const { snapshot } = resolveTodaySnapshot(snapshots);
      setNotifications(buildNotifications({ cellules: snapshot.cellules, incidents, inspections, actions, trains, arretsNavire, arretsTrain }));
    } catch {
      // silencieux — la cloche reste à 0 si l'API est indisponible, pas d'erreur bloquante
    }
  }

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const critiques = notifications.filter((n) => n.severity === "critique").length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#1e3a2c] bg-[#12241a] text-[#9fb3a6] transition hover:border-[#b7d534]/45 hover:bg-[#15321f] hover:text-[#b7d534]"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={17} aria-hidden="true" />
        {notifications.length > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${
              critiques > 0 ? "bg-[#9a2f2f]" : "bg-[#a5460f]"
            }`}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-[#dfe6d7] bg-white shadow-[0_24px_60px_rgba(16,43,32,0.18)]">
          <div className="border-b border-[#eef1ea] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.06em] text-[#5e7166]">
              Notifications {notifications.length > 0 && `(${notifications.length})`}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-6 text-xs font-semibold text-[#829187]">
                <Info size={14} aria-hidden="true" />
                Aucune anomalie détectée.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onNavigate(n.view);
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-[#eef1ea] px-4 py-2.5 text-left transition last:border-0 hover:bg-[#f6f9f2]"
                >
                  <span className="flex items-center gap-1.5 text-xs font-black text-[#102b20]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_DOT[n.severity] }} aria-hidden="true" />
                    {n.label}
                  </span>
                  <span className="pl-3 text-[11px] font-semibold text-[#6c7c71]">{n.detail}</span>
                </button>
              ))
            )}
          </div>
          {critiques > 0 && (
            <div className="flex items-center gap-1.5 border-t border-[#eef1ea] px-4 py-2 text-[10px] font-bold text-[#9a2f2f]">
              <AlertTriangle size={11} aria-hidden="true" />
              {critiques} anomalie(s) critique(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
