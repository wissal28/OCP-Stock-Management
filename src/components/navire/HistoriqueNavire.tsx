import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { PHOSPHATE_QUALITIES, type ArretNavire, type ChargementPortique, type Navire, type NavireStatus } from "./navireData";
import NavireTable from "./NavireTable";
import NavireDetailsPanel from "./NavireDetailsPanel";

const selectClass =
  "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]";

const PAST_STATUTS: NavireStatus[] = ["Chargé", "Parti"];

/** Navires dont le chargement est terminé — l'historique ne montre pas les escales en cours,
 * celles-ci restent dans l'onglet "Navires". */
function isPastVoyage(navire: Navire): boolean {
  return navire.statut === "Chargé" || navire.statut === "Parti";
}

/** Onglet "Historique" de Gestion des navires — reçoit navires/chargements/arrêts du parent (état
 * partagé avec les autres onglets) au lieu de les refetcher, pour rester synchronisé sans latence. */
export default function HistoriqueNavire({
  navires,
  chargements,
  arrets,
  onUpdateNavire,
  onDeleteNavire
}: {
  navires: Navire[];
  chargements: ChargementPortique[];
  arrets: ArretNavire[];
  onUpdateNavire: (id: string, patch: Partial<Navire>) => void;
  onDeleteNavire: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [qualiteFilter, setQualiteFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pastVoyages = useMemo(
    () =>
      navires
        .filter(isPastVoyage)
        .filter((n) => !qualiteFilter || n.qualite === qualiteFilter)
        .filter((n) => !statutFilter || n.statut === statutFilter)
        .filter((n) => !dateFrom || n.dateDebutChargement >= dateFrom)
        .filter((n) => !dateTo || n.dateDebutChargement <= dateTo)
        .filter((n) => !query.trim() || n.nom.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => `${b.dateDebutChargement}${b.heureDebutChargement}`.localeCompare(`${a.dateDebutChargement}${a.heureDebutChargement}`)),
    [navires, qualiteFilter, statutFilter, dateFrom, dateTo, query]
  );

  const totalTonnage = pastVoyages.reduce((sum, n) => sum + n.tonnageCharge, 0);
  const selected = navires.find((n) => n.id === selectedId) ?? null;
  const hasFilters = query || qualiteFilter || statutFilter || dateFrom || dateTo;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#6c7c71]">
        Escales terminées — {pastVoyages.length} navire{pastVoyages.length > 1 ? "s" : ""}, {totalTonnage.toLocaleString("fr-FR")} t chargées au
        total.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-3">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.06em] text-[#5e7166]">
          <Filter size={13} aria-hidden="true" />
          Filtres
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un navire..."
          className={`${selectClass} w-48`}
        />
        <select value={qualiteFilter} onChange={(e) => setQualiteFilter(e.target.value)} className={selectClass}>
          <option value="">Toutes qualités</option>
          {PHOSPHATE_QUALITIES.map((q) => (
            <option key={q.code} value={q.code}>
              {q.code}
            </option>
          ))}
        </select>
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className={selectClass}>
          <option value="">Tous statuts</option>
          {PAST_STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#5e7166]">
          Du
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#5e7166]">
          Au
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setQualiteFilter("");
              setStatutFilter("");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs font-bold text-[#0d6b4d] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <NavireTable navires={pastVoyages} onSelect={(n) => setSelectedId(n.id)} selectedId={selected?.id} chargements={chargements} />

      <NavireDetailsPanel
        navire={selected}
        chargements={chargements}
        arrets={arrets}
        onClose={() => setSelectedId(null)}
        onUpdate={onUpdateNavire}
        onDelete={onDeleteNavire}
      />
    </div>
  );
}
