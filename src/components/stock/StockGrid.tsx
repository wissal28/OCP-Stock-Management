import { PHOSPHATE_QUALITIES, type CelluleStock, type ZoneStock } from "./stockData";
import { calculateTaux, isCelluleLibre, isMortCritique, totalCelluleMortVif, totalZoneMortVif } from "./stockRules";
import EditableCell from "../train/EditableCell";

const QUALITE_OPTIONS = PHOSPHATE_QUALITIES.map((q) => ({ value: q.code, label: q.code }));

const cellBase = "border border-[#eef1ea] px-2 py-2 text-center";

function noop() {}

export default function StockGrid({
  cellules,
  zones,
  editable = false,
  onCelluleChange,
  onZoneChange
}: {
  cellules: CelluleStock[];
  zones: ZoneStock[];
  editable?: boolean;
  onCelluleChange?: (celluleId: string, patch: Partial<CelluleStock>) => void;
  onZoneChange?: (zoneId: string, patch: Partial<ZoneStock>) => void;
}) {
  const lot1 = cellules.slice(0, 6);
  const lot2 = cellules.slice(6, 12);

  return (
    <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
      <table className="w-full min-w-[1100px] border-collapse text-xs">
        <thead>
          <tr className="bg-[#f3f8ef] text-[10px] font-black uppercase tracking-[0.05em] text-[#5e7166]">
            <th className={cellBase}></th>
            <th className={cellBase} colSpan={6}>
              1er Lot
            </th>
            <th className={cellBase} colSpan={6}>
              2ème Lot
            </th>
            <th className={cellBase} colSpan={2}>
              3ème Lot
            </th>
          </tr>
          <tr className="bg-[#f3f8ef] text-[10px] font-black uppercase tracking-[0.05em] text-[#5e7166]">
            <th className={cellBase}>Cellule</th>
            {lot1.map((_, i) => (
              <th key={`l1-${i}`} className={cellBase}>
                {i + 1}
              </th>
            ))}
            {lot2.map((_, i) => (
              <th key={`l2-${i}`} className={cellBase}>
                {i + 7}
              </th>
            ))}
            {zones.map((z) => (
              <th key={z.id} className={cellBase}>
                {z.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>Qualité</td>
            {cellules.map((c) => {
              const libre = isCelluleLibre(c.tonnageVif);
              return (
                <td key={c.celluleId} className={cellBase}>
                  <div className="flex flex-col items-center gap-1">
                    {libre && (
                      <span
                        className="rounded-full border border-[#bfdcef] bg-[#e7f2fa] px-1.5 py-0.5 text-[9px] font-black text-[#1d6fa5]"
                        title="Cellule libre — stock vif nul, accepte n'importe quelle nouvelle qualité"
                      >
                        Libre
                      </span>
                    )}
                    {editable ? (
                      <EditableCell
                        value={c.qualite}
                        type="select"
                        options={QUALITE_OPTIONS}
                        onCommit={(v) => onCelluleChange?.(c.celluleId, { qualite: v })}
                        onNavigate={noop}
                      />
                    ) : (
                      <span className="font-bold text-[#0d6b4d]">{c.qualite || "—"}</span>
                    )}
                  </div>
                </td>
              );
            })}
            {zones.map((z) => (
              <td key={z.id} className={cellBase}>
                {editable ? (
                  <EditableCell
                    value={z.qualite}
                    type="select"
                    options={QUALITE_OPTIONS}
                    onCommit={(v) => onZoneChange?.(z.id, { qualite: v })}
                    onNavigate={noop}
                  />
                ) : (
                  <span className="font-bold text-[#0d6b4d]">{z.qualite || "—"}</span>
                )}
              </td>
            ))}
          </tr>

          <tr>
            <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>Tonnage vif</td>
            {cellules.map((c) => (
              <td key={c.celluleId} className={cellBase}>
                {editable ? (
                  <EditableCell
                    value={String(c.tonnageVif)}
                    type="number"
                    onCommit={(v) => onCelluleChange?.(c.celluleId, { tonnageVif: Number(v) || 0 })}
                    onNavigate={noop}
                  />
                ) : (
                  <span className="font-semibold text-[#314238]">{c.tonnageVif.toLocaleString("fr-FR")}</span>
                )}
              </td>
            ))}
            {zones.map((z) => (
              <td key={z.id} className={cellBase}>
                {editable ? (
                  <EditableCell
                    value={String(z.tonnageVif)}
                    type="number"
                    onCommit={(v) => onZoneChange?.(z.id, { tonnageVif: Number(v) || 0 })}
                    onNavigate={noop}
                  />
                ) : (
                  <span className="font-semibold text-[#314238]">{z.tonnageVif.toLocaleString("fr-FR")}</span>
                )}
              </td>
            ))}
          </tr>

          {cellules.some((c) => c.tonnageVifAuto !== undefined) && (
            <tr>
              <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>
                Vif calculé
                <span className="ml-1 font-semibold normal-case text-[#829187]">(+ écart manuel)</span>
              </td>
              {cellules.map((c) => (
                <td key={c.celluleId} className={cellBase}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-semibold text-[#829187]">{(c.tonnageVifAuto ?? c.tonnageVif).toLocaleString("fr-FR")}</span>
                    {editable && (
                      <EditableCell
                        value={String(c.ecartManuel ?? 0)}
                        type="number"
                        onCommit={(v) => {
                          const ecartManuel = Number(v) || 0;
                          onCelluleChange?.(c.celluleId, { ecartManuel, tonnageVif: Math.max(0, (c.tonnageVifAuto ?? c.tonnageVif) + ecartManuel) });
                        }}
                        onNavigate={noop}
                      />
                    )}
                  </div>
                </td>
              ))}
              {zones.map((z) => (
                <td key={z.id} className={`${cellBase} text-[#829187]`}>
                  —
                </td>
              ))}
            </tr>
          )}

          <tr>
            <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>
              Tonnage mort
              <span className="ml-1 font-semibold normal-case text-[#829187]">(≥ 60% capacité = à déboucher)</span>
            </td>
            {cellules.map((c) => {
              const mortCritique = isMortCritique(c.tonnageMort, c.capaciteTotale);
              return (
                <td key={c.celluleId} className={`${cellBase} ${mortCritique ? "bg-[#fbe9e9] font-black text-[#9a2f2f]" : "text-[#829187]"}`}>
                  {c.tonnageMort.toLocaleString("fr-FR")}
                  {mortCritique && " ⚠"}
                </td>
              );
            })}
            {zones.map((z) => (
              <td key={z.id} className={`${cellBase} text-[#829187]`}>
                {z.tonnageMort.toLocaleString("fr-FR")}
              </td>
            ))}
          </tr>

          <tr>
            <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>Mort+Vif</td>
            {cellules.map((c) => (
              <td key={c.celluleId} className={`${cellBase} font-bold text-[#102b20]`}>
                {totalCelluleMortVif(c).toLocaleString("fr-FR")}
              </td>
            ))}
            {zones.map((z) => (
              <td key={z.id} className={`${cellBase} font-bold text-[#102b20]`}>
                {totalZoneMortVif(z).toLocaleString("fr-FR")}
              </td>
            ))}
          </tr>

          <tr>
            <td className={`${cellBase} bg-[#f6f9f2] text-left font-black text-[#5e7166]`}>Taux remplissage</td>
            {cellules.map((c) => {
              const taux = calculateTaux(c.tonnageVif, c.tonnageMort, c.capaciteTotale);
              return (
                <td key={c.celluleId} className={`${cellBase} font-black ${taux >= 90 ? "text-[#a5460f]" : "text-[#0d6b4d]"}`}>
                  {taux}%
                </td>
              );
            })}
            {zones.map((z) => (
              <td key={z.id} className={`${cellBase} text-[#829187]`}>
                —
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
