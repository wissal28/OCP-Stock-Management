import { useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { CELLULES, SILOS, type Cellule, type CelluleQuantitePrevue } from "./trainData";
import {
  buildLiveCellules,
  classifyDestinationRows,
  formatCelluleLabel,
  getCurrentOperationalDay,
  validateCellQualityCompatibility,
  type DestinationFamily
} from "./trainRules";
import * as api from "../../api";

const CELLULE_IDS = new Set(CELLULES.map((c) => c.id));

const DESTINATION_OPTIONS = [
  ...CELLULES.map((c) => ({ value: c.id, label: formatCelluleLabel(c) })),
  ...SILOS.map((s) => ({ value: s.id, label: s.label })),
  { value: "DIRECT", label: "Navire direct" }
];

// Labels alignés sur le schéma de manutention officiel (OIK/PP) : les cellules Lot 1/2 se
// raccordent au convoyeur collecteur DA10 ou DB10, pas un "DA"/"DB" générique.
const FAMILY_BADGE: Record<DestinationFamily, { label: string; className: string }> = {
  DA: { label: "DA10", className: "border-[#bfdcef] bg-[#e7f2fa] text-[#1d6fa5]" },
  DB: { label: "DB10", className: "border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d]" },
  Silos: { label: "Silos", className: "border-[#e6d8b8] bg-[#fbf3e0] text-[#8a6d1f]" },
  Direct: { label: "Direct", className: "border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f]" }
};

/** Éditeur "cellule/silo + quantité exacte" à lignes répétables — même logique d'ajout/suppression
 * que le RAF par cale de NavireForm.tsx. Utilisé pour planifier, dès la création/édition d'un train,
 * exactement combien de tonnes sont prévues pour chaque cellule/lot/silo (pas seulement lesquels).
 * Si `qualite` (celle du train) est fournie, chaque ligne cellule est vérifiée contre l'état réel du
 * stock : une cellule vide accepte tout, une cellule non vide n'accepte que sa qualité déjà active et
 * seulement si l'espace restant suffit pour la quantité saisie — même règle que côté déchargement
 * (TrainFormModal), confirmée avec l'utilisateur. */
export default function CelluleQuantiteEditor({
  rows,
  onChange,
  compact,
  qualite
}: {
  rows: CelluleQuantitePrevue[];
  onChange: (rows: CelluleQuantitePrevue[]) => void;
  compact?: boolean;
  qualite?: string;
}) {
  const inputClass = compact
    ? "h-9 rounded-md border border-[#dfe6d7] bg-white px-2.5 text-xs font-semibold text-[#102b20] outline-none transition focus:border-[#0d6b4d]"
    : "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-sm font-semibold text-[#102b20] outline-none transition focus:border-[#0d6b4d]";

  const [liveCellules, setLiveCellules] = useState<Cellule[]>(CELLULES);
  useEffect(() => {
    api
      .computeStockSnapshot(getCurrentOperationalDay())
      .then((snapshot) => setLiveCellules(buildLiveCellules(snapshot.cellules)))
      .catch(() => {});
  }, []);

  function updateRow(index: number, patch: Partial<CelluleQuantitePrevue>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.celluleId));
    const first = DESTINATION_OPTIONS.find((o) => !used.has(o.value)) ?? DESTINATION_OPTIONS[0];
    onChange([...rows, { celluleId: first.value, quantite: 0 }]);
  }

  // Même règle que buildDechargementFromTrain (server-side du déchargement) : montre AVANT
  // enregistrement par quel flux chaque destination sera réellement déchargée (DA/DB alternés pour
  // les cellules, Silos, ou Direct navire) — pour que ce ne soit jamais une surprise après coup.
  const classified = classifyDestinationRows(rows);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const family = classified[index]?.family;
        const badge = family ? FAMILY_BADGE[family] : null;
        const issue =
          qualite && CELLULE_IDS.has(row.celluleId)
            ? validateCellQualityCompatibility(row.celluleId, qualite, liveCellules, row.quantite)
            : null;
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {badge &&
                (family === "DA" || family === "DB" ? (
                  <button
                    type="button"
                    onClick={() => updateRow(index, { flux: family === "DA" ? "DB" : "DA" })}
                    className={`shrink-0 cursor-pointer rounded-full border px-2 py-1 text-[10px] font-black transition hover:opacity-75 ${badge.className}`}
                    title="Cliquer pour basculer entre DA10 et DB10 — c'est vous qui décidez le flux, pas l'application"
                  >
                    {badge.label}
                  </button>
                ) : (
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${badge.className}`} title="Flux de déchargement">
                    {badge.label}
                  </span>
                ))}
              <select
                value={row.celluleId}
                onChange={(e) => updateRow(index, { celluleId: e.target.value })}
                className={`${inputClass} flex-1 ${issue && !issue.valid ? "border-[#f0c2c2]" : ""}`}
              >
                {DESTINATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={row.quantite || ""}
                onChange={(e) => updateRow(index, { quantite: Number(e.target.value) || 0 })}
                placeholder="Quantité (t)"
                className={`${inputClass} w-32`}
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
            {issue && !issue.valid && (
              <p className="flex items-center gap-1.5 pl-1 text-[11px] font-bold text-[#9a2f2f]">
                <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
                {issue.reason}
              </p>
            )}
          </div>
        );
      })}
      <button type="button" onClick={addRow} className="self-start text-xs font-bold text-[#0d6b4d] hover:text-[#0a563d]">
        + Ajouter une destination
      </button>
    </div>
  );
}
