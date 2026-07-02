import { useState, type ReactNode } from "react";
import { Bell, HelpCircle, Home, LayoutDashboard, LogOut, Menu, Settings, UserRound, X } from "lucide-react";

export type AppView = "dashboard" | "settings";

type AppShellProps = {
  children: ReactNode;
  activeView: AppView;
  adminEmail: string;
  adminName: string;
  adminPhotoUrl?: string;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
};

const navItems = [
  { key: "dashboard" as const, label: "Tableau de bord", Icon: LayoutDashboard },
  { key: "settings" as const, label: "Paramètres", Icon: Settings }
];

export function AppShell({ children, activeView, adminEmail, adminName, adminPhotoUrl, onViewChange, onLogout }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeLabel = navItems.find((item) => item.key === activeView)?.label ?? "Tableau de bord";

  const changeView = (view: AppView) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-svh bg-[#f6f7ef] text-[#102b20] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {isSidebarOpen && <button type="button" className="fixed inset-0 z-30 bg-[#102b20]/24 lg:hidden" aria-label="Fermer la navigation" onClick={() => setIsSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-[#dfe6d7] bg-white shadow-[0_24px_80px_rgba(16,43,32,0.18)] transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:w-auto lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#dfe6d7] px-4">
          <a href="/" className="flex items-center gap-3" aria-label="Retour à l'accueil OCP Stock">
            <img src="/Logo-OCP_header.svg" alt="OCP" className="h-8 w-auto" />
            <span className="text-sm font-semibold uppercase text-[#5e7166]">Stock</span>
          </a>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#dfe6d7] text-[#314238] lg:hidden" aria-label="Fermer la navigation" onClick={() => setIsSidebarOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="grid gap-2 p-4" aria-label="Navigation administrateur">
          {navItems.map(({ key, label, Icon }) => {
            const isActive = activeView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeView(key)}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                  isActive ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f8faf7] hover:text-[#102b20]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#dfe6d7] p-4">
          <div className="group relative">
            <button type="button" className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold text-[#5e7166] transition hover:bg-[#f8faf7] hover:text-[#102b20]" aria-label="Centre d'aide">
              <HelpCircle size={17} aria-hidden="true" />
              Centre d'aide
            </button>
            <span className="pointer-events-none absolute bottom-14 left-3 z-50 w-64 rounded-md border border-[#dfe6d7] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#314238] opacity-0 shadow-[0_18px_44px_rgba(16,43,32,0.12)] transition group-hover:opacity-100 group-focus-within:opacity-100">
              Contactez l'admin du département IT
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#dfe6d7] bg-white/94 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#dfe6d7] bg-white text-[#314238] lg:hidden"
                aria-label="Ouvrir la navigation"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{activeLabel}</p>
                <p className="hidden truncate text-xs font-semibold text-[#6c7c71] sm:block">Espace administrateur OCP Stock</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#dfe6d7] bg-white text-[#314238] transition hover:border-[#0d6b4d]/45 hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Revenir à la page d'accueil"
                title="Revenir à la page d'accueil"
              >
                <Home size={17} aria-hidden="true" />
              </a>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-md border border-[#dfe6d7] bg-white text-[#314238] transition hover:border-[#0d6b4d]/45 hover:bg-[#f6f7ef] hover:text-[#0d6b4d] sm:flex"
                aria-label="Notifications"
              >
                <Bell size={17} aria-hidden="true" />
              </button>
              <span className="hidden max-w-[220px] truncate rounded-md border border-[#dfe6d7] bg-[#f8faf7] px-3 py-2 text-xs font-bold text-[#5e7166] md:block">
                {adminEmail}
              </span>
              <span className="hidden items-center gap-2 rounded-md border border-[#dfe6d7] bg-white px-2 py-1.5 md:flex">
                {adminPhotoUrl ? (
                  <img src={adminPhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ed] text-[#0d6b4d]">
                    <UserRound size={16} aria-hidden="true" />
                  </span>
                )}
                <span className="max-w-[140px] truncate text-xs font-bold text-[#314238]">{adminName}</span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="flex h-10 items-center gap-2 rounded-md border border-[#dfe6d7] bg-white px-3 text-sm font-bold text-[#314238] transition hover:border-[#0d6b4d]/45 hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100svh-64px)] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
