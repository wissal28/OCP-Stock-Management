import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Ban,
  ChevronDown,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X
} from "lucide-react";
import Aurora from "./Aurora";

export type UserStatus = "actif" | "inactif" | "bloque";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  matricule: string;
  filiale: string;
  fonction: string;
  departement: string;
  statut: UserStatus;
  role: string;
};

type FilterKey = "tous" | UserStatus;

type DashboardProps = {
  reduced: boolean;
  users: AdminUser[];
  onRoleChange: (userId: string, role: string) => void;
  onToggleBlock: (userId: string) => void;
};

const ROLE_OPTIONS = ["Administrateur", "Superviseur", "Gestionnaire stock", "Opérateur", "Lecture seule"];

const STATUS_META: Record<UserStatus, { label: string; badgeClass: string; dotClass: string }> = {
  actif: {
    label: "Actif",
    badgeClass: "border-[#b9ddc9] bg-[#eef8f1] text-[#237343]",
    dotClass: "bg-[#2f9e55]"
  },
  inactif: {
    label: "Inactif",
    badgeClass: "border-[#d8ddd6] bg-[#f5f6f3] text-[#66736b]",
    dotClass: "bg-[#98a29a]"
  },
  bloque: {
    label: "Bloqué",
    badgeClass: "border-[#efc3bd] bg-[#fff1ee] text-[#a13b2f]",
    dotClass: "bg-[#d64b3a]"
  }
};

const FILTERS: { key: FilterKey; label: string; Icon: typeof Users }[] = [
  { key: "tous", label: "Tous", Icon: Users },
  { key: "actif", label: "Actifs", Icon: UserCheck },
  { key: "inactif", label: "Inactifs", Icon: UserRound },
  { key: "bloque", label: "Bloqués", Icon: Ban }
];

const FILIALE_LOGOS: Record<string, { src: string; label: string }> = {
  OCP: { src: "/Logo-OCP_header.svg", label: "OCP" },
  "OCP Solution": { src: "/logo-ocp-solutions.png", label: "OCP Solution" },
  JESA: { src: "/Logo JESA.png", label: "JESA" }
};

export function Dashboard({ reduced, users, onRoleChange, onToggleBlock }: DashboardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("tous");

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = { tous: users.length, actif: 0, inactif: 0, bloque: 0 };
    for (const user of users) base[user.statut] += 1;
    return base;
  }, [users]);

  const visibleUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus = filter === "tous" || user.statut === filter;
      const matchesQuery =
        !search ||
        user.matricule.toLowerCase().includes(search) ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      return matchesStatus && matchesQuery;
    });
  }, [users, filter, query]);

  const metrics = [
    {
      code: "KPI-01",
      label: "Utilisateurs actifs",
      value: counts.actif.toString(),
      trend: "+3.1%",
      note: "vs semaine dernière",
      tone: "up" as const,
      progress: Math.round((counts.actif / Math.max(users.length, 1)) * 100)
    },
    {
      code: "KPI-02",
      label: "Comptes total",
      value: users.length.toString(),
      trend: "+12.4%",
      note: "base consolidée",
      tone: "up" as const,
      progress: 100
    },
    {
      code: "KPI-03",
      label: "Taux bloqué",
      value: `${Math.round((counts.bloque / Math.max(users.length, 1)) * 100)}%`,
      trend: "-0.4%",
      note: "à surveiller",
      tone: "down" as const,
      progress: Math.round((counts.bloque / Math.max(users.length, 1)) * 100)
    },
    {
      code: "KPI-04",
      label: "Administrateurs",
      value: users.filter((user) => user.role === "Administrateur").length.toString(),
      trend: "+8.7%",
      note: "couverture accès",
      tone: "up" as const,
      progress: Math.round((users.filter((user) => user.role === "Administrateur").length / Math.max(users.length, 1)) * 100)
    }
  ];

  const listVariants = {
    hidden: {},
    visible: { transition: reduced ? undefined : { staggerChildren: 0.03 } }
  };
  const rowVariants = {
    hidden: { opacity: 0, y: reduced ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.32, ease: "easeOut" as const } }
  };

  const resetFilters = () => {
    setQuery("");
    setFilter("tous");
  };

  return (
    <div className="grid gap-5">
      <section className="relative isolate overflow-hidden rounded-lg border border-[#dfe6d7] bg-white shadow-[0_14px_34px_rgba(16,43,32,0.05)]" aria-label="Indicateurs administrateur">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70" aria-hidden="true">
          <Aurora colorStops={["#22f500", "#ffffff", "#535355"]} blend={0.5} amplitude={1} speed={reduced ? 0 : 1} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 bg-white/60" aria-hidden="true" />
        <div className="relative z-10 border-b border-[#edf2e8] bg-white/50 px-5 py-3 backdrop-blur-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#829187]">Synthèse des accès</p>
        </div>
        <div className="relative z-10 grid divide-y divide-[#dfe6d7]/80 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {metrics.map(({ code, label, value, trend, note, tone, progress }) => (
            <article key={label} className="bg-white/35 px-5 py-4 backdrop-blur-[2px]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#829187]">{code}</p>
                <span className={`text-xs font-black ${tone === "up" ? "text-[#237343]" : "text-[#a13b2f]"}`}>{trend}</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#314238]">{label}</p>
                  <p className="mt-2 text-[2rem] font-black leading-none tracking-tight text-[#102b20]">{value}</p>
                </div>
                <p className="max-w-24 text-right text-xs font-semibold leading-5 text-[#6c7c71]">{note}</p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf2e8]">
                <span
                  className={`block h-full rounded-full ${tone === "up" ? "bg-[#0d6b4d]" : "bg-[#c95849]"}`}
                  style={{ width: `${Math.min(Math.max(progress, 4), 100)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#dfe6d7] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#102b20]">Utilisateurs de la plateforme</h2>
            <p className="mt-1 text-sm leading-6 text-[#6c7c71]">Attribuez les rôles, contrôlez les accès et suivez le statut de chaque compte.</p>
          </div>

          <div className="relative w-full lg:w-96" role="search">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Rechercher un utilisateur"
              className="h-11 w-full rounded-md border border-[#dfe6d7] bg-[#f8faf7] pl-11 pr-10 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:bg-white focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]"
              placeholder="Nom, email ou matricule"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#829187] transition hover:bg-[#edf2e8] hover:text-[#0d6b4d]"
                aria-label="Effacer la recherche"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#dfe6d7] px-5 py-4 sm:px-6">
          {FILTERS.map(({ key, label, Icon }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-bold transition ${
                  isActive
                    ? "border-[#0d6b4d] bg-[#e8f4ed] text-[#0d6b4d]"
                    : "border-[#dfe6d7] bg-white text-[#5e7166] hover:border-[#0d6b4d]/35 hover:bg-[#f8faf7] hover:text-[#102b20]"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
                <span className={`rounded-full px-1.5 text-xs font-extrabold ${isActive ? "bg-[#0d6b4d]/10 text-[#0d6b4d]" : "bg-[#edf2e8] text-[#6c7c71]"}`}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {visibleUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#dfe6d7] bg-[#f8faf7]">
              <Search size={20} className="text-[#829187]" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-black text-[#102b20]">Aucun utilisateur trouvé</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6c7c71]">
              {query ? `Aucun compte ne correspond à « ${query} ».` : "Aucun compte ne correspond à ce filtre pour le moment."}
            </p>
            <button type="button" onClick={resetFilters} className="mt-6 h-10 rounded-md border border-[#dfe6d7] px-4 text-sm font-bold text-[#314238] transition hover:bg-[#f8faf7]">
              Réinitialiser
            </button>
          </div>
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="w-full table-fixed text-left">
                <caption className="sr-only">Liste des utilisateurs de la plateforme OCP Stock</caption>
                <colgroup>
                  <col className="w-[21%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[17%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr>
                    {["Utilisateur", "Matricule", "Filiale", "Fonction", "Département", "Statut", "Rôle & accès"].map((head) => (
                      <th key={head} scope="col" className="px-4 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#829187]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <motion.tbody key={`${filter}-${query}`} initial="hidden" animate="visible" variants={listVariants}>
                  {visibleUsers.map((user) => (
                    <UserRow key={user.id} user={user} variants={rowVariants} onRoleChange={onRoleChange} onToggleBlock={onToggleBlock} />
                  ))}
                </motion.tbody>
              </table>
            </div>

            <motion.div key={`cards-${filter}-${query}`} initial="hidden" animate="visible" variants={listVariants} className="grid gap-3 p-4 xl:hidden">
              {visibleUsers.map((user) => (
                <UserCard key={user.id} user={user} variants={rowVariants} onRoleChange={onRoleChange} onToggleBlock={onToggleBlock} />
              ))}
            </motion.div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dfe6d7] px-5 py-4 text-xs font-semibold text-[#6c7c71] sm:px-6">
          <p>
            {visibleUsers.length} / {users.length} utilisateurs affichés
          </p>
          <p>Démo locale - aucune donnée n'est envoyée.</p>
        </div>
      </section>
    </div>
  );
}

function UserIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe6d7] bg-[#f8faf7] text-[#0d6b4d]">
      <UserRound size={18} aria-hidden="true" />
    </span>
  );
}

function StatusPill({ status }: { status: UserStatus }) {
  const meta = STATUS_META[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-bold ${meta.badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function UserRow({
  user,
  variants,
  onRoleChange,
  onToggleBlock
}: {
  user: AdminUser;
  variants: Variants;
  onRoleChange: (userId: string, role: string) => void;
  onToggleBlock: (userId: string) => void;
}) {
  const isBlocked = user.statut === "bloque";

  return (
    <motion.tr variants={variants} className="border-t border-[#edf2e8] transition-colors hover:bg-[#f8faf7]">
      <td className="px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserIcon />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#102b20]">{user.fullName}</span>
            <span className="block truncate text-xs font-semibold text-[#6c7c71]">{user.email}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm font-bold tracking-wide text-[#314238]">{user.matricule}</td>
      <td className="px-4 py-4">
        <FilialeLogo name={user.filiale} />
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-[#5e7166]">
        <span className="line-clamp-2">{user.fonction}</span>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-[#5e7166]">
        <span className="line-clamp-2">{user.departement}</span>
      </td>
      <td className="px-4 py-4">
        <StatusPill status={user.statut} />
      </td>
      <td className="px-4 py-4">
        <RoleControls user={user} isBlocked={isBlocked} onRoleChange={onRoleChange} onToggleBlock={onToggleBlock} />
      </td>
    </motion.tr>
  );
}

function UserCard({
  user,
  variants,
  onRoleChange,
  onToggleBlock
}: {
  user: AdminUser;
  variants: Variants;
  onRoleChange: (userId: string, role: string) => void;
  onToggleBlock: (userId: string) => void;
}) {
  const isBlocked = user.statut === "bloque";

  return (
    <motion.article variants={variants} className="rounded-lg border border-[#dfe6d7] bg-white p-4 shadow-[0_10px_26px_rgba(16,43,32,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserIcon />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#102b20]">{user.fullName}</span>
            <span className="block truncate text-xs font-semibold text-[#6c7c71]">{user.email}</span>
          </span>
        </div>
        <StatusPill status={user.statut} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#829187]">Matricule</dt>
          <dd className="mt-1 text-sm font-semibold text-[#314238]">{user.matricule}</dd>
        </div>
        <div>
          <dt className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#829187]">Filiale</dt>
          <dd className="mt-1">
            <FilialeLogo name={user.filiale} compact />
          </dd>
        </div>
        <div>
          <dt className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#829187]">Fonction</dt>
          <dd className="mt-1 text-sm font-semibold text-[#314238]">{user.fonction}</dd>
        </div>
        <div>
          <dt className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#829187]">Département</dt>
          <dd className="mt-1 text-sm font-semibold text-[#314238]">{user.departement}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <RoleControls user={user} isBlocked={isBlocked} onRoleChange={onRoleChange} onToggleBlock={onToggleBlock} fluid />
      </div>
    </motion.article>
  );
}

function RoleControls({
  user,
  isBlocked,
  fluid,
  onRoleChange,
  onToggleBlock
}: {
  user: AdminUser;
  isBlocked: boolean;
  fluid?: boolean;
  onRoleChange: (userId: string, role: string) => void;
  onToggleBlock: (userId: string) => void;
}) {
  return (
    <div className={`flex items-center gap-2 ${fluid ? "w-full" : ""}`}>
      <span className={`relative block ${fluid ? "flex-1" : "w-full"}`}>
        <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0d6b4d]" size={15} aria-hidden="true" />
        <select
          value={user.role}
          onChange={(event) => onRoleChange(user.id, event.target.value)}
          aria-label={`Rôle de ${user.fullName}`}
          className="h-10 w-full appearance-none rounded-md border border-[#dfe6d7] bg-white pl-9 pr-8 text-xs font-bold text-[#102b20] outline-none transition hover:border-[#0d6b4d]/35 focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#829187]" size={15} aria-hidden="true" />
      </span>
      <button
        type="button"
        onClick={() => onToggleBlock(user.id)}
        title={isBlocked ? `Réactiver l'accès de ${user.fullName}` : `Bloquer l'accès de ${user.fullName}`}
        aria-label={isBlocked ? `Réactiver l'accès de ${user.fullName}` : `Bloquer l'accès de ${user.fullName}`}
        className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border transition ${
          isBlocked
            ? "border-[#b9ddc9] bg-[#eef8f1] text-[#237343] hover:bg-[#e2f2e8]"
            : "border-[#efc3bd] bg-[#fff8f6] text-[#a13b2f] hover:bg-[#fff1ee]"
        }`}
      >
        {isBlocked ? <UserCheck size={17} aria-hidden="true" /> : <Ban size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}

function FilialeLogo({ name, compact = false }: { name: string; compact?: boolean }) {
  const logo = FILIALE_LOGOS[name];

  if (!logo) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-[#dfe6d7] bg-[#f8faf7] px-3 text-xs font-black text-[#5e7166]">
        {name}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border border-[#dfe6d7] bg-white px-3 shadow-[0_8px_22px_rgba(16,43,32,0.06)] ${
        compact ? "h-9 min-w-20" : "h-10 min-w-24"
      }`}
      title={logo.label}
      aria-label={logo.label}
    >
      <img src={logo.src} alt="" className="max-h-6 max-w-[86px] object-contain" loading="lazy" />
    </span>
  );
}

export default Dashboard;
