import { AlertOctagon, History, LayoutDashboard, PackageOpen, Ship } from "lucide-react";

export type NavireSection = "vue" | "navires" | "chargement" | "arrets" | "historique";

const SECTIONS: { key: NavireSection; label: string; Icon: typeof Ship }[] = [
  { key: "vue", label: "Vue d'ensemble", Icon: LayoutDashboard },
  { key: "navires", label: "Navires", Icon: Ship },
  { key: "chargement", label: "Chargement portiques", Icon: PackageOpen },
  { key: "arrets", label: "Arrêts", Icon: AlertOctagon },
  { key: "historique", label: "Historique", Icon: History }
];

export default function NavireNavigation({
  active,
  onChange
}: {
  active: NavireSection;
  onChange: (section: NavireSection) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-1.5">
      {SECTIONS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              isActive ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f3f8ef]"
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
