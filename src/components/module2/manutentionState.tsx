import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// État métier partagé entre l'onglet "Peseuses" et la "Vue globale" du schéma : la sélection de
// reprise active par peseuse (une seule par axe, une seule en Lot 3) et l'état ouvert/fermé des
// aiguillages SA200/SB300. Un seul état, pas une copie par vue, pour que cliquer une reprise sur le
// schéma se reflète dans l'onglet Peseuses et inversement.

export interface AiguillageBranches {
  branchA: boolean;
  branchB: boolean;
}

interface ManutentionStateValue {
  axisSelection: Record<string, string>;
  lot3Selection: Record<string, string>;
  selectReprise: (peseuseId: string, group: "axis" | "lot3", code: string) => void;
  aiguillages: Record<string, AiguillageBranches>;
  toggleAiguillageBranch: (aiguillageId: string, branch: "branchA" | "branchB") => void;
}

const ManutentionStateContext = createContext<ManutentionStateValue | null>(null);

// Par défaut, une seule branche ouverte (100% vers celle-ci) — correspond au fonctionnement normal
// tant que l'opérateur n'a pas volontairement ouvert les deux branches (auquel cas le débit est
// partagé 50/50, affiché tel quel sur le schéma).
const DEFAULT_AIGUILLAGES: Record<string, AiguillageBranches> = {
  SA200: { branchA: true, branchB: false },
  SB300: { branchA: true, branchB: false }
};

export function ManutentionStateProvider({ children }: { children: ReactNode }) {
  const [axisSelection, setAxisSelection] = useState<Record<string, string>>({});
  const [lot3Selection, setLot3Selection] = useState<Record<string, string>>({});
  const [aiguillages, setAiguillages] = useState<Record<string, AiguillageBranches>>(DEFAULT_AIGUILLAGES);

  const selectReprise = (peseuseId: string, group: "axis" | "lot3", code: string) => {
    if (group === "axis") setAxisSelection((prev) => ({ ...prev, [peseuseId]: code }));
    else setLot3Selection((prev) => ({ ...prev, [peseuseId]: code }));
  };

  const toggleAiguillageBranch = (aiguillageId: string, branch: "branchA" | "branchB") => {
    setAiguillages((prev) => {
      const current = prev[aiguillageId] ?? { branchA: true, branchB: false };
      const next: AiguillageBranches = { ...current, [branch]: !current[branch] };
      // Au moins une branche doit rester ouverte, sinon plus rien ne circule.
      if (!next.branchA && !next.branchB) return prev;
      return { ...prev, [aiguillageId]: next };
    });
  };

  const value = useMemo<ManutentionStateValue>(
    () => ({ axisSelection, lot3Selection, selectReprise, aiguillages, toggleAiguillageBranch }),
    [axisSelection, lot3Selection, aiguillages]
  );

  return <ManutentionStateContext.Provider value={value}>{children}</ManutentionStateContext.Provider>;
}

export function useManutentionState(): ManutentionStateValue {
  const ctx = useContext(ManutentionStateContext);
  if (!ctx) throw new Error("useManutentionState doit être utilisé sous ManutentionStateProvider");
  return ctx;
}
