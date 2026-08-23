import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HSENavigation, { type HSESection } from "./HSENavigation";
import HSEOverview from "./HSEOverview";
import IncidentsView from "./IncidentsView";
import InspectionsView from "./InspectionsView";
import ActionsView from "./ActionsView";
import { ACTIONS, INCIDENTS, INSPECTIONS, type HSEAction, type HSEIncident, type HSEInspection } from "./hseData";
import * as api from "../../api";

export default function GestionHSE() {
  const [section, setSection] = useState<HSESection>("vue");
  const [incidents, setIncidents] = useState<HSEIncident[]>(INCIDENTS);
  const [inspections, setInspections] = useState<HSEInspection[]>(INSPECTIONS);
  const [actions, setActions] = useState<HSEAction[]>(ACTIONS);

  useEffect(() => {
    api.listIncidents().then(setIncidents).catch(() => {});
    api.listInspections().then(setInspections).catch(() => {});
    api.listActions().then(setActions).catch(() => {});
  }, []);

  function handleCreateIncident(incident: HSEIncident) {
    setIncidents((prev) => [incident, ...prev]);
    api.createIncident(incident).catch(() => {});
  }

  function handleUpdateIncident(id: string, patch: Partial<HSEIncident>) {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    api.updateIncident(id, patch).catch(() => {});
  }

  function handleDeleteIncident(id: string) {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    api.deleteIncident(id).catch(() => {});
  }

  function handleCreateInspection(inspection: HSEInspection) {
    setInspections((prev) => [inspection, ...prev]);
    api.createInspection(inspection).catch(() => {});
  }

  function handleUpdateInspection(id: string, patch: Partial<HSEInspection>) {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    api.updateInspection(id, patch).catch(() => {});
  }

  function handleDeleteInspection(id: string) {
    setInspections((prev) => prev.filter((i) => i.id !== id));
    api.deleteInspection(id).catch(() => {});
  }

  function handleCreateAction(action: HSEAction) {
    setActions((prev) => [action, ...prev]);
    api.createAction(action).catch(() => {});
  }

  function handleUpdateAction(id: string, patch: Partial<HSEAction>) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    api.updateAction(id, patch).catch(() => {});
  }

  function handleDeleteAction(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
    api.deleteAction(id).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
        <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">HSE — Hygiène, Sécurité, Environnement</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
          Déclaration d'incidents/accidents, inspections et checklists sécurité, indicateurs de suivi.
        </p>
      </div>

      <HSENavigation active={section} onChange={setSection} />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {section === "vue" ? (
            <HSEOverview incidents={incidents} inspections={inspections} actions={actions} />
          ) : section === "incidents" ? (
            <IncidentsView incidents={incidents} onCreate={handleCreateIncident} onUpdate={handleUpdateIncident} onDelete={handleDeleteIncident} />
          ) : section === "inspections" ? (
            <InspectionsView
              inspections={inspections}
              onCreate={handleCreateInspection}
              onUpdate={handleUpdateInspection}
              onDelete={handleDeleteInspection}
            />
          ) : (
            <ActionsView
              actions={actions}
              incidents={incidents}
              inspections={inspections}
              onCreate={handleCreateAction}
              onUpdate={handleUpdateAction}
              onDelete={handleDeleteAction}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
