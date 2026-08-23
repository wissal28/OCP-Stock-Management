import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NavireNavigation, { type NavireSection } from "./NavireNavigation";
import NavireOverview from "./NavireOverview";
import NaviresListView from "./NaviresListView";
import ChargementNavireView from "./ChargementNavireView";
import ArretsNavireView from "./ArretsNavireView";
import HistoriqueNavire from "./HistoriqueNavire";
import { ARRETS, CHARGEMENTS, NAVIRES, type ArretNavire, type ChargementPortique, type Navire } from "./navireData";
import { computeNavireTonnageCharge } from "./navireRules";
import * as api from "../../api";

export default function GestionNavires() {
  const [section, setSection] = useState<NavireSection>("vue");
  const [navires, setNavires] = useState<Navire[]>(NAVIRES);
  const [chargements, setChargements] = useState<ChargementPortique[]>(CHARGEMENTS);
  const [arrets, setArrets] = useState<ArretNavire[]>(ARRETS);

  useEffect(() => {
    api.listNavires().then(setNavires).catch(() => {});
    api.listChargements().then(setChargements).catch(() => {});
    api.listArrets().then(setArrets).catch(() => {});
  }, []);

  // Le tonnage chargé d'un navire est dérivé de ses lignes de chargement, comme le total
  // "Pesée bascules" du bordereau Excel — jamais saisi à la main.
  useEffect(() => {
    setNavires((prev) => {
      const next = prev.map((n) => ({ ...n, tonnageCharge: computeNavireTonnageCharge(n.id, chargements) }));
      const changed = next.filter((n, i) => n.tonnageCharge !== prev[i].tonnageCharge);
      changed.forEach((n) => api.updateNavire(n.id, { tonnageCharge: n.tonnageCharge }).catch(() => {}));
      return changed.length === 0 ? prev : next;
    });
  }, [chargements]);

  function handleCreateNavire(navire: Navire) {
    setNavires((prev) => [navire, ...prev]);
    api.createNavire(navire).catch(() => {});
  }

  function handleUpdateNavire(id: string, patch: Partial<Navire>) {
    setNavires((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    api.updateNavire(id, patch).catch(() => {});
  }

  function handleDeleteNavire(id: string) {
    setNavires((prev) => prev.filter((n) => n.id !== id));
    setChargements((prev) => prev.filter((c) => c.navireId !== id));
    setArrets((prev) => prev.filter((a) => a.navireId !== id));
    api.deleteNavire(id).catch(() => {});
  }

  async function handleImportNaviresCsv() {
    const result = await api.importNaviresFromCsv();
    const fresh = await api.listNavires();
    setNavires(fresh);
    return result;
  }

  function handleCreateChargement(row: ChargementPortique) {
    setChargements((prev) => [...prev, row]);
    api.createChargement(row).catch(() => {});
  }

  function handleUpdateChargement(id: string, patch: Partial<ChargementPortique>) {
    setChargements((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    api.updateChargement(id, patch).catch(() => {});
  }

  function handleDuplicateChargement(row: ChargementPortique) {
    setChargements((prev) => [...prev, row]);
    api.createChargement(row).catch(() => {});
  }

  function handleDeleteChargement(id: string) {
    setChargements((prev) => prev.filter((c) => c.id !== id));
    api.deleteChargement(id).catch(() => {});
  }

  function handleImportChargements(rows: ChargementPortique[]) {
    setChargements((prev) => [...prev, ...rows]);
    api.createChargementsBulk(rows).catch(() => {});
  }

  function handleCreateArret(arret: ArretNavire) {
    setArrets((prev) => [arret, ...prev]);
    api.createArret(arret).catch(() => {});
  }

  function handleUpdateArret(id: string, patch: Partial<ArretNavire>) {
    setArrets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    api.updateArret(id, patch).catch(() => {});
  }

  function handleDeleteArret(id: string) {
    setArrets((prev) => prev.filter((a) => a.id !== id));
    api.deleteArret(id).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
        <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Gestion des navires</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
          Suivi des escales, du chargement par portique et des arrêts — digitalise le bordereau "Point Horaire de Chargement" du port.
        </p>
      </div>

      <NavireNavigation active={section} onChange={setSection} />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {section === "vue" ? (
            <NavireOverview navires={navires} chargements={chargements} arrets={arrets} />
          ) : section === "navires" ? (
            <NaviresListView
              navires={navires}
              chargements={chargements}
              arrets={arrets}
              onCreate={handleCreateNavire}
              onUpdate={handleUpdateNavire}
              onDelete={handleDeleteNavire}
              onImportCsv={handleImportNaviresCsv}
            />
          ) : section === "chargement" ? (
            <ChargementNavireView
              navires={navires}
              chargements={chargements}
              onCreate={handleCreateChargement}
              onUpdate={handleUpdateChargement}
              onDuplicate={handleDuplicateChargement}
              onDelete={handleDeleteChargement}
              onImport={handleImportChargements}
              onUpdateNavire={handleUpdateNavire}
              onDeleteNavire={handleDeleteNavire}
            />
          ) : section === "arrets" ? (
            <ArretsNavireView navires={navires} arrets={arrets} onCreate={handleCreateArret} onUpdate={handleUpdateArret} onDelete={handleDeleteArret} />
          ) : (
            <HistoriqueNavire
              navires={navires}
              chargements={chargements}
              arrets={arrets}
              onUpdateNavire={handleUpdateNavire}
              onDeleteNavire={handleDeleteNavire}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
