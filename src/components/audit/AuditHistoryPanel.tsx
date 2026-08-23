import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { listAuditEntries, type AuditEntry } from "../../api";

const ACTION_LABELS: Record<string, string> = { create: "Création", update: "Modification", delete: "Suppression" };

function summarizeDiff(diff: Record<string, unknown>): string {
  const keys = Object.keys(diff).filter((k) => !["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k));
  if (keys.length === 0) return "";
  return keys.slice(0, 4).join(", ") + (keys.length > 4 ? "…" : "");
}

/** Historique réel des modifications d'une entité (train, navire, dechargement...) — remplace le
 * placeholder statique "Statut mis à jour" par les vraies entrées audit_log déjà enregistrées côté
 * serveur à chaque écriture, jusque-là jamais affichées nulle part dans l'UI. */
export default function AuditHistoryPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    listAuditEntries(entityType, entityId).then(setEntries).catch(() => {});
  }, [entityType, entityId]);

  return (
    <div className="mt-5 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
        <Info size={13} aria-hidden="true" />
        Historique des modifications {entries.length > 0 && `(${entries.length})`}
      </p>
      {entries.length === 0 ? (
        <p className="mt-1 text-xs font-semibold text-[#6c7c71]">Aucune modification enregistrée.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5 text-xs">
          {entries.slice(0, 6).map((entry) => {
            const summary = summarizeDiff(entry.diff);
            return (
              <li key={entry.id} className="flex flex-col gap-0.5 border-b border-dashed border-[#e3e9de] pb-1.5 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-[#102b20]">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                  <span className="font-semibold text-[#6c7c71]">
                    {entry.matricule || "—"} · {new Date(entry.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                {summary && <span className="text-[#829187]">{summary}</span>}
              </li>
            );
          })}
          {entries.length > 6 && <li className="text-[#829187]">+ {entries.length - 6} autre(s)</li>}
        </ul>
      )}
    </div>
  );
}
