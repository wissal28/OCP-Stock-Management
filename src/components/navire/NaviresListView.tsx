import { useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { PHOSPHATE_QUALITIES, type ArretNavire, type ChargementPortique, type Navire, type NavireStatus } from "./navireData";
import NavireForm from "./NavireForm";
import NavireTable from "./NavireTable";
import NavireDetailsPanel from "./NavireDetailsPanel";

const STATUTS: NavireStatus[] = ["En rade", "Accosté", "En chargement", "Chargé", "Parti"];

const selectClass =
  "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]";

export default function NaviresListView({
  navires,
  chargements,
  arrets,
  onCreate,
  onUpdate,
  onDelete,
  onImportCsv
}: {
  navires: Navire[];
  chargements: ChargementPortique[];
  arrets: ArretNavire[];
  onCreate: (navire: Navire) => void;
  onUpdate?: (id: string, patch: Partial<Navire>) => void;
  onDelete?: (id: string) => void;
  /** Relit database/navires.csv (édité à la main dans un tableur) et réconcilie avec la base. */
  onImportCsv?: () => Promise<{ created: number; updated: number; total: number }>;
}) {
  const [dateFilter, setDateFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [qualiteFilter, setQualiteFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const selected = navires.find((n) => n.id === selectedId) ?? null;

  async function handleImportCsv() {
    if (!onImportCsv) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await onImportCsv();
      setImportMessage(`${result.created} créé(s), ${result.updated} mis à jour depuis navires.csv.`);
    } catch {
      setImportMessage("Échec de l'import depuis navires.csv.");
    } finally {
      setImporting(false);
    }
  }

  const filtered = useMemo(() => {
    return navires.filter((navire) => {
      if (dateFilter && navire.dateDebutChargement !== dateFilter) return false;
      if (statutFilter && navire.statut !== statutFilter) return false;
      if (qualiteFilter && navire.qualite !== qualiteFilter) return false;
      return true;
    });
  }, [navires, dateFilter, statutFilter, qualiteFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Navires au chargement</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Suivi des escales et du chargement des navires de phosphate au port.</p>
        </div>
        <div className="flex items-center gap-2">
          {onImportCsv && (
            <button
              type="button"
              onClick={handleImportCsv}
              disabled={importing}
              title="Relit database/navires.csv (si modifié à la main) et enregistre les changements dans la base"
              className="flex h-10 items-center gap-1.5 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] transition hover:border-[#0d6b4d] hover:text-[#0d6b4d] disabled:opacity-60"
            >
              <RefreshCw size={14} className={importing ? "animate-spin" : ""} aria-hidden="true" />
              Importer depuis CSV
            </button>
          )}
          <NavireForm onCreate={onCreate} />
        </div>
      </div>
      {importMessage && <p className="text-xs font-semibold text-[#0d6b4d]">{importMessage}</p>}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-3">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.06em] text-[#5e7166]">
          <Filter size={13} aria-hidden="true" />
          Filtres
        </span>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectClass} />
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className={selectClass}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={qualiteFilter} onChange={(e) => setQualiteFilter(e.target.value)} className={selectClass}>
          <option value="">Toutes qualités</option>
          {PHOSPHATE_QUALITIES.map((q) => (
            <option key={q.code} value={q.code}>
              {q.code}
            </option>
          ))}
        </select>
        {(dateFilter || statutFilter || qualiteFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFilter("");
              setStatutFilter("");
              setQualiteFilter("");
            }}
            className="text-xs font-bold text-[#0d6b4d] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <NavireTable navires={filtered} onSelect={(n) => setSelectedId(n.id)} selectedId={selected?.id} />

      <NavireDetailsPanel navire={selected} chargements={chargements} arrets={arrets} onClose={() => setSelectedId(null)} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  );
}
