import { ArrowDownToLine, Box, Gauge, LayoutDashboard, Layers, Network, Ship, Sparkles, Table2, Workflow } from "lucide-react";

export type ModuleSection =
  | "global"
  | "dechargement"
  | "lots"
  | "silos"
  | "peseuses"
  | "convoyeurs"
  | "chargement"
  | "equipements"
  | "avenir";

export const SECTIONS: { key: ModuleSection; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: "global", label: "Vue globale", Icon: Network },
  { key: "dechargement", label: "Moyens de déchargement", Icon: ArrowDownToLine },
  { key: "lots", label: "Lots et stockage", Icon: Layers },
  { key: "silos", label: "Silos", Icon: Box },
  { key: "peseuses", label: "Peseuses", Icon: Gauge },
  { key: "convoyeurs", label: "Convoyeurs et circuits", Icon: Workflow },
  { key: "chargement", label: "Chargement navire", Icon: Ship },
  { key: "equipements", label: "Équipements", Icon: Table2 },
  { key: "avenir", label: "À venir", Icon: Sparkles }
];

export default function Module2Navigation({
  activeSection,
  onSelectSection
}: {
  activeSection: ModuleSection;
  onSelectSection: (section: ModuleSection) => void;
}) {
  return (
    <nav
      className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1"
      aria-label="Navigation interne du synoptique de manutention"
    >
      {SECTIONS.map(({ key, label, Icon }) => {
        const isActive = activeSection === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectSection(key)}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2.5 text-xs font-bold transition-colors duration-200 ${
              isActive
                ? "border-[#0d6b4d] bg-[#0d6b4d] text-white shadow-[0_10px_24px_rgba(13,107,77,0.22)]"
                : "border-[#dfe6d7] bg-white text-[#5e7166] hover:border-[#0d6b4d]/40 hover:text-[#0d6b4d]"
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
