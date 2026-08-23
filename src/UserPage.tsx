import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Boxes,
  Camera,
  CheckCircle2,
  Construction,
  Eye,
  EyeOff,
  HardHat,
  Home,
  Layers,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Package,
  Phone,
  Save,
  Settings,
  Ship,
  TrainFront,
  UserRound,
  Wrench,
  X
} from "lucide-react";
import { changeUserPassword, getCurrentUser, getUser, logoutUser, updateUser, type CsvUser } from "./api";
import SiteFooter from "./SiteFooter";
import SynoptiqueManutention from "./components/module2/SynoptiqueManutention";
import GestionTrains from "./components/train/GestionTrains";
import GestionNavires from "./components/navire/GestionNavires";
import GestionStock from "./components/stock/GestionStock";
import MouvementsStock from "./components/stock/MouvementsStock";
import StockDashboard from "./components/stock/StockDashboard";
import GestionHSE from "./components/hse/GestionHSE";
import BilanArrets from "./components/arrets/BilanArrets";
import AssistantIA from "./components/assistant/AssistantIA";
import FloatingChatWidget from "./components/assistant/FloatingChatWidget";
import GestionMaintenance from "./components/maintenance/GestionMaintenance";
import NotificationBell from "./notifications/NotificationBell";

type UserView =
  | "parametres"
  | "module1"
  | "module2"
  | "train"
  | "navires"
  | "stock"
  | "mouvements-stock"
  | "bilan-arrets"
  | "maintenance"
  | "hse"
  | "assistant-ia";

const inputClass =
  "h-12 w-full rounded-md border border-[#dfe6d7] bg-white px-4 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const disabledClass = "h-12 w-full rounded-md border border-[#dfe6d7] bg-[#edf2e8] px-4 text-sm font-bold text-[#829187] outline-none";

const navItems: { key: UserView; label: string; Icon: typeof Settings; wip?: boolean }[] = [
  { key: "parametres", label: "Paramètres", Icon: Settings },
  { key: "module1", label: "Dashboard", Icon: Boxes },
  { key: "module2", label: "Schéma de manutention", Icon: Layers },
  { key: "train", label: "Gestion de train", Icon: TrainFront },
  { key: "navires", label: "Gestion de navires", Icon: Ship },
  { key: "stock", label: "Gestion de stock", Icon: Package },
  { key: "mouvements-stock", label: "Mouvements de stock", Icon: ArrowLeftRight },
  { key: "bilan-arrets", label: "Bilan des arrêts", Icon: BarChart3 },
  { key: "maintenance", label: "Maintenance", Icon: Wrench },
  { key: "hse", label: "HSE", Icon: HardHat },
  { key: "assistant-ia", label: "Assistant IA", Icon: Bot }
];

export default function UserPage() {
  const matricule = decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[1] ?? "");
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);

  const [activeView, setActiveView] = useState<UserView>("parametres");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<CsvUser | null>(null);
  const [draft, setDraft] = useState<CsvUser | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.lang = "fr";
    document.title = "OCP Stock | Espace utilisateur";

    getCurrentUser().then((sessionUser) => {
      if (!sessionUser || sessionUser.matricule.toUpperCase() !== matricule.toUpperCase()) {
        window.location.href = "/";
        return;
      }
      getUser(matricule)
        .then((nextUser) => {
          setUser(nextUser);
          setDraft(nextUser);
        })
        .catch((apiError: Error) => setError(apiError.message));
    });
  }, [matricule]);

  const changeView = (view: UserView) => {
    setActiveView(view);
    setIsSidebarOpen(false);
    setMessage("");
  };

  const updateDraft = (key: keyof CsvUser, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateDraft("photoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || savingProfile) return;
    setError("");
    setMessage("");
    setSavingProfile(true);

    try {
      const nextUser = await updateUser(draft.matricule, {
        fullName: draft.fullName,
        phone: draft.phone,
        photoUrl: draft.photoUrl,
        filiale: draft.filiale,
        fonction: draft.fonction,
        departement: draft.departement
      });
      setUser(nextUser);
      setDraft(nextUser);
      setMessage("Informations mises à jour.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Erreur de mise à jour.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || savingPassword) return;
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setSavingPassword(true);
    try {
      await changeUserPassword(user.matricule, oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Mot de passe modifié.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Erreur de mise à jour du mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  };

  const activeItem = navItems.find((item) => item.key === activeView) ?? navItems[0];
  const viewTransition = { duration: reduced ? 0 : 0.26, ease: "easeOut" as const };

  return (
    <div className="relative isolate min-h-svh bg-[#f6f7ef] text-[#102b20]">
      <div className="user-ambient-bg" aria-hidden="true">
        <span className="user-ambient-blob user-blob-a" />
        <span className="user-ambient-blob user-blob-b" />
        <span className="user-ambient-blob user-blob-c" />
      </div>

      <div className="relative z-10 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-pointer bg-[#102b20]/32 lg:hidden"
            aria-label="Fermer la navigation"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-[#132a1f] bg-[#0b1912] shadow-[0_24px_80px_rgba(3,12,8,0.45)] transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:w-auto lg:translate-x-0 lg:bg-[#0b1912]/95 lg:shadow-none lg:backdrop-blur-xl ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#132a1f] px-4">
            <a href="/" className="flex items-center gap-3" aria-label="Retour à l'accueil OCP Stock">
              <img src="/Logo-OCP_header.svg" alt="OCP" className="h-8 w-auto brightness-0 invert" />
              <span className="text-sm font-semibold uppercase text-[#7fa08c]">Stock</span>
            </a>
            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#1e3a2c] text-[#9fb3a6] lg:hidden"
              aria-label="Fermer la navigation"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <nav className="grid gap-1.5 p-4" aria-label="Navigation espace utilisateur">
            {navItems.map(({ key, label, Icon, wip }) => {
              const isActive = activeView === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeView(key)}
                  className={`relative flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b7d534] ${
                    isActive ? "text-[#b7d534]" : "text-[#8fae9c] hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="user-nav-active"
                      className="absolute inset-0 rounded-md border border-[#2a5a3f] bg-[#15321f]"
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 40 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 flex flex-1 items-center gap-3">
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </span>
                  {wip && (
                    <span className="relative z-10 rounded-full border border-[#3a4a2e] bg-[#1b2a12] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#c8e06a]">
                      Bientôt
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[#132a1f] p-4">
            <button
              type="button"
              onClick={() => {
                logoutUser().finally(() => {
                  window.location.href = "/";
                });
              }}
              className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-bold text-[#8fae9c] transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b7d534]"
            >
              <LogOut size={17} aria-hidden="true" />
              Déconnexion
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#132a1f] bg-[#0b1912]/95 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#1e3a2c] bg-[#12241a] text-[#9fb3a6] lg:hidden"
                  aria-label="Ouvrir la navigation"
                >
                  <Menu size={18} aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{activeItem.label}</p>
                  <p className="hidden truncate text-xs font-semibold text-[#7fa08c] sm:block">Espace utilisateur OCP Stock</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <NotificationBell onNavigate={(view) => setActiveView(view as UserView)} />
                <a
                  href="/"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-[#1e3a2c] bg-[#12241a] text-[#9fb3a6] transition hover:border-[#b7d534]/45 hover:bg-[#15321f] hover:text-[#b7d534]"
                  aria-label="Revenir à la page d'accueil"
                  title="Revenir à la page d'accueil"
                >
                  <Home size={17} aria-hidden="true" />
                </a>
                {draft && (
                  <span className="hidden items-center gap-2 rounded-md border border-[#1e3a2c] bg-[#12241a] px-2 py-1.5 md:flex">
                    {draft.photoUrl ? (
                      <img src={draft.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15321f] text-[#b7d534]">
                        <UserRound size={16} aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block max-w-[160px] truncate text-xs font-bold text-white">{draft.fullName}</span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#7fa08c]">{draft.matricule}</span>
                    </span>
                  </span>
                )}
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100svh-64px)] px-4 py-6 sm:px-6 lg:px-8">
            <div
              className={`mx-auto w-full ${
                activeView === "train" ||
                activeView === "navires" ||
                activeView === "stock" ||
                activeView === "mouvements-stock" ||
                activeView === "bilan-arrets" ||
                activeView === "maintenance" ||
                activeView === "hse" ||
                activeView === "module2"
                  ? "max-w-none"
                  : "max-w-5xl"
              }`}
            >
              <div aria-live="polite">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key={`error-${error}`}
                      role="alert"
                      initial={{ opacity: 0, y: reduced ? 0 : -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={viewTransition}
                      className="mb-5 rounded-md border border-[#efc3bd] bg-[#fff1ee] px-4 py-3 text-sm font-semibold text-[#a13b2f]"
                    >
                      {error}
                    </motion.p>
                  )}
                  {message && (
                    <motion.p
                      key={`message-${message}`}
                      initial={{ opacity: 0, y: reduced ? 0 : -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={viewTransition}
                      className="mb-5 flex items-center gap-2 rounded-md border border-[#b9ddc9] bg-[#eef8f1] px-4 py-3 text-sm font-semibold text-[#237343]"
                    >
                      <CheckCircle2 size={17} className="shrink-0 text-[#0d6b4d]" aria-hidden="true" />
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -8, transition: { duration: reduced ? 0 : 0.16, ease: "easeIn" } }}
                  transition={viewTransition}
                >
                  {activeView === "parametres" ? (
                    <ParametresView
                      draft={draft}
                      reduced={reduced}
                      hasLoadError={Boolean(error) && !draft}
                      oldPassword={oldPassword}
                      newPassword={newPassword}
                      confirmPassword={confirmPassword}
                      showPasswords={showPasswords}
                      savingProfile={savingProfile}
                      savingPassword={savingPassword}
                      onDraftChange={updateDraft}
                      onPhotoChange={handlePhotoChange}
                      onProfileSubmit={handleProfileSubmit}
                      onPasswordSubmit={handlePasswordSubmit}
                      onOldPassword={setOldPassword}
                      onNewPassword={setNewPassword}
                      onConfirmPassword={setConfirmPassword}
                      onToggleShowPasswords={() => setShowPasswords((value) => !value)}
                    />
                  ) : activeView === "module1" ? (
                    <StockDashboard onNavigate={changeView} />
                  ) : activeView === "module2" ? (
                    <SynoptiqueManutention />
                  ) : activeView === "train" ? (
                    <GestionTrains />
                  ) : activeView === "navires" ? (
                    <GestionNavires />
                  ) : activeView === "stock" ? (
                    <GestionStock />
                  ) : activeView === "mouvements-stock" ? (
                    <MouvementsStock />
                  ) : activeView === "bilan-arrets" ? (
                    <BilanArrets />
                  ) : activeView === "maintenance" ? (
                    <GestionMaintenance />
                  ) : activeView === "hse" ? (
                    <GestionHSE />
                  ) : activeView === "assistant-ia" ? (
                    <AssistantIA onNavigate={(view) => setActiveView(view as UserView)} />
                  ) : (
                    <ModulePlaceholder label={activeItem.label} reduced={reduced} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <div className="relative z-10">
        <SiteFooter lang="fr" homeHrefPrefix="/" />
      </div>

      {activeView !== "assistant-ia" && <FloatingChatWidget onNavigate={(view) => setActiveView(view as UserView)} />}
    </div>
  );
}

function ParametresView({
  draft,
  reduced,
  hasLoadError,
  oldPassword,
  newPassword,
  confirmPassword,
  showPasswords,
  savingProfile,
  savingPassword,
  onDraftChange,
  onPhotoChange,
  onProfileSubmit,
  onPasswordSubmit,
  onOldPassword,
  onNewPassword,
  onConfirmPassword,
  onToggleShowPasswords
}: {
  draft: CsvUser | null;
  reduced: boolean;
  hasLoadError: boolean;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showPasswords: boolean;
  savingProfile: boolean;
  savingPassword: boolean;
  onDraftChange: (key: keyof CsvUser, value: string) => void;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOldPassword: (value: string) => void;
  onNewPassword: (value: string) => void;
  onConfirmPassword: (value: string) => void;
  onToggleShowPasswords: () => void;
}) {
  if (hasLoadError) {
    return (
      <section className="rounded-lg border border-[#dfe6d7] bg-white/85 p-8 text-center shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
        <p className="text-sm font-bold text-[#5e7166]">Impossible de charger le profil.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed]"
        >
          Réessayer
        </button>
      </section>
    );
  }

  if (!draft) {
    return (
      <div className="grid gap-5" aria-label="Chargement du profil" role="status">
        <div className="h-36 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
          <div className="h-[430px] animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
          <div className="h-[430px] animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
        </div>
      </div>
    );
  }

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : 0.07 } }
  };
  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.4, ease: "easeOut" as const } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={container} className="grid gap-5">
      <motion.section
        variants={item}
        className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Espace utilisateur</p>
            <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-[#102b20] sm:text-4xl">
              Bonjour {draft.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Consultez vos informations professionnelles et mettez à jour votre téléphone, photo de profil et mot de passe.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[#dfe6d7] bg-white/80 px-4 py-3">
            {draft.photoUrl ? (
              <img src={draft.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4ed] text-[#0d6b4d]">
                <UserRound size={24} aria-hidden="true" />
              </span>
            )}
            <span>
              <span className="block text-sm font-black text-[#102b20]">{draft.fullName}</span>
              <span className="block text-xs font-semibold text-[#6c7c71]">{draft.matricule}</span>
            </span>
          </div>
        </div>
      </motion.section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
        <motion.form
          variants={item}
          onSubmit={onProfileSubmit}
          className="rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm sm:p-6"
        >
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Photo de profil
              <div className="flex flex-col gap-4 rounded-lg border border-dashed border-[#b8c6bc] bg-[#f8faf7] p-4 sm:flex-row sm:items-center">
                {draft.photoUrl ? (
                  <img src={draft.photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0d6b4d]">
                    <Camera size={24} aria-hidden="true" />
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoChange}
                  className="text-sm font-semibold text-[#5e7166] file:mr-4 file:h-10 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#0d6b4d] file:px-4 file:text-sm file:font-bold file:text-white"
                />
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Nom complet
                <input className={inputClass} value={draft.fullName} onChange={(event) => onDraftChange("fullName", event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Téléphone
                <span className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
                  <input
                    type="tel"
                    className={`${inputClass} pl-11`}
                    value={draft.phone}
                    onChange={(event) => onDraftChange("phone", event.target.value)}
                    placeholder="+212 6 00 00 00 00"
                  />
                </span>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Matricule
                <input className={disabledClass} value={draft.matricule} disabled />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Email
                <span className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98a29a]" size={17} aria-hidden="true" />
                  <input className={`${disabledClass} pl-11`} value={draft.email} disabled />
                </span>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Filiale
                <input className={inputClass} value={draft.filiale} onChange={(event) => onDraftChange("filiale", event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Fonction
                <input className={inputClass} value={draft.fonction} onChange={(event) => onDraftChange("fonction", event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238] md:col-span-2">
                Département
                <input className={inputClass} value={draft.departement} onChange={(event) => onDraftChange("departement", event.target.value)} />
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d] disabled:cursor-default disabled:opacity-60 sm:w-auto"
            >
              {savingProfile ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              ) : (
                <Save size={17} aria-hidden="true" />
              )}
              {savingProfile ? "Enregistrement..." : "Enregistrer les informations"}
            </button>
          </div>
        </motion.form>

        <motion.form
          variants={item}
          onSubmit={onPasswordSubmit}
          className="rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm sm:p-6"
        >
          <div className="mb-5">
            <h2 className="font-display text-2xl font-medium text-[#102b20]">Changer le mot de passe</h2>
            <p className="mt-2 text-sm leading-6 text-[#6c7c71]">Saisissez l'ancien mot de passe, puis le nouveau mot de passe et sa confirmation.</p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Ancien mot de passe
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="current-password"
                  className={`${inputClass} pl-11 pr-12`}
                  value={oldPassword}
                  onChange={(event) => onOldPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={onToggleShowPasswords}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#829187] transition hover:text-[#0d6b4d]"
                  aria-label={showPasswords ? "Masquer les mots de passe" : "Afficher les mots de passe"}
                >
                  {showPasswords ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Nouveau mot de passe
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                className={inputClass}
                value={newPassword}
                onChange={(event) => onNewPassword(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Confirmer le nouveau mot de passe
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                className={inputClass}
                value={confirmPassword}
                onChange={(event) => onConfirmPassword(event.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed] disabled:cursor-default disabled:opacity-60"
            >
              {savingPassword && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d6b4d]/30 border-t-[#0d6b4d]" aria-hidden="true" />
              )}
              {savingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}

function ModulePlaceholder({ label, reduced }: { label: string; reduced: boolean }) {
  return (
    <section
      aria-label={`${label} en construction`}
      className="relative overflow-hidden rounded-lg border border-dashed border-[#b8c6bc] bg-white/75 px-6 py-16 text-center shadow-[0_16px_42px_rgba(16,43,32,0.05)] backdrop-blur-sm sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_-10%,rgba(183,213,52,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-md">
        <span className="relative mx-auto flex h-20 w-20 items-center justify-center">
          {!reduced && <span className="absolute inset-0 rounded-full bg-[#b7d534]/35 motion-safe:animate-ping [animation-duration:2.8s]" aria-hidden="true" />}
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#dfe6d7] bg-[#f3f8d9] text-[#0d6b4d]">
            <Construction size={30} aria-hidden="true" />
          </span>
        </span>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">OCP Stock · {label}</p>
        <h2 className="font-display mt-3 text-3xl font-medium tracking-tight text-[#102b20] sm:text-4xl">Module en construction</h2>
        <p className="mt-4 text-sm leading-7 text-[#6c7c71]">
          Ce module sera activé lors d'une prochaine étape. Vos accès et vos données sont déjà prêts pour son ouverture.
        </p>

        <span className="mt-8 inline-flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0d6b4d]/60 motion-safe:animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#0d6b4d]/60 motion-safe:animate-pulse [animation-delay:220ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#0d6b4d]/60 motion-safe:animate-pulse [animation-delay:440ms]" />
        </span>
      </div>
    </section>
  );
}
