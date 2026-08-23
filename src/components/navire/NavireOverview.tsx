import { useMemo } from "react";
import { AlertOctagon, Anchor, PackageCheck, Ship, Weight } from "lucide-react";
import type { ArretNavire, ChargementPortique, Navire } from "./navireData";
import { calculateRAF, getNaviresEnCours } from "./navireRules";
import { getCurrentOperationalDay, getOperationalDay } from "../train/trainRules";

const kpiCardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 p-4";
const kpiLabelClass = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]";
const kpiValueClass = "font-display mt-2 text-2xl font-medium text-[#102b20]";

/** Onglet "Vue d'ensemble" de Gestion des navires — les chiffres clés de l'activité en cours (navires
 * en chargement, tonnage chargé aujourd'hui, RAF total, arrêts actifs), plus les navires par poste et
 * les derniers arrêts, sans avoir à naviguer entre Navires/Chargement/Arrêts/Historique. */
export default function NavireOverview({
  navires,
  chargements,
  arrets
}: {
  navires: Navire[];
  chargements: ChargementPortique[];
  arrets: ArretNavire[];
}) {
  const today = useMemo(() => getCurrentOperationalDay(), []);
  const enCours = getNaviresEnCours(navires);
  const enChargement = navires.filter((n) => n.statut === "En chargement");
  const tonnageAujourdhui = chargements
    .filter((c) => getOperationalDay(c.dateDebutAffect, c.heureDebutAffect || "12:00") === today)
    .reduce((sum, c) => sum + c.tonnage, 0);
  const rafTotal = enCours.reduce((sum, n) => sum + calculateRAF(n.tonnagePrevu, n.tonnageCharge), 0);
  const arretsActifs = arrets.filter((a) => !a.heureFin);

  const parPoste = enCours
    .filter((n) => n.poste)
    .sort((a, b) => a.poste.localeCompare(b.poste));

  const derniersArrets = [...arrets].sort((a, b) => `${b.dateDebut}${b.heureDebut}`.localeCompare(`${a.dateDebut}${a.heureDebut}`)).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-bold text-[#0d6b4d]">Journée d'exploitation en cours : {today} (7h00 → 7h00 le lendemain)</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <Ship size={13} aria-hidden="true" />
            En chargement
          </p>
          <p className={kpiValueClass}>{enChargement.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <Anchor size={13} aria-hidden="true" />
            En rade / accostés
          </p>
          <p className={kpiValueClass}>{enCours.length - enChargement.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <Weight size={13} aria-hidden="true" />
            Tonnage chargé aujourd'hui
          </p>
          <p className={kpiValueClass}>{tonnageAujourdhui.toLocaleString("fr-FR")} t</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <PackageCheck size={13} aria-hidden="true" />
            RAF total (navires en cours)
          </p>
          <p className={kpiValueClass}>{rafTotal.toLocaleString("fr-FR")} t</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <AlertOctagon size={13} aria-hidden="true" />
            Arrêts actifs
          </p>
          <p className={`${kpiValueClass} ${arretsActifs.length > 0 ? "text-[#a5460f]" : ""}`}>{arretsActifs.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Ship size={13} aria-hidden="true" />
            Navires par poste
          </p>
          {parPoste.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun navire en rade ou en chargement actuellement.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {parPoste.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    {n.nom} <span className="font-semibold text-[#6c7c71]">· Poste {n.poste}</span>
                  </span>
                  <span className="font-bold text-[#a5460f]">RAF {calculateRAF(n.tonnagePrevu, n.tonnageCharge).toLocaleString("fr-FR")} t</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <AlertOctagon size={13} aria-hidden="true" />
            Derniers arrêts
          </p>
          {derniersArrets.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun arrêt enregistré.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {derniersArrets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    {a.portique} <span className="font-semibold text-[#6c7c71]">· {a.nature}</span>
                  </span>
                  <span className={`font-bold ${a.heureFin ? "text-[#314238]" : "text-[#a5460f]"}`}>{a.heureFin ? "Terminé" : "En cours"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
