import { useState } from "react";
import { AlertOctagon, Package, Pencil, Route, Ship, Timer, Trash2, X } from "lucide-react";
import type { ArretTrain, Dechargement, Train, TrainStatus } from "./trainData";
import { SILOS } from "./trainData";
import AuditHistoryPanel from "../audit/AuditHistoryPanel";
import {
  analyzeArrets,
  calculateCadence,
  calculateDuration,
  calculateEcart,
  calculateTotalByDestination,
  formatDuration,
  getCelluleTransfersForDechargements
} from "./trainRules";
import TrainEditModal from "./TrainEditModal";

function labelForDestination(destination: string): string {
  if (destination === "DIRECT") return "Navire direct";
  const silo = SILOS.find((s) => s.id === destination);
  return silo ? silo.label : destination;
}

const STATUS_META: Record<TrainStatus, { text: string; bg: string; border: string }> = {
  "Prévu": { text: "#5e7166", bg: "#f2f4f0", border: "#dfe6d7" },
  "Arrivé": { text: "#0d6b4d", bg: "#e8f4ed", border: "#cfe3d8" },
  "En déchargement": { text: "#1d6fa5", bg: "#e7f2fa", border: "#bfdcef" },
  "Déchargé": { text: "#237343", bg: "#eef8f1", border: "#b9ddc9" },
  "En retard": { text: "#a5460f", bg: "#fdece0", border: "#f3c9a8" },
  "Annulé": { text: "#9a2f2f", bg: "#fbe9e9", border: "#f0c2c2" }
};

export default function TrainDetailsPanel({
  train,
  dechargements,
  arretsTrain,
  onClose,
  onUpdate,
  onDelete
}: {
  train: Train | null;
  /** Tous les déchargements connus (toutes journées confondues) — filtrés ici par train pour
   * afficher exactement quelles cellules ont reçu du phosphate et en quelle quantité. */
  dechargements?: Dechargement[];
  /** Tous les arrêts connus — filtrés ici par train pour l'analyse des immobilisations. */
  arretsTrain?: ArretTrain[];
  onClose: () => void;
  onUpdate?: (id: string, patch: Partial<Train>) => void;
  onDelete?: (id: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  if (!train) return null;

  function handleDelete() {
    if (!train || !onDelete) return;
    if (!window.confirm(`Supprimer définitivement le train ${train.numeroTrain} ?`)) return;
    onDelete(train.id);
    onClose();
  }

  const ecart = calculateEcart(train.tonnageExpedie, train.tonnageBascule);
  const statusMeta = STATUS_META[train.statut];
  const trainDechargements = (dechargements ?? []).filter((d) => d.trainId === train.id);
  const totals = trainDechargements.length
    ? trainDechargements
        .map(calculateTotalByDestination)
        .reduce((acc, t) => ({
          da: acc.da + t.da,
          db: acc.db + t.db,
          silos: acc.silos + t.silos,
          cellules: acc.cellules + t.cellules,
          navire: acc.navire + t.navire,
          total: acc.total + t.total
        }))
    : null;
  const dureeMinutes = trainDechargements.length
    ? trainDechargements.reduce((s, d) => s + (calculateDuration(d.debutDechargement, d.finDechargement) ?? 0), 0)
    : null;
  const cadence = trainDechargements.length
    ? calculateCadence(
        trainDechargements.reduce((s, d) => s + d.tonnageBascule, 0),
        dureeMinutes
      )
    : null;
  const celluleTransfers = getCelluleTransfersForDechargements(trainDechargements);
  const trainArrets = (arretsTrain ?? []).filter((a) => a.trainId === train.id);
  const arretsAnalysis = analyzeArrets(trainArrets);
  const impactPct = dureeMinutes && dureeMinutes > 0 ? Math.round((arretsAnalysis.totalMinutes / dureeMinutes) * 100) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-[#102b20]/25 backdrop-blur-[2px]" onClick={onClose}>
      <section
        onClick={(e) => e.stopPropagation()}
        className="m-4 flex h-[calc(100%-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-[#dfe6d7] bg-white p-6 shadow-[0_24px_60px_rgba(16,43,32,0.18)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Fiche train</p>
            <h3 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Train {train.numeroTrain}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onUpdate && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
                title="Modifier le train"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f] hover:bg-[#f6d5d5]"
                title="Supprimer le train"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <span
          className="mt-3 inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-black"
          style={{ color: statusMeta.text, backgroundColor: statusMeta.bg, borderColor: statusMeta.border }}
        >
          {train.statut}
        </span>

        <dl className="mt-5 grid gap-3 text-sm">
          <Row label="Matricule" value={train.matricule} />
          <Row label="Arrivée prévue" value={`${train.dateArriveePrevue} · ${train.heureArriveePrevue}`} />
          <Row label="Arrivée réelle" value={train.heureArriveeReelle || "—"} />
          <Row label="Nombre de wagons" value={String(train.nombreWagons)} />
          <Row label="Qualité" value={train.qualite} pill />
          <Row label="Tonnage prévu" value={`${train.tonnagePrevu.toLocaleString("fr-FR")} t`} />
          <Row label="Tonnage expédié" value={`${train.tonnageExpedie.toLocaleString("fr-FR")} t`} />
          <Row label="Tonnage bascule" value={`${train.tonnageBascule.toLocaleString("fr-FR")} t`} />
          <Row label="Écart" value={`${ecart > 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")} t`} accent={ecart !== 0} />
          <Row label="Destination prévue" value={train.destinationPrevue} />
        </dl>

        {train.celluleDestinationPrevue.length > 0 && (
          <div className="mt-5 rounded-md border border-dashed border-[#cfe3d8] bg-[#f6f9f2] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
              <Route size={13} aria-hidden="true" />
              Cellule(s)/silo(s) prévu(s) — planifié
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {train.celluleDestinationPrevue.map((row) => (
                <span
                  key={row.celluleId}
                  className="whitespace-nowrap rounded-full border border-[#dfe6d7] bg-white px-2.5 py-1 text-[11px] font-bold text-[#314238]"
                >
                  {labelForDestination(row.celluleId)} : {row.quantite.toLocaleString("fr-FR")} t
                </span>
              ))}
            </div>
          </div>
        )}

        {totals && (
          <div className="mt-5 rounded-md border border-[#cfe3d8] bg-[#e8f4ed] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#0d6b4d]">
              <Route size={13} aria-hidden="true" />
              Répartition du déchargement
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#102b20]">
              <span>DA : {totals.da.toLocaleString("fr-FR")} t</span>
              <span>DB : {totals.db.toLocaleString("fr-FR")} t</span>
              <span>Silos : {totals.silos.toLocaleString("fr-FR")} t</span>
              <span>Cellules : {totals.cellules.toLocaleString("fr-FR")} t</span>
              <span className="col-span-2 flex items-center gap-1">
                <Ship size={12} aria-hidden="true" /> Navire direct : {totals.navire.toLocaleString("fr-FR")} t
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#5e7166]">
              <Timer size={13} aria-hidden="true" />
              Durée : {formatDuration(dureeMinutes)} · Cadence : {cadence ?? "—"} t/h
            </p>
          </div>
        )}

        {celluleTransfers.length > 0 && (
          <div className="mt-5 rounded-md border border-[#dfe6d7] bg-white p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
              <Route size={13} aria-hidden="true" />
              Cellules exactes de destination
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {celluleTransfers.map((t) => (
                <span
                  key={t.destination}
                  className="whitespace-nowrap rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2.5 py-1 text-[11px] font-bold text-[#0d6b4d]"
                >
                  {labelForDestination(t.destination)} : {t.quantite.toLocaleString("fr-FR")} t
                </span>
              ))}
            </div>
          </div>
        )}

        {trainArrets.length > 0 && (
          <div className="mt-5 rounded-md border border-[#f3c9a8] bg-[#fdece0] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#a5460f]">
              <AlertOctagon size={13} aria-hidden="true" />
              Analyse des arrêts ({arretsAnalysis.count})
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#102b20]">
              <span>Immobilisation : {formatDuration(arretsAnalysis.totalMinutes)}</span>
              <span>{impactPct !== null ? `${impactPct}% de la durée de déchargement` : "—"}</span>
              {arretsAnalysis.ongoing > 0 && (
                <span className="col-span-2 text-[#a5460f]">{arretsAnalysis.ongoing} arrêt(s) toujours en cours</span>
              )}
            </div>
            {arretsAnalysis.byNature.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {arretsAnalysis.byNature.map((n) => (
                  <div key={n.nature} className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#6c7c71]">
                    <span className="truncate">
                      {n.nature} ({n.count})
                    </span>
                    <span className="shrink-0 font-black text-[#a5460f]">{formatDuration(n.minutes)}</span>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-3 grid gap-1.5 border-t border-dashed border-[#f3c9a8] pt-3 text-xs font-semibold text-[#6c7c71]">
              {trainArrets.slice(0, 5).map((a) => (
                <li key={a.id}>
                  {a.axe || "—"} · {a.nature} · {a.heureDebut}{a.heureFin ? `–${a.heureFin}` : " (en cours)"}
                </li>
              ))}
              {trainArrets.length > 5 && <li>+ {trainArrets.length - 5} autre(s)</li>}
            </ul>
          </div>
        )}

        {trainDechargements.length === 0 && (
          <p className="mt-5 rounded-md border border-dashed border-[#dfe6d7] bg-[#f6f9f2] p-3 text-xs font-semibold text-[#6c7c71]">
            Aucun déchargement enregistré pour ce train — les cellules de destination ne sont pas encore connues.
          </p>
        )}

        <AuditHistoryPanel entityType="train" entityId={train.id} />

        {train.observations && (
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#6c7c71]">
            <Package size={14} className="mt-0.5 shrink-0 text-[#0d6b4d]" aria-hidden="true" />
            {train.observations}
          </p>
        )}
      </section>

      {onUpdate && editOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <TrainEditModal train={train} onClose={() => setEditOpen(false)} onSubmit={(id, patch) => onUpdate(id, patch)} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, pill, accent }: { label: string; value: string; pill?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#e3e9de] pb-3">
      <dt className="font-bold text-[#5e7166]">{label}</dt>
      {pill ? (
        <dd className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2.5 py-0.5 font-black text-[#0d6b4d]">{value}</dd>
      ) : (
        <dd className={`font-black ${accent ? "text-[#a5460f]" : "text-[#102b20]"}`}>{value}</dd>
      )}
    </div>
  );
}
