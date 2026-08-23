import type { ChargementPortique, Navire, NavireStatus } from "./navireData";
import { aggregateTonnageByPortique, calculateRAF } from "./navireRules";

const STATUS_META: Record<NavireStatus, { text: string; bg: string; border: string }> = {
  "En rade": { text: "#5e7166", bg: "#f2f4f0", border: "#dfe6d7" },
  "Accosté": { text: "#1d6fa5", bg: "#e7f2fa", border: "#bfdcef" },
  "En chargement": { text: "#0d6b4d", bg: "#e8f4ed", border: "#cfe3d8" },
  "Chargé": { text: "#237343", bg: "#eef8f1", border: "#b9ddc9" },
  "Parti": { text: "#6c7c71", bg: "#f2f4f0", border: "#dfe6d7" }
};

export default function NavireTable({
  navires,
  onSelect,
  selectedId,
  chargements
}: {
  navires: Navire[];
  onSelect: (navire: Navire) => void;
  selectedId?: string | null;
  /** Fourni uniquement par l'Historique de navire — ajoute une colonne "Répartition portiques"
   * (tonnage transféré par portique CA30/CB30/CC30/CD30) directement dans la liste, sans avoir à
   * ouvrir la fiche de chaque navire. Omis dans Gestion de navires pour ne pas alourdir la liste
   * courante. */
  chargements?: ChargementPortique[];
}) {
  if (navires.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#b8c6bc] bg-white/70 p-10 text-center text-sm font-bold text-[#6c7c71]">
        Aucun navire ne correspond aux filtres sélectionnés.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
            <th className="px-4 py-3">Navire</th>
            <th className="px-4 py-3">Poste</th>
            <th className="px-4 py-3">Début chargement</th>
            <th className="px-4 py-3">Fin chargement</th>
            <th className="px-4 py-3">Qualité</th>
            <th className="px-4 py-3">T. prévu</th>
            <th className="px-4 py-3">T. chargé</th>
            <th className="px-4 py-3">RAF</th>
            <th className="px-4 py-3">Statut</th>
            {chargements && <th className="px-4 py-3">Répartition portiques</th>}
          </tr>
        </thead>
        <tbody>
          {navires.map((navire) => {
            const raf = calculateRAF(navire.tonnagePrevu, navire.tonnageCharge);
            const statusMeta = STATUS_META[navire.statut];
            const parPortique = chargements ? aggregateTonnageByPortique(chargements.filter((c) => c.navireId === navire.id)) : null;
            return (
              <tr
                key={navire.id}
                onClick={() => onSelect(navire)}
                className={`cursor-pointer border-b border-[#eef1ea] transition last:border-0 hover:bg-[#f6f9f2] ${
                  selectedId === navire.id ? "bg-[#e8f4ed]" : ""
                }`}
              >
                <td className="px-4 py-3 font-black text-[#102b20]">{navire.nom}</td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{navire.poste || "—"}</td>
                <td className="px-4 py-3 font-semibold text-[#314238]">
                  {navire.dateDebutChargement} · {navire.heureDebutChargement}
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">
                  {navire.dateFinChargement ? `${navire.dateFinChargement} · ${navire.heureFinChargement}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2 py-0.5 text-xs font-black text-[#0d6b4d]">
                    {navire.qualite}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{navire.tonnagePrevu.toLocaleString("fr-FR")} t</td>
                <td className="px-4 py-3 font-semibold text-[#314238]">{navire.tonnageCharge.toLocaleString("fr-FR")} t</td>
                <td className={`px-4 py-3 font-black ${raf === 0 ? "text-[#237343]" : "text-[#a5460f]"}`}>{raf.toLocaleString("fr-FR")} t</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-[11px] font-black"
                    style={{ color: statusMeta.text, backgroundColor: statusMeta.bg, borderColor: statusMeta.border }}
                  >
                    {navire.statut}
                  </span>
                </td>
                {chargements && (
                  <td className="px-4 py-3">
                    {parPortique && parPortique.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {parPortique.map((p) => (
                          <span
                            key={p.portique}
                            className="whitespace-nowrap rounded-full border border-[#dfe6d7] bg-[#f6f9f2] px-2 py-0.5 text-[10px] font-bold text-[#314238]"
                          >
                            {p.portique} : {p.tonnage.toLocaleString("fr-FR")} t
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#a9b1aa]">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
