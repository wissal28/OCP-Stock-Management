import { AlertTriangle } from "lucide-react";
import type { Train, TrainStatus } from "./trainData";
import { calculateEcart } from "./trainRules";

const STATUS_META: Record<TrainStatus, { text: string; bg: string; border: string }> = {
  "Prévu": { text: "#5e7166", bg: "#f2f4f0", border: "#dfe6d7" },
  "Arrivé": { text: "#0d6b4d", bg: "#e8f4ed", border: "#cfe3d8" },
  "En déchargement": { text: "#1d6fa5", bg: "#e7f2fa", border: "#bfdcef" },
  "Déchargé": { text: "#237343", bg: "#eef8f1", border: "#b9ddc9" },
  "En retard": { text: "#a5460f", bg: "#fdece0", border: "#f3c9a8" },
  "Annulé": { text: "#9a2f2f", bg: "#fbe9e9", border: "#f0c2c2" }
};

function isEnRetard(train: Train): boolean {
  if (!train.heureArriveeReelle) return false;
  return train.heureArriveeReelle > train.heureArriveePrevue;
}

export default function TrainTable({
  trains,
  onSelect,
  selectedId
}: {
  trains: Train[];
  onSelect: (train: Train) => void;
  selectedId?: string | null;
}) {
  if (trains.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#b8c6bc] bg-white/70 p-10 text-center text-sm font-bold text-[#6c7c71]">
        Aucun train ne correspond aux filtres sélectionnés.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
            <th className="px-4 py-3">N° train</th>
            <th className="px-4 py-3">Arrivée prévue</th>
            <th className="px-4 py-3">Arrivée réelle</th>
            <th className="px-4 py-3">Wagons</th>
            <th className="px-4 py-3">Qualité</th>
            <th className="px-4 py-3">T. expédié</th>
            <th className="px-4 py-3">T. bascule</th>
            <th className="px-4 py-3">Écart</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {trains.map((train) => {
            const ecart = calculateEcart(train.tonnageExpedie, train.tonnageBascule);
            const statusMeta = STATUS_META[train.statut];
            const retard = isEnRetard(train);
            return (
              <tr
                key={train.id}
                onClick={() => onSelect(train)}
                className={`cursor-pointer border-b border-[#eef1ea] transition last:border-0 hover:bg-[#f6f9f2] ${
                  selectedId === train.id ? "bg-[#e8f4ed]" : ""
                }`}
              >
                <td className="px-4 py-3 font-black text-[#102b20]">{train.numeroTrain}</td>
                <td className="px-4 py-3 font-semibold text-[#314238]">
                  {train.dateArriveePrevue} · {train.heureArriveePrevue}
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">
                  <span className="inline-flex items-center gap-1.5">
                    {train.heureArriveeReelle || "—"}
                    {retard && <AlertTriangle size={13} className="text-[#a5460f]" aria-hidden="true" />}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{train.nombreWagons}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2 py-0.5 text-xs font-black text-[#0d6b4d]">
                    {train.qualite}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{train.tonnageExpedie.toLocaleString("fr-FR")} t</td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{train.tonnageBascule.toLocaleString("fr-FR")} t</td>
                <td className={`px-4 py-3 font-black ${ecart === 0 ? "text-[#5e7166]" : ecart > 0 ? "text-[#237343]" : "text-[#a5460f]"}`}>
                  {ecart > 0 ? "+" : ""}
                  {ecart.toLocaleString("fr-FR")} t
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{train.destinationPrevue}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-[11px] font-black"
                    style={{ color: statusMeta.text, backgroundColor: statusMeta.bg, borderColor: statusMeta.border }}
                  >
                    {train.statut}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
