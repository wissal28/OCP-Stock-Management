import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Module2Navigation, { type ModuleSection } from "./Module2Navigation";
import ChargementView from "./ChargementView";
import DechargementView from "./DechargementView";
import ConvoyeursView from "./ConvoyeursView";
import LotsStockageView from "./LotsStockageView";
import SilosView from "./SilosView";
import PeseusesView from "./PeseusesView";
import EquipementsView from "./EquipementsView";
import FutureExtensionsView from "./FutureExtensionsView";
import SynopticScene from "./SynopticScene";
import { ManutentionStateProvider } from "./manutentionState";

export default function SynoptiqueManutention() {
  const [activeSection, setActiveSection] = useState<ModuleSection>("global");
  const goToGlobal = () => setActiveSection("global");

  return (
    <ManutentionStateProvider>
      <div className="grid gap-5">
        <Module2Navigation activeSection={activeSection} onSelectSection={setActiveSection} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            {activeSection === "global" && <SynopticScene />}
            {activeSection === "dechargement" && <DechargementView onViewGlobal={goToGlobal} />}
            {activeSection === "lots" && <LotsStockageView onViewGlobal={goToGlobal} />}
            {activeSection === "silos" && <SilosView onViewGlobal={goToGlobal} />}
            {activeSection === "peseuses" && <PeseusesView onViewGlobal={goToGlobal} />}
            {activeSection === "convoyeurs" && <ConvoyeursView onViewGlobal={goToGlobal} />}
            {activeSection === "chargement" && <ChargementView onViewGlobal={goToGlobal} />}
            {activeSection === "equipements" && <EquipementsView />}
            {activeSection === "avenir" && <FutureExtensionsView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </ManutentionStateProvider>
  );
}
