import { useState } from "react";
import { Eye, Layers } from "lucide-react";
import EquipmentTable from "./EquipmentTable";
import { LOTS, getAxesByLot, getCellulesByAxe, getEquipmentsByLot, getLotById } from "./synoptiqueManutentionData";

const STATUS_META: Record<string, { text: string; bg: string; border: string }> = {
  "Actif": { text: "#237343", bg: "#eef8f1", border: "#b9ddc9" },
  "En attente": { text: "#8a5a10", bg: "#fdf3df", border: "#f0d9a8" },
  "Non renseigné": { text: "#5e7166", bg: "#f2f4f0", border: "#dfe6d7" }
};

export default function LotsStockageView({ onViewGlobal }: { onViewGlobal: () => void }) {
  const [selectedLotId, setSelectedLotId] = useState("lot-1");
  const selectedLot = getLotById(selectedLotId) ?? LOTS[0];
  const axes = getAxesByLot(selectedLotId);
  const lotEquipments = getEquipmentsByLot(selectedLotId);

  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Lots et stockage</p>
            <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Lots et stockage</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Le phosphate déchargé est stocké dans trois lots. Le Lot 1 et le Lot 2 comportent chacun 2 axes de 3 reprises (6
              cellules) ; le Lot 3 regroupe 9 cellules (n°13 à n°21) sans découpage en axes, partageant une seule reprise de
              chargement. Chaque cellule ne peut contenir qu'une seule qualité de phosphate (K00 à K20) à la fois.
            </p>
          </div>
          <button
            type="button"
            onClick={onViewGlobal}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed]"
          >
            <Eye size={16} aria-hidden="true" />
            Voir sur le schéma global
          </button>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Lots de stockage</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {LOTS.map((lot) => {
            const isSelected = lot.id === selectedLotId;
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => setSelectedLotId(lot.id)}
                className={`flex flex-col rounded-lg border p-5 text-left shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 ${
                  isSelected ? "border-[#0d6b4d] bg-[#0d6b4d] text-white" : "border-[#dfe6d7] bg-white/90 text-[#102b20] hover:border-[#0d6b4d]/40"
                }`}
              >
                <span className="flex items-center gap-2 font-display text-lg font-medium">
                  <Layers size={17} aria-hidden="true" />
                  {lot.name}
                </span>
                <span className={`mt-2 text-sm leading-6 ${isSelected ? "text-white/85" : "text-[#6c7c71]"}`}>{lot.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#dfe6d7] bg-white/85 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">
          Axes et cellules — {selectedLot.name}
        </p>

        {axes.length === 0 ? (
          lotEquipments.filter((equipment) => equipment.family === "Reprise" && equipment.type === "Silo de stockage").length > 0 ? (
            <div className="mt-3 rounded-md border border-[#dfe6d7] bg-white p-4">
              <p className="text-sm font-black text-[#102b20]">{selectedLot.name} — zone globale</p>
              <p className="mt-0.5 text-xs font-semibold text-[#6c7c71]">
                Aucun axe : les 9 cellules (n°13 à n°21) partagent une seule reprise de chargement.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {lotEquipments
                  .filter((equipment) => equipment.family === "Reprise" && equipment.type === "Silo de stockage")
                  .map((cellule) => {
                    const status = STATUS_META[cellule.status] ?? STATUS_META["Non renseigné"];
                    return (
                      <div key={cellule.code} className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] p-2.5 text-center">
                        <p className="text-xs font-black text-[#102b20]">{cellule.code}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#0d6b4d]">
                          {cellule.qualite ?? "Qualité non renseignée"}
                        </p>
                        <span
                          className="mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-black"
                          style={{ color: status.text, backgroundColor: status.bg, borderColor: status.border }}
                        >
                          {cellule.status}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#6c7c71]">
              {selectedLot.name} est représenté comme une zone de stockage globale : les axes et cellules détaillés n'y sont pas encore
              modélisés.
            </p>
          )
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {axes.map((axe) => {
              const cellules = getCellulesByAxe(axe.id);
              return (
                <div key={axe.id} className="rounded-md border border-[#dfe6d7] bg-white p-4">
                  <p className="text-sm font-black text-[#102b20]">{axe.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#6c7c71]">{cellules.length} cellules de reprise</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {cellules.map((cellule) => {
                      const status = STATUS_META[cellule.status] ?? STATUS_META["Non renseigné"];
                      return (
                        <div key={cellule.code} className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] p-2.5 text-center">
                          <p className="text-xs font-black text-[#102b20]">{cellule.code}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#0d6b4d]">
                            {cellule.qualite ?? "Qualité non renseignée"}
                          </p>
                          <span
                            className="mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-black"
                            style={{ color: status.text, backgroundColor: status.bg, borderColor: status.border }}
                          >
                            {cellule.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EquipmentTable equipments={lotEquipments} selectedCode={null} onSelectCode={() => undefined} />
    </div>
  );
}
