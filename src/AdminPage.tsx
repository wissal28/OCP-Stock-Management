import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, AtSign, CheckCircle2, Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import SiteFooter from "./SiteFooter";
import { AppShell, type AppView } from "./components/app-shell";
import { AdminSettings, type AdminProfile } from "./components/admin-settings";
import { Dashboard, type AdminUser, type UserStatus } from "./components/dashboard";
import { changeUserPassword, listUsers, loginUser, updateUser, type CsvUser } from "./api";

type Toast = { id: number; text: string };

const ADMIN_EMAIL = "admin@ocp.ma";
const ADMIN_PASSWORD = "admin";

const INITIAL_ADMIN_PROFILE: AdminProfile = {
  fullName: "Administrateur OCP Stock",
  phone: "+212 6 00 00 00 00",
  photoUrl: "",
  matricule: "ADM-0001",
  email: ADMIN_EMAIL
};

const INITIAL_USERS: AdminUser[] = [
  {
    id: "u-1001",
    fullName: "Yassine Achkhity",
    email: "y.achkhity@ocpgroup.ma",
    matricule: "OCP-1001",
    filiale: "OCP",
    fonction: "Ingénieur de production",
    departement: "Service exploitation",
    statut: "actif",
    role: "Administrateur"
  },
  {
    id: "u-1042",
    fullName: "Salma Benali",
    email: "s.benali@ocpgroup.ma",
    matricule: "OCP-1042",
    filiale: "OCP",
    fonction: "Chef de poste",
    departement: "Poste de commande",
    statut: "actif",
    role: "Superviseur"
  },
  {
    id: "u-1108",
    fullName: "Omar El Idrissi",
    email: "o.elidrissi@jesa.com",
    matricule: "OCP-1108",
    filiale: "JESA",
    fonction: "Ingénieur méthodes",
    departement: "Bureau des méthodes",
    statut: "actif",
    role: "Gestionnaire stock"
  },
  {
    id: "u-1214",
    fullName: "Khadija Amrani",
    email: "k.amrani@ocpsolutions.ma",
    matricule: "OCP-1214",
    filiale: "OCP Solution",
    fonction: "Technicien spécialisé",
    departement: "Magasin",
    statut: "inactif",
    role: "Opérateur"
  },
  {
    id: "u-1337",
    fullName: "Mehdi Chraibi",
    email: "m.chraibi@ocpgroup.ma",
    matricule: "OCP-1337",
    filiale: "OCP",
    fonction: "Chef d'équipe",
    departement: "Service quais",
    statut: "actif",
    role: "Opérateur"
  },
  {
    id: "u-1420",
    fullName: "Nadia Tazi",
    email: "n.tazi@ocpgroup.ma",
    matricule: "OCP-1420",
    filiale: "OCP",
    fonction: "Responsable approvisionnement",
    departement: "Service approvisionnement",
    statut: "actif",
    role: "Gestionnaire stock"
  },
  {
    id: "u-1503",
    fullName: "Rachid Belkacem",
    email: "r.belkacem@jesa.com",
    matricule: "OCP-1503",
    filiale: "JESA",
    fonction: "Technicien de maintenance",
    departement: "Atelier mécanique",
    statut: "bloque",
    role: "Opérateur"
  },
  {
    id: "u-1615",
    fullName: "Imane Zeroual",
    email: "i.zeroual@ocpsolutions.ma",
    matricule: "OCP-1615",
    filiale: "OCP Solution",
    fonction: "Contrôleur de gestion",
    departement: "Service contrôle de gestion",
    statut: "actif",
    role: "Lecture seule"
  },
  {
    id: "u-1688",
    fullName: "Hamza Ouazzani",
    email: "h.ouazzani@ocpgroup.ma",
    matricule: "OCP-1688",
    filiale: "OCP",
    fonction: "Agent d'exploitation",
    departement: "NEF de déchargement des trains",
    statut: "inactif",
    role: "Opérateur"
  },
  {
    id: "u-1732",
    fullName: "Fatima-Zahra Alaoui",
    email: "fz.alaoui@ocpgroup.ma",
    matricule: "OCP-1732",
    filiale: "OCP",
    fonction: "Ingénieur HSE",
    departement: "Service HSE",
    statut: "bloque",
    role: "Superviseur"
  }
];

const inputClass =
  "h-12 w-full rounded-full border border-[#dfe6d7] bg-white px-11 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";

function toAdminUser(user: CsvUser): AdminUser {
  return {
    id: user.matricule,
    fullName: user.fullName,
    email: user.email,
    matricule: user.matricule,
    filiale: user.filiale,
    fonction: user.fonction,
    departement: user.departement,
    statut: user.statut,
    role: user.role
  };
}

function toAdminProfile(user: CsvUser): AdminProfile {
  return {
    fullName: user.fullName,
    phone: user.phone,
    photoUrl: user.photoUrl,
    matricule: user.matricule,
    email: user.email
  };
}

export default function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(INITIAL_ADMIN_PROFILE);
  const [adminPassword, setAdminPassword] = useState(ADMIN_PASSWORD);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    document.title = "OCP Stock | Espace administrateur";
    document.documentElement.lang = "fr";
  }, []);

  useEffect(() => {
    listUsers()
      .then((csvUsers) => setUsers(csvUsers.map(toAdminUser)))
      .catch(() => setToast({ id: Date.now(), text: "Impossible de charger utilisateur.csv." }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleRoleChange = (userId: string, role: string) => {
    const user = users.find((item) => item.id === userId);
    setUsers((current) => current.map((item) => (item.id === userId ? { ...item, role } : item)));
    if (user) {
      void updateUser(user.matricule, { role }).catch(() => setToast({ id: Date.now(), text: "Erreur lors de la mise à jour du rôle." }));
    }
    if (user) {
      setToast({ id: Date.now(), text: `Rôle « ${role} » attribué à ${user.fullName}.` });
    }
  };

  const handleToggleBlock = (userId: string) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    const nextStatus: UserStatus = user.statut === "bloque" ? "actif" : "bloque";
    setUsers((current) => current.map((item) => (item.id === userId ? { ...item, statut: nextStatus } : item)));
    void updateUser(user.matricule, { statut: nextStatus }).catch(() => setToast({ id: Date.now(), text: "Erreur lors de la mise à jour du statut." }));
    setToast({
      id: Date.now(),
      text: nextStatus === "bloque" ? `Accès bloqué pour ${user.fullName}.` : `Accès réactivé pour ${user.fullName}.`
    });
  };

  const handleAdminProfileChange = (profile: AdminProfile) => {
    setAdminProfile(profile);
    void updateUser(profile.matricule, {
      fullName: profile.fullName,
      phone: profile.phone,
      photoUrl: profile.photoUrl
    }).catch(() => setToast({ id: Date.now(), text: "Erreur lors de la mise à jour du profil administrateur." }));
  };

  const handleAdminPasswordChange = (password: string) => {
    const previousPassword = adminPassword;
    setAdminPassword(password);
    void changeUserPassword(adminProfile.matricule, previousPassword, password).catch(() => {
      setAdminPassword(previousPassword);
      setToast({ id: Date.now(), text: "Erreur lors de la mise à jour du mot de passe administrateur." });
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef]">
      {isLoggedIn ? (
        <AppShell
          activeView={activeView}
          adminEmail={adminProfile.email}
          adminName={adminProfile.fullName}
          adminPhotoUrl={adminProfile.photoUrl}
          onViewChange={setActiveView}
          onLogout={() => setIsLoggedIn(false)}
        >
          {activeView === "dashboard" ? (
            <Dashboard reduced={reduced} users={users} onRoleChange={handleRoleChange} onToggleBlock={handleToggleBlock} />
          ) : (
            <AdminSettings
              profile={adminProfile}
              currentPassword={adminPassword}
              onProfileChange={handleAdminProfileChange}
              onPasswordChange={handleAdminPasswordChange}
              onNotify={(message) => setToast({ id: Date.now(), text: message })}
            />
          )}
        </AppShell>
      ) : (
        <AdminLogin
          key="login"
          reduced={reduced}
          onSuccess={(user, password) => {
            setAdminProfile(toAdminProfile(user));
            setAdminPassword(password);
            setIsLoggedIn(true);
          }}
        />
      )}

      <SiteFooter lang="fr" homeHrefPrefix="/" />

      <div aria-live="polite" className="fixed bottom-5 right-5 z-50">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : 10 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
              className="flex items-center gap-3 rounded-full border border-[#b9ddc9] bg-white px-5 py-3 text-sm font-semibold text-[#314238] shadow-[0_20px_60px_rgba(16,43,32,0.14)] backdrop-blur-xl"
            >
              <CheckCircle2 size={18} className="shrink-0 text-[#0d6b4d]" aria-hidden="true" />
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AdminLogin({ reduced, onSuccess }: { reduced: boolean; onSuccess: (user: CsvUser, password: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const identifierRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifiant") ?? "").trim().toLowerCase();
    const password = String(data.get("motdepasse") ?? "");

    try {
      const user = await loginUser(identifier, password);
      if (user.role !== "Administrateur") {
        setError("Ce compte n'a pas le rôle administrateur.");
        identifierRef.current?.focus();
        return;
      }
      setError("");
      onSuccess(user, password);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Identifiants invalides pour l'espace administrateur.");
      identifierRef.current?.focus();
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: reduced ? 0 : 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: "easeOut" }}
      className="bg-[#f6f7ef] px-4 py-6 text-[#102b20] sm:px-6 sm:py-8"
    >
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between">
        <a href="/" className="flex items-center gap-3" aria-label="Retour à l'accueil OCP Stock">
          <img src="/Logo-OCP_header.svg" alt="OCP" className="h-8 w-auto" />
          <span className="text-sm font-semibold uppercase text-[#5e7166]">Stock</span>
        </a>

        <a
          href="/"
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-[#dfe6d7] bg-white text-[#102b20] shadow-[0_14px_34px_rgba(16,43,32,0.08)] transition hover:-translate-y-0.5 hover:border-[#0d6b4d]/45 hover:bg-[#f6f7ef] hover:text-[#0d6b4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d6b4d]"
          aria-label="Revenir à la page d'accueil"
          title="Revenir à la page d'accueil"
        >
          <ArrowLeft size={20} strokeWidth={1.9} aria-hidden="true" />
        </a>
      </div>

      <div className="relative mx-auto grid min-h-[min(780px,calc(100svh-128px))] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-[0_34px_110px_rgba(16,43,32,0.18)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative min-h-[260px] overflow-hidden bg-[#0a3d2b] lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(214,236,85,0.28),transparent_30%),linear-gradient(135deg,#0a3d2b,#061d15_58%,#102b20)]" />
          <motion.img src="/hero-warehouse.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-78 [object-position:0%_50%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,29,21,0.10),rgba(6,29,21,0.90))]" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6ec55]">OCP Stock</p>
            <h1 className="font-display mt-3 max-w-md text-3xl font-medium leading-tight sm:text-4xl">Accès sécurisé à OCP Stock.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/74">
              Identifiez-vous avec votre email ou matricule pour gérer les rôles, les autorisations et les accès.
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[520px]">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 inline-flex rounded-full border border-[#dfe6d7] bg-[#f6f7ef] p-1">
                <span className="inline-flex h-10 items-center rounded-full bg-[#0d6b4d] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,107,77,0.18)]">
                  Connexion
                </span>
              </div>

              <h2 className="font-display text-4xl font-medium tracking-tight text-[#102b20]">Bonjour dans l'espace administrateur.</h2>
              <p className="mt-2 text-sm font-semibold text-[#6c7c71]">Email ou matricule, puis mot de passe.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <form className="grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Email ou matricule
                <span className="relative">
                  <AtSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                  <input
                    ref={identifierRef}
                    required
                    name="identifiant"
                    autoComplete="username"
                    className={inputClass}
                    placeholder="email@ocpgroup.ma ou matricule"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Mot de passe
                <span className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                  <input
                    required
                    name="motdepasse"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#829187] transition hover:text-[#0d6b4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b4d]"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 font-semibold text-[#5e7166]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#b8c6bc] accent-[#0d6b4d]" />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => setError("La récupération du mot de passe administrateur sera connectée lors de la prochaine étape.")}
                  className="font-bold text-[#0d6b4d] underline-offset-4 transition hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0d6b4d] px-6 text-sm font-bold text-white shadow-[0_18px_42px_rgba(13,107,77,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0a563d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d6b4d]"
              >
                <LogIn size={18} aria-hidden="true" />
                Accéder à l'espace admin
              </button>
            </form>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
