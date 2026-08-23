import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StockNavigation, { type StockSection } from "./StockNavigation";
import HistoriqueStock from "./HistoriqueStock";
import { STOCK_SNAPSHOTS, type CelluleStock, type StockSnapshot, type ZoneStock } from "./stockData";
import { getCurrentOperationalDay, getOperationalDayRange, readStockSnapshots, resolveTodaySnapshot } from "./stockRules";
import StockGrid from "./StockGrid";
import StockQualitePanel from "./StockQualitePanel";
import * as api from "../../api";

export default function GestionStock() {
  const [section, setSection] = useState<StockSection>("etat");
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>(() => [...STOCK_SNAPSHOTS].sort((a, b) => b.date.localeCompare(a.date)));

  // L'état de stock du jour J couvre la journée d'exploitation 7h00 → 7h00 le lendemain, comme sur
  // le bordereau ("Total stock vif à 7h00") et comme le module Train — pas le jour civil.
  async function refresh(): Promise<StockSnapshot[]> {
    const list = await readStockSnapshots();
    const { snapshot: todaySnapshot, isNew } = resolveTodaySnapshot(list);
    if (!isNew) {
      setSnapshots(list);
      return list;
    }
    // Premier accès à la journée : le serveur calcule normalement déjà ce snapshot au rollover de
    // 07h00 (stockRolloverJob.js), mais on le recalcule ici aussi par sécurité (accès avant 07h00,
    // API indisponible au moment exact du rollover, etc.) plutôt que de simplement cloner la veille.
    let computed = todaySnapshot;
    try {
      computed = await api.computeStockSnapshot(todaySnapshot.date);
    } catch {
      // conserve le clone de la veille calculé par resolveTodaySnapshot
    }
    api.saveStockSnapshot(computed).catch(() => {});
    const next = [computed, ...list];
    setSnapshots(next);
    return next;
  }

  useEffect(() => {
    refresh();
  }, []);

  const today = getCurrentOperationalDay();
  const todaySnapshot = snapshots.find((s) => s.date === today) ?? resolveTodaySnapshot(snapshots).snapshot;
  const dayRange = getOperationalDayRange(todaySnapshot.date);

  function persist(next: StockSnapshot) {
    setSnapshots((prev) => (prev.some((s) => s.date === next.date) ? prev.map((s) => (s.date === next.date ? next : s)) : [next, ...prev]));
    api.saveStockSnapshot(next).catch(() => {});
  }

  function handleCelluleChange(celluleId: string, patch: Partial<CelluleStock>) {
    persist({
      ...todaySnapshot,
      cellules: todaySnapshot.cellules.map((c) => (c.celluleId === celluleId ? { ...c, ...patch } : c))
    });
  }

  function handleZoneChange(zoneId: string, patch: Partial<ZoneStock>) {
    persist({
      ...todaySnapshot,
      zones: todaySnapshot.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z))
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
        <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Gestion de stock</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
          État courant et historique des cellules de stockage — digitalise le bordereau journalier "ETAT DES STOCKS" du port.
        </p>
      </div>

      <StockNavigation active={section} onChange={setSection} />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {section === "etat" ? (
            <div className="flex flex-col gap-5">
              <p className="text-xs font-bold text-[#0d6b4d]">Journée d'exploitation : {dayRange.label}</p>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <StockGrid
                  cellules={todaySnapshot.cellules}
                  zones={todaySnapshot.zones}
                  editable
                  onCelluleChange={handleCelluleChange}
                  onZoneChange={handleZoneChange}
                />
                <StockQualitePanel snapshot={todaySnapshot} />
              </div>
            </div>
          ) : (
            <HistoriqueStock snapshots={snapshots} onRefresh={refresh} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
