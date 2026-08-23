import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TrainNavigation, { type TrainSection } from "./TrainNavigation";
import TrainOverview from "./TrainOverview";
import HorairesTrainsView from "./HorairesTrainsView";
import DechargementTrainsView from "./DechargementTrainsView";
import ArretsTrainView from "./ArretsTrainView";
import HistoriqueTrain from "./HistoriqueTrain";
import { ARRETS_TRAIN, DECHARGEMENTS, TRAINS, type ArretTrain, type Dechargement, type Train } from "./trainData";
import { buildDechargementFromTrain } from "./trainRules";
import * as api from "../../api";

export default function GestionTrains() {
  const [section, setSection] = useState<TrainSection>("vue");
  const [trains, setTrains] = useState<Train[]>(TRAINS);
  const [dechargements, setDechargements] = useState<Dechargement[]>(DECHARGEMENTS);
  const [arretsTrain, setArretsTrain] = useState<ArretTrain[]>(ARRETS_TRAIN);

  useEffect(() => {
    api.listTrains().then(setTrains).catch(() => {});
    api.listDechargements().then(setDechargements).catch(() => {});
    api.listArretsTrain().then(setArretsTrain).catch(() => {});
  }, []);

  // Un train se décharge réellement en un seul geste : la moitié des wagons part en DA, l'autre
  // moitié en DB, vers les cellules/silos/navire déjà choisis à la création (confirmé avec
  // l'utilisateur) — donc "Ajouter un train" crée aussi son déchargement, sans ressaisie dans
  // l'onglet Déchargement (qui reste modifiable ensuite : axe, heures, tonnage réel...).
  function handleCreateTrain(train: Train) {
    setTrains((prev) => [train, ...prev]);
    api.createTrain(train).catch(() => {});
    if (train.celluleDestinationPrevue.length > 0) {
      handleCreateDechargement(buildDechargementFromTrain(train));
    }
  }

  function handleUpdateTrain(id: string, patch: Partial<Train>) {
    setTrains((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    api.updateTrain(id, patch).catch(() => {});
  }

  function handleDeleteTrain(id: string) {
    setTrains((prev) => prev.filter((t) => t.id !== id));
    setArretsTrain((prev) => prev.filter((a) => a.trainId !== id));
    api.deleteTrain(id).catch(() => {});
  }

  async function handleImportTrainsCsv() {
    const result = await api.importTrainsFromCsv();
    const fresh = await api.listTrains();
    setTrains(fresh);
    return result;
  }

  function handleCreateDechargement(dechargement: Dechargement) {
    setDechargements((prev) => [dechargement, ...prev]);
    api.createDechargement(dechargement).catch(() => {});
  }

  function handleUpdateDechargement(id: string, patch: Partial<Dechargement>) {
    setDechargements((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    api.updateDechargement(id, patch).catch(() => {});
  }

  function handleDuplicateDechargement(dechargement: Dechargement) {
    const copy = { ...dechargement, id: `${dechargement.id}-copie-${Date.now()}` };
    setDechargements((prev) => [copy, ...prev]);
    api.createDechargement(copy).catch(() => {});
  }

  function handleDeleteDechargement(id: string) {
    setDechargements((prev) => prev.filter((d) => d.id !== id));
    api.deleteDechargement(id).catch(() => {});
  }

  function handleCreateArretTrain(arret: ArretTrain) {
    setArretsTrain((prev) => [arret, ...prev]);
    api.createArretTrain(arret).catch(() => {});
  }

  function handleUpdateArretTrain(id: string, patch: Partial<ArretTrain>) {
    setArretsTrain((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    api.updateArretTrain(id, patch).catch(() => {});
  }

  function handleDeleteArretTrain(id: string) {
    setArretsTrain((prev) => prev.filter((a) => a.id !== id));
    api.deleteArretTrain(id).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
        <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Gestion des trains</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
          Suivi des arrivées, du déchargement et de la répartition des trains de phosphate — digitalise le fichier Excel de suivi journalier.
        </p>
      </div>

      <TrainNavigation active={section} onChange={setSection} />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {section === "vue" ? (
            <TrainOverview trains={trains} dechargements={dechargements} />
          ) : section === "trains" ? (
            <div className="flex flex-col gap-8">
              <HorairesTrainsView
                trains={trains}
                dechargements={dechargements}
                arretsTrain={arretsTrain}
                onCreate={handleCreateTrain}
                onUpdate={handleUpdateTrain}
                onDelete={handleDeleteTrain}
                onImportCsv={handleImportTrainsCsv}
              />
              <div className="border-t border-dashed border-[#dfe6d7] pt-8">
                <DechargementTrainsView
                  dechargements={dechargements}
                  trains={trains}
                  onCreate={handleCreateDechargement}
                  onUpdate={handleUpdateDechargement}
                  onDuplicate={handleDuplicateDechargement}
                  onDelete={handleDeleteDechargement}
                />
              </div>
            </div>
          ) : section === "arrets" ? (
            <ArretsTrainView
              trains={trains}
              arrets={arretsTrain}
              onCreate={handleCreateArretTrain}
              onUpdate={handleUpdateArretTrain}
              onDelete={handleDeleteArretTrain}
            />
          ) : (
            <HistoriqueTrain
              trains={trains}
              dechargements={dechargements}
              onUpdateDechargement={(d) => handleUpdateDechargement(d.id, d)}
              onDeleteDechargement={handleDeleteDechargement}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
