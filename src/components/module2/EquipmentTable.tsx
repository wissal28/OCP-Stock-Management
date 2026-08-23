import { FAMILY_META, getCircuitById, type Equipment } from "./synoptiqueManutentionData";

export default function EquipmentTable({
  equipments,
  selectedCode,
  onSelectCode
}: {
  equipments: Equipment[];
  selectedCode: string | null;
  onSelectCode: (code: string) => void;
}) {
  return (
    <section className="rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[#dfe6d7] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Liste des équipements</p>
        <span className="text-xs font-bold text-[#5e7166]">
          {equipments.length} équipement{equipments.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] text-xs font-bold uppercase tracking-wide text-[#6c7c71]">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Famille</th>
              <th className="px-5 py-3">Zone</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Trajet</th>
              <th className="px-5 py-3">Qualité</th>
              <th className="px-5 py-3">Circuit associé</th>
              <th className="px-5 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm font-semibold text-[#6c7c71]">
                  Aucun équipement pour ce filtre.
                </td>
              </tr>
            ) : (
              equipments.map((equipment) => {
                const meta = FAMILY_META[equipment.family];
                const isSelected = selectedCode === equipment.code;
                return (
                  <tr
                    key={equipment.code}
                    onClick={() => onSelectCode(equipment.code)}
                    className={`cursor-pointer border-b border-[#eef1ec] transition-colors duration-150 last:border-0 hover:bg-[#f6f7ef] ${
                      isSelected ? "bg-[#e8f4ed]" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-black text-[#102b20]">{equipment.label}</td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em]"
                        style={{ color: meta.text, backgroundColor: meta.bg, borderColor: meta.border }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#314238]">{equipment.zone}</td>
                    <td className="px-5 py-3 font-semibold text-[#314238]">{equipment.type}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-[#0d6b4d]">{equipment.trajet}</td>
                    <td className="px-5 py-3">
                      {equipment.qualite ? (
                        <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2 py-0.5 text-[10px] font-black text-[#0d6b4d]">
                          {equipment.qualite}
                        </span>
                      ) : (
                        <span className="text-xs text-[#a9b1aa]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#314238]">{getCircuitById(equipment.circuitId)?.name}</td>
                    <td className="px-5 py-3 text-xs leading-5 text-[#6c7c71]">{equipment.description}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
