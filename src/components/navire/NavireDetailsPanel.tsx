import { useState } from "react";
import { AlertOctagon, Gauge, Info, Package, Pencil, Ship, Trash2, X } from "lucide-react";
import type { ArretNavire, ChargementPortique, Navire, NavireStatus } from "./navireData";
import { aggregateTonnageByPortique, analyzeArrets, calculateDuration, calculateRAF, calculateRAFParCale, formatDuration } from "./navireRules";
import NavireEditModal from "./NavireEditModal";
import AuditHistoryPanel from "../audit/AuditHistoryPanel";

const STATUS_META: Record<NavireStatus, { text: string; bg: string; border: string }> = {
  "En rade": { text: "#5e7166", bg: "#f2f4f0", border: "#dfe6d7" },
  "Accosté": { text: "#1d6fa5", bg: "#e7f2fa", border: "#bfdcef" },
  "En chargement": { text: "#0d6b4d", bg: "#e8f4ed", border: "#cfe3d8" },
  "Chargé": { text: "#237343", bg: "#eef8f1", border: "#b9ddc9" },
  "Parti": { text: "#6c7c71", bg: "#f2f4f0", border: "#dfe6d7" }
};

export default function NavireDetailsPanel({
  navire,
  chargements,
  arrets,
  onClose,
  onUpdate,
  onDelete
}: {
  navire: Navire | null;
  chargements: ChargementPortique[];
  arrets: ArretNavire[];
  onClose: () => void;
  onUpdate?: (id: string, patch: Partial<Navire>) => void;
  onDelete?: (id: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  if (!navire) return null;

  function handleDelete() {
    if (!navire || !onDelete) return;
    if (!window.confirm(`Supprimer définitivement le navire ${navire.nom} et ses lignes de chargement/arrêts associées ?`)) return;
    onDelete(navire.id);
    onClose();
  }

  const raf = calculateRAF(navire.tonnagePrevu, navire.tonnageCharge);
  const statusMeta = STATUS_META[navire.statut];
  const navireChargements = chargements.filter((c) => c.navireId === navire.id);
  const navireArrets = arrets.filter((a) => a.navireId === navire.id);
  const parPortique = aggregateTonnageByPortique(navireChargements);
  const parCale = calculateRAFParCale(navire.calesPlan ?? [], navireChargements);
  const arretsAnalysis = analyzeArrets(navireArrets);
  const chargementMinutes =
    navire.dateFinChargement && navire.heureFinChargement ? calculateDuration(navire.heureDebutChargement, navire.heureFinChargement) : null;
  const impactPct = chargementMinutes && chargementMinutes > 0 ? Math.round((arretsAnalysis.totalMinutes / chargementMinutes) * 100) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-[#102b20]/25 backdrop-blur-[2px]" onClick={onClose}>
      <section
        onClick={(e) => e.stopPropagation()}
        className="m-4 flex h-[calc(100%-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-[#dfe6d7] bg-white p-6 shadow-[0_24px_60px_rgba(16,43,32,0.18)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Fiche navire</p>
            <h3 className="font-display mt-1 text-2xl font-medium text-[#102b20]">{navire.nom}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onUpdate && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
                title="Modifier le navire"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f] hover:bg-[#f6d5d5]"
                title="Supprimer le navire"
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
          {navire.statut}
        </span>

        <dl className="mt-5 grid gap-3 text-sm">
          <Row label="N° EC" value={navire.numeroEC || "—"} />
          <Row label="Poste / quai" value={navire.poste || "—"} />
          <Row label="Qualité" value={navire.qualite} pill />
          <Row label="Début chargement" value={`${navire.dateDebutChargement} · ${navire.heureDebutChargement}`} />
          <Row label="Fin chargement" value={navire.dateFinChargement ? `${navire.dateFinChargement} · ${navire.heureFinChargement}` : "—"} />
          <Row label="Tonnage prévu" value={`${navire.tonnagePrevu.toLocaleString("fr-FR")} t`} />
          <Row label="Tonnage chargé" value={`${navire.tonnageCharge.toLocaleString("fr-FR")} t`} />
          <Row label="Reste à faire (RAF)" value={`${raf.toLocaleString("fr-FR")} t`} accent={raf > 0} />
        </dl>

        {parPortique.length > 0 && (
          <div className="mt-5 rounded-md border border-[#cfe3d8] bg-[#e8f4ed] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#0d6b4d]">
              <Gauge size={13} aria-hidden="true" />
              Chargement par portique
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#102b20]">
              {parPortique.map((p) => (
                <span key={p.portique}>
                  {p.portique} : {p.tonnage.toLocaleString("fr-FR")} t · {formatDuration(p.dureeMinutes)}
                  {p.cadence ? ` · ${p.cadence} t/h` : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {parCale.length > 0 && (
          <div className="mt-5 rounded-md border border-[#cfe3d8] bg-[#e8f4ed] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#0d6b4d]">
              <Ship size={13} aria-hidden="true" />
              RAF par cale
            </p>
            <div className="mt-2 grid gap-1.5 text-xs font-bold text-[#102b20]">
              {parCale.map((c) => (
                <div key={c.cale} className="flex items-center justify-between">
                  <span>Cale {c.cale}</span>
                  <span>
                    {c.tonnageCharge.toLocaleString("fr-FR")} / {c.tonnagePrevu.toLocaleString("fr-FR")} t
                    {c.raf > 0 && <span className="ml-1.5 text-[#a5460f]">· RAF {c.raf.toLocaleString("fr-FR")} t</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {navireArrets.length > 0 && (
          <div className="mt-5 rounded-md border border-[#f3c9a8] bg-[#fdece0] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#a5460f]">
              <AlertOctagon size={13} aria-hidden="true" />
              Analyse des arrêts ({arretsAnalysis.count})
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#102b20]">
              <span>Immobilisation : {formatDuration(arretsAnalysis.totalMinutes)}</span>
              <span>{impactPct !== null ? `${impactPct}% de la durée de chargement` : "—"}</span>
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
              {navireArrets.slice(0, 5).map((a) => (
                <li key={a.id}>
                  {a.portique} · {a.nature} · {a.heureDebut}{a.heureFin ? `–${a.heureFin}` : " (en cours)"}
                </li>
              ))}
              {navireArrets.length > 5 && <li>+ {navireArrets.length - 5} autre(s)</li>}
            </ul>
          </div>
        )}

        <div className="mt-5 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Info size={13} aria-hidden="true" />
            Lignes de chargement
          </p>
          <p className="mt-1 text-xs font-semibold text-[#6c7c71]">
            {navireChargements.length} ligne(s) enregistrée(s) dans l'onglet "Chargement portiques".
          </p>
        </div>

        <AuditHistoryPanel entityType="navire" entityId={navire.id} />

        {navire.observations && (
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#6c7c71]">
            <Package size={14} className="mt-0.5 shrink-0 text-[#0d6b4d]" aria-hidden="true" />
            {navire.observations}
          </p>
        )}
      </section>

      {onUpdate && editOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <NavireEditModal navire={navire} onClose={() => setEditOpen(false)} onSubmit={(id, patch) => onUpdate(id, patch)} />
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
