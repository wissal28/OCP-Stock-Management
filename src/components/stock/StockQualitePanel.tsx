import { useEffect, useState } from "react";
import { Gauge, Package, Ship, TrainFront } from "lucide-react";
import type { Train } from "../train/trainData";
import type { Navire } from "../navire/navireData";
import type { StockSnapshot } from "./stockData";
import { computeStockParQualite, computeTotalStock, getDernierTrainComptabilise, getNaviresParPoste, readNaviresFromApi, readTrainsFromApi } from "./stockRules";

export default function StockQualitePanel({ snapshot }: { snapshot: StockSnapshot }) {
  const [trains, setTrains] = useState<Train[]>([]);
  const [navires, setNavires] = useState<Navire[]>([]);

  useEffect(() => {
    readTrainsFromApi().then(setTrains);
    readNaviresFromApi().then(setNavires);
  }, []);

  const parQualite = computeStockParQualite(snapshot);
  const total = computeTotalStock(snapshot);
  const dernierTrain = getDernierTrainComptabilise(trains);
  const postes = getNaviresParPoste(navires);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <Gauge size={13} aria-hidden="true" />
          Total stock vif à 7h00
        </p>
        <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{total.toLocaleString("fr-FR")} t</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {parQualite.length === 0 ? (
            <span className="col-span-2 font-semibold text-[#6c7c71]">Aucun stock enregistré.</span>
          ) : (
            parQualite.map((q) => (
              <span key={q.qualite} className="flex items-center justify-between font-bold text-[#314238]">
                <span className="text-[#0d6b4d]">{q.qualite}</span>
                {q.tonnageVif.toLocaleString("fr-FR")} t
              </span>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <Ship size={13} aria-hidden="true" />
          Poste / Navire en chargement
        </p>
        {postes.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-[#6c7c71]">Aucun navire en chargement ou en rade.</p>
        ) : (
          <ul className="mt-2 grid gap-2 text-xs">
            {postes.map(({ poste, navire, raf }) => (
              <li key={navire.id} className="rounded-md border border-[#cfe3d8] bg-[#e8f4ed] p-2.5">
                <p className="font-black text-[#102b20]">
                  {poste} · {navire.nom}
                </p>
                <p className="mt-1 font-semibold text-[#314238]">
                  RAF à 7h00 : {raf.toLocaleString("fr-FR")} t · {navire.tonnagePrevu.toLocaleString("fr-FR")} t {navire.qualite}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <TrainFront size={13} aria-hidden="true" />
          Dernier train comptabilisé
        </p>
        <p className="mt-2 text-sm font-black text-[#102b20]">
          {dernierTrain ? `${dernierTrain.numeroTrain} · ${dernierTrain.qualite}` : "—"}
        </p>
      </div>

      <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <Package size={13} aria-hidden="true" />
          État des silos (T10)
        </p>
        <p className="mt-2 text-sm font-black text-[#102b20]">{snapshot.etatSilos.toLocaleString("fr-FR")} t</p>
        {snapshot.posteNotes && <p className="mt-2 text-xs font-semibold text-[#a5460f]">{snapshot.posteNotes}</p>}
      </div>
    </div>
  );
}
