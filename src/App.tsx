import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Factory,
  Gauge,
  IdCard,
  Languages,
  LogIn,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  PhoneCall,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  UserPlus,
  Warehouse,
  X
} from "lucide-react";
import ScrollStack, { ScrollStackItem } from "./components/ScrollStack";
import { createUser as createCsvUser, loginUser } from "./api";
import SiteFooter from "./SiteFooter";

type Lang = "fr" | "en";
type AuthMode = "login" | "signup";

type StrategicPartner = {
  name: string;
  wordmark: string;
  descriptor: string;
  initials: string;
  logoSrc?: string;
  color: string;
  accent: string;
};

const content = {
  fr: {
    langLabel: "FR",
    langSwitch: "EN",
    nav: [
      { label: "Accueil", href: "#accueil" },
      { label: "Gestion stock", href: "#stock" },
      { label: "Port Casablanca", href: "#port-casablanca" },
      { label: "Réseau", href: "#reseau" },
      { label: "Contact", href: "#contact" }
    ],
    hero: {
      eyebrow: "OCP Stock Intelligence",
      title: "Maîtriser les stocks critiques du phosphate au terrain.",
      text: "Une interface digitale pour suivre les inventaires, sécuriser les flux, anticiper les ruptures et connecter les opérations OCP avec une vision temps réel.",
      primary: "Découvrir la solution",
      secondary: "Voir le réseau",
      tabs: ["Stock critique", "Approvisionnement", "Production", "Traçabilité"]
    },
    stats: [
      { value: "98%", label: "fiabilité inventaire" },
      { value: "-32%", label: "ruptures anticipées" },
      { value: "4", label: "sites miniers connectés" },
      { value: "24/7", label: "pilotage opérationnel" }
    ],
    stock: {
      eyebrow: "Gestion de stock",
      title: "OCP Stock pour les équipes stock, achats et production.",
      text: "La plateforme présente les niveaux disponibles, les seuils critiques, les mouvements entrants et sortants, ainsi que les alertes qui demandent une décision rapide.",
      cards: [
        {
          title: "Inventaire unifié",
          text: "Référentiel articles, lots, emplacements et statuts consolidés dans une seule vue."
        },
        {
          title: "Alertes intelligentes",
          text: "Seuils, retards, surstock, consommation anormale et besoins de réassort priorisés."
        },
        {
          title: "Traçabilité terrain",
          text: "Chaque mouvement reste relié à un site, un utilisateur, un document et un statut de validation."
        }
      ],
      dashboardTitle: "Tableau de bord stock",
      dashboardSubtitle: "Synthèse temps réel",
      dashboardRows: ["Acide phosphorique", "Pièces convoyeur", "Engrais conditionnés", "Réactifs laboratoire"],
      dashboardTags: ["Disponible", "Seuil bas", "En transit", "Contrôle qualité"]
    },
    about: {
      eyebrow: "Port Casablanca",
      title: "Le port de Casablanca, point historique d'export du phosphate.",
      text: "Le port de Casablanca est alors le seul au Maroc à permettre l'export du phosphate. Jusqu'en 1923, le chargement du phosphate sur les bateaux se fait avec des moyens de fortune et presque exclusivement à dos d'homme. La vitesse moyenne de chargement est limitée, de l'ordre de 1 200 tonnes/jour.",
      bullets: [
        "Un point de départ stratégique pour les premières exportations.",
        "Une logistique portuaire historiquement très dépendante de l'effort humain.",
        "Une cadence de chargement limitée avant la modernisation des moyens industriels."
      ]
    },
    partners: {
      eyebrow: "Entités stratégiques",
      title: "Les unités et partenaires stratégiques du groupe OCP.",
      text: "Un écosystème de filiales, fondations, joint-ventures et partenaires industriels qui soutient l'innovation, l'énergie, l'eau, l'ingénierie, les engrais et le développement territorial."
    },
    map: {
      eyebrow: "Réseau Maroc",
      title: "Une présence industrielle qui structure les flux de stock.",
      text: "La section Port Casablanca s'inscrit dans le réseau marocain des réserves, sites miniers, plateformes de traitement et corridors logistiques.",
      legend: ["Sites miniers : 4", "Sites de traitement : 2", "Ports et quais : 4", "Pipeline et rail"]
    },
    contact: {
      eyebrow: "Contact",
      title: "Contactez l'équipe OCP Stock pour cadrer vos besoins opérationnels.",
      text: "Présentez vos sites, vos flux de stock et vos contraintes métier afin de préparer un accompagnement adapté.",
      name: "Nom",
      email: "Email",
      message: "Besoin",
      placeholder: "Décrivez le contexte stock, les sites concernés et les objectifs.",
      button: "Envoyer la demande"
    }
  },
  en: {
    langLabel: "EN",
    langSwitch: "FR",
    nav: [
      { label: "Home", href: "#accueil" },
      { label: "Stock control", href: "#stock" },
      { label: "Casablanca Port", href: "#port-casablanca" },
      { label: "Network", href: "#reseau" },
      { label: "Contact", href: "#contact" }
    ],
    hero: {
      eyebrow: "OCP Stock Intelligence",
      title: "Control critical stock from phosphate operations to the field.",
      text: "A digital interface to monitor inventory, secure flows, anticipate shortages and connect OCP operations with real-time visibility.",
      primary: "Explore the solution",
      secondary: "View network",
      tabs: ["Critical stock", "Procurement", "Production", "Traceability"]
    },
    stats: [
      { value: "98%", label: "inventory reliability" },
      { value: "-32%", label: "anticipated shortages" },
      { value: "4", label: "connected mining sites" },
      { value: "24/7", label: "operational monitoring" }
    ],
    stock: {
      eyebrow: "Stock management",
      title: "OCP Stock for stock, purchasing and production teams.",
      text: "The platform presents available levels, critical thresholds, inbound and outbound movements, and alerts requiring quick decisions.",
      cards: [
        {
          title: "Unified inventory",
          text: "Item, batch, location and status references consolidated into one reliable view."
        },
        {
          title: "Smart alerts",
          text: "Thresholds, delays, overstock, abnormal consumption and replenishment needs are prioritized."
        },
        {
          title: "Field traceability",
          text: "Every movement remains linked to a site, user, document and validation status."
        }
      ],
      dashboardTitle: "Stock dashboard",
      dashboardSubtitle: "Real-time summary",
      dashboardRows: ["Phosphoric acid", "Conveyor parts", "Packaged fertilizers", "Laboratory reagents"],
      dashboardTags: ["Available", "Low threshold", "In transit", "Quality check"]
    },
    about: {
      eyebrow: "Casablanca Port",
      title: "Casablanca Port, the historic export point for phosphate.",
      text: "At the time, Casablanca Port was the only port in Morocco that enabled phosphate exports. Until 1923, phosphate was loaded onto ships with makeshift means and almost exclusively by manual labor. The average loading speed was limited, around 1,200 tonnes per day.",
      bullets: [
        "A strategic starting point for the first phosphate exports.",
        "Port logistics that were historically highly dependent on human effort.",
        "A limited loading rate before industrial handling systems were modernized."
      ]
    },
    partners: {
      eyebrow: "Strategic entities",
      title: "OCP Group's strategic units and partners.",
      text: "An ecosystem of subsidiaries, foundations, joint ventures and industrial partners supporting innovation, energy, water, engineering, fertilizers and territorial development."
    },
    map: {
      eyebrow: "Morocco network",
      title: "An industrial footprint that structures stock flows.",
      text: "The Casablanca Port section sits within Morocco's wider network of reserves, mining sites, processing platforms and logistics corridors.",
      legend: ["Mining sites: 4", "Processing sites: 2", "Ports and wharves: 4", "Pipeline and railway"]
    },
    contact: {
      eyebrow: "Contact",
      title: "Contact the OCP Stock team to scope your operational needs.",
      text: "Share your sites, stock flows and business constraints so the team can prepare the right support.",
      name: "Name",
      email: "Email",
      message: "Need",
      placeholder: "Describe the stock context, involved sites and objectives.",
      button: "Send request"
    }
  }
};

const solutionIcons = [Database, Gauge, ShieldCheck];

const heroSlides = [
  { src: "/Home%20page_Slider_Africa.jpg", origin: "50% 42%" },
  { src: "/hero-port.webp", origin: "50% 55%" },
  { src: "/hero-fields.webp", origin: "50% 50%" }
];

const portStackCards = [
  {
    image: "/port1.jpeg",
    step: "01",
    fr: {
      label: "Quai",
      title: "Lecture instantanée des arrivées au port.",
      text: "Chaque arrivée est reliée à son origine, son lot et sa zone de déchargement pour garder une traçabilité claire dès l'entrée."
    },
    en: {
      label: "Quay",
      title: "Instant visibility on port arrivals.",
      text: "Every arrival is linked to its origin, batch and unloading zone so traceability stays clear from the first movement."
    }
  },
  {
    image: "/port2.jpeg",
    step: "02",
    fr: {
      label: "Stock",
      title: "Une vision nette des zones de stockage.",
      text: "Les emplacements portuaires deviennent lisibles par famille, priorité et statut afin de réduire les ruptures et les attentes."
    },
    en: {
      label: "Stock",
      title: "A clearer view of port storage zones.",
      text: "Port locations become readable by family, priority and status to reduce shortages and waiting time."
    }
  },
  {
    image: "/port3.jpeg",
    step: "03",
    fr: {
      label: "Flux",
      title: "Coordination des mouvements vers le quai.",
      text: "Les équipes suivent les transferts entre parc, convoyage et quai avec les mêmes références de stock et de validation."
    },
    en: {
      label: "Flow",
      title: "Coordinated movement toward the wharf.",
      text: "Teams follow transfers between yard, conveying and wharf with the same stock and approval references."
    }
  },
  {
    image: "/port4.jpeg",
    step: "04",
    fr: {
      label: "Export",
      title: "Chargement maîtrisé jusqu'au navire.",
      text: "Le suivi relie les quantités expédiées au navire, au quai et aux documents associés pour sécuriser la sortie."
    },
    en: {
      label: "Export",
      title: "Controlled loading through to the vessel.",
      text: "Tracking links shipped quantities to the vessel, wharf and related documents to secure outbound operations."
    }
  }
];

const strategicPartners: StrategicPartner[] = [
  {
    name: "OCP Nutricrops",
    wordmark: "OCP | NUTRICROPS",
    descriptor: "Crop nutrition",
    initials: "ON",
    logoSrc: "/Logo Nutricrops_16102023_vFinal.png",
    color: "#159947",
    accent: "#7cc242"
  },
  {
    name: "Université Mohammed VI Polytechnique",
    wordmark: "UM6P",
    descriptor: "Research university",
    initials: "U6",
    logoSrc: "/UMP6 (3).png",
    color: "#e8461f",
    accent: "#f28c28"
  },
  {
    name: "INNOVX",
    wordmark: "INNOVX",
    descriptor: "Innovation platform",
    initials: "IX",
    logoSrc: "/Logo INNOVX.png",
    color: "#111827",
    accent: "#8bc53f"
  },
  {
    name: "OCP Green Water",
    wordmark: "OCP GREEN WATER",
    descriptor: "Water solutions",
    initials: "GW",
    logoSrc: "/Logo OCP Green Water.png",
    color: "#168f72",
    accent: "#8cc63f"
  },
  {
    name: "OCP Green Energy",
    wordmark: "OCP Green Energy",
    descriptor: "Renewable energy",
    initials: "GE",
    logoSrc: "/ocp_green(1).png",
    color: "#168a43",
    accent: "#9cc421"
  },
  {
    name: "Fondation OCP",
    wordmark: "FONDATION OCP",
    descriptor: "Social impact",
    initials: "FO",
    logoSrc: "/New Logo Fondation OCP.png",
    color: "#22a846",
    accent: "#7fd321"
  },
  {
    name: "Phosboucraa",
    wordmark: "PHOSBOUCRAA",
    descriptor: "Southern operations",
    initials: "PB",
    logoSrc: "/Logo Phosboucraa.png",
    color: "#23a85a",
    accent: "#8fd03d"
  },
  {
    name: "Fondation Phosboucraa",
    wordmark: "FONDATION PHOSBOUCRAA",
    descriptor: "Regional development",
    initials: "FP",
    logoSrc: "/Logo Fondation Phosboucraa_vFinal_vFR_Quadri.png",
    color: "#36a857",
    accent: "#7fc944"
  },
  {
    name: "JESA",
    wordmark: "JESA",
    descriptor: "Engineering",
    initials: "JE",
    logoSrc: "/Logo JESA.png",
    color: "#174f9f",
    accent: "#2a8cd8"
  },
  {
    name: "Fertinagro Biotech",
    wordmark: "FERTINAGRO BIOTECH",
    descriptor: "Specialty nutrition",
    initials: "FB",
    logoSrc: "/Logo fertinagro (2).png",
    color: "#e1272f",
    accent: "#c7c9cc"
  },
  {
    name: "GlobalFeed",
    wordmark: "GlobalFeed",
    descriptor: "Animal nutrition",
    initials: "GF",
    logoSrc: "/logo-globalfeed.png",
    color: "#f07c22",
    accent: "#111827"
  },
  {
    name: "Prayon",
    wordmark: "PRAYON",
    descriptor: "Phosphate chemistry",
    initials: "PR",
    logoSrc: "/logo-prayon.svg",
    color: "#7fc242",
    accent: "#21a650"
  },
  {
    name: "Imacid",
    wordmark: "imacid",
    descriptor: "Indo Maroc Phosphore",
    initials: "IM",
    logoSrc: "/Who we are__Our subsidiaries and partners_Logo IMACID_Quadri_0.png",
    color: "#f3a11a",
    accent: "#67b845"
  },
  {
    name: "SAEDM",
    wordmark: "SAEDM",
    descriptor: "Mazagan development",
    initials: "SM",
    logoSrc: "/Who we are__Our subsidiaries and partners_Logo SAEDM.png",
    color: "#1a8f72",
    accent: "#36b37e"
  },
  {
    name: "SADV",
    wordmark: "SADV",
    descriptor: "Green development",
    initials: "SV",
    logoSrc: "/Logo SADV final(1).png",
    color: "#2aa084",
    accent: "#0f766e"
  }
];

const filialeOptions = [
  { name: "OCP", logoSrc: "/Logo-OCP_header.svg" },
  { name: "OCP Solution", logoSrc: "/logo-ocp-solutions.png" },
  { name: "JESA", logoSrc: "/Logo JESA.png" }
];

const departmentOptions = [
  "Service exploitation",
  "Poste de commande",
  "NEF de déchargement des trains",
  "Service quais",
  "Service trafic maritime",
  "Service installation",
  "Bureau des méthodes",
  "Magasin",
  "Service approvisionnement",
  "Service contrôle de gestion",
  "Atelier mécanique",
  "Atelier électrique",
  "Atelier bandes",
  "Service échantillonnage",
  "Service ressources humaines",
  "Service HSE"
];

const functionOptions = [
  "Chef de département",
  "Chef de service",
  "Responsable d'exploitation",
  "Chef de poste",
  "Chef d'équipe",
  "Ingénieur",
  "Ingénieur de production",
  "Ingénieur de maintenance",
  "Ingénieur méthodes",
  "Ingénieur HSE",
  "Chef de projet",
  "Technicien supérieur",
  "Technicien spécialisé",
  "Technicien de maintenance",
  "Technicien mécanique",
  "Technicien électrique",
  "Technicien instrumentation",
  "Opérateur",
  "Agent d'exploitation",
  "Agent administratif",
  "Magasinier",
  "Contrôleur de gestion",
  "Responsable approvisionnement"
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

function App() {
  const [lang, setLang] = useState<Lang>("fr");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const pendingDestinationRef = useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const t = content[lang];
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" as const };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const updateHeader = () => {
      setIsHeaderScrolled(window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const toggleLanguage = () => {
    setLang((current) => (current === "fr" ? "en" : "fr"));
    setIsMenuOpen(false);
  };

  const openAuth = (mode: AuthMode = "login") => {
    setIsMenuOpen(false);
    setAuthMode(mode);
    setAuthMessage("");
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => {
    setIsAuthModalOpen(false);
    setAuthMessage("");
  };

  const handleDiscoverSolutionClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      event.preventDefault();
      pendingDestinationRef.current = "#stock";
      openAuth("login");
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifiant") ?? "").trim();
    const password = String(data.get("motdepasse") ?? "");

    try {
      const user = await loginUser(identifier, password);
      setIsLoggedIn(true);
      closeAuth();
      pendingDestinationRef.current = null;
      window.location.href = `/utilisateur/${encodeURIComponent(user.matricule)}`;
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Identifiants invalides.");
    }
  };

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    const data = new FormData(event.currentTarget);
    const password = String(data.get("motdepasse") ?? "");
    const confirmPassword = String(data.get("confirmation") ?? "");

    if (password !== confirmPassword) {
      setAuthMessage(lang === "fr" ? "La confirmation ne correspond pas au mot de passe." : "The confirmation does not match the password.");
      return;
    }

    try {
      await createCsvUser({
        fullName: String(data.get("fullName") ?? "").trim(),
        matricule: String(data.get("matricule") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        filiale: String(data.get("filiale") ?? "").trim(),
        fonction: String(data.get("fonction") ?? "").trim(),
        departement: String(data.get("departement") ?? "").trim(),
        password
      });
      setAuthMode("login");
      setAuthMessage(lang === "fr" ? "Compte créé dans utilisateur.csv. Connectez-vous pour continuer." : "Account created in utilisateur.csv. Sign in to continue.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Erreur pendant l'inscription.");
    }
    return;
    setAuthMode("login");
    setAuthMessage(
      lang === "fr"
        ? "Compte créé localement pour la démonstration. Connectez-vous pour continuer."
        : "Account created locally for the demo. Sign in to continue."
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#102b20]">
      <header
        className={`site-header fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
          isHeaderScrolled
            ? "site-header-light border-[#dfe6d7] bg-white/92 shadow-[0_12px_34px_rgba(16,43,32,0.10)]"
            : "site-header-dark border-white/12 bg-[#082b1f]/82"
        }`}
      >
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
          <a href="#accueil" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
            <img src="/Logo-OCP_header.svg" alt="OCP" className="h-8 w-auto" />
            <span className="hidden text-sm font-semibold uppercase text-[var(--nav-muted)] transition-colors sm:inline">Stock</span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {t.nav.map((item) => (
              <a key={item.href} href={item.href} className="nav-link-animated">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--nav-border)] px-3 text-sm font-semibold text-[var(--nav-fg)] transition hover:bg-[var(--nav-soft-bg)]"
              aria-label={`Changer la langue vers ${t.langSwitch}`}
            >
              <Languages size={17} aria-hidden="true" />
              {t.langSwitch}
            </button>
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--nav-border)] bg-[var(--nav-icon-bg)] text-[var(--nav-fg)] transition duration-300 hover:-translate-y-0.5 hover:border-[#0d6b4d]/45 hover:bg-[var(--nav-soft-bg)] hover:text-[#0d6b4d] hover:shadow-[0_14px_34px_rgba(16,43,32,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d6b4d]"
              aria-label={lang === "fr" ? "Connexion" : "Login"}
              title={lang === "fr" ? "Connexion" : "Login"}
            >
              <UserRound size={20} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <a
              href="#stock"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nav-border)] text-[var(--nav-fg)] transition hover:bg-[var(--nav-soft-bg)]"
              aria-label="Rechercher"
            >
              <Search size={18} aria-hidden="true" />
            </a>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--nav-border)] text-[var(--nav-fg)] lg:hidden"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </nav>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/12 bg-[#082b1f] px-4 py-4 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-2">
              {t.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="mobile-nav-link-animated rounded-md px-2 py-3 text-sm font-semibold text-white/86"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={toggleLanguage}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/22 text-sm font-semibold text-white"
              >
                <Languages size={17} aria-hidden="true" />
                {t.langSwitch}
              </button>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/22 text-sm font-semibold text-white transition hover:border-[#d6ec55]/70 hover:bg-[#d6ec55]/12"
              >
                <UserRound size={18} strokeWidth={1.9} aria-hidden="true" />
                {lang === "fr" ? "Connexion" : "Login"}
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {isAuthModalOpen && (
        <AuthModal
          lang={lang}
          mode={authMode}
          message={authMessage}
          onModeChange={setAuthMode}
          onClose={closeAuth}
          onLoginSubmit={handleLoginSubmit}
          onSignupSubmit={handleSignupSubmit}
          onForgotPassword={() =>
            setAuthMessage(
              lang === "fr"
                ? "La récupération du mot de passe sera connectée lors de la prochaine étape."
                : "Password recovery will be connected in the next step."
            )
          }
        />
      )}

      <main>
        <section id="accueil" className="relative flex min-h-[92svh] items-center overflow-hidden bg-[#06291d] pt-16 text-white">
          <HeroSlideshow reduced={Boolean(prefersReducedMotion)} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,33,23,0.92),rgba(5,33,23,0.58),rgba(5,33,23,0.18))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,33,23,0.42),transparent_28%,rgba(5,33,23,0.55))]" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={transition} className="max-w-4xl">
              <span className="flex items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#d6ec55]/90">
                <span className="h-px w-10 bg-[#d6ec55]/70" />
                {lang === "fr" ? "Phosphate · Logistique · Terrain" : "Phosphate · Logistics · Field"}
              </span>
              <h1 className="font-display mt-8 max-w-4xl text-[2.6rem] font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.4rem]">
                {t.hero.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
                {t.hero.text}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#stock"
                  onClick={handleDiscoverSolutionClick}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#b7d534] px-7 text-sm font-bold text-[#0b241a] shadow-[0_18px_50px_rgba(183,213,52,0.28)] transition hover:bg-[#d6ec55]"
                >
                  {t.hero.primary}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a
                  href="#reseau"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/12"
                >
                  {t.hero.secondary}
                  <MapPin size={18} aria-hidden="true" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ ...transition, delay: prefersReducedMotion ? 0 : 0.28 }}
              className="mt-14 grid max-w-4xl gap-x-8 gap-y-4 border-t border-white/25 pt-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {t.hero.tabs.map((tab) => (
                <div key={tab} className="text-sm font-semibold tracking-wide text-white/85">
                  {tab}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <StockPipeline lang={lang} t={t.stock} reduced={Boolean(prefersReducedMotion)} />

        <PortHistorySection lang={lang} t={t.about} reduced={Boolean(prefersReducedMotion)} />

        <PortGalleryStackSection lang={lang} reduced={Boolean(prefersReducedMotion)} />

        <section id="partenaires-strategiques" className="overflow-hidden bg-[#f6f7ef] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={fadeUp}
              transition={transition}
              className="max-w-3xl"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">{t.partners.eyebrow}</p>
              <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-[#102b20] sm:text-[2.7rem]">
                {t.partners.title}
              </h2>
              <p className="mt-5 text-base leading-8 text-[#5e7166]">{t.partners.text}</p>
            </motion.div>
          </div>

          <StrategicPartnersMarquee />
        </section>

        <section id="reseau" className="relative overflow-hidden bg-[#073e2b] py-20 text-white sm:py-24">
          <img src="/map-background.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-[#073e2b]/30" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={fadeUp}
              transition={transition}
              className="self-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6ec55]">{t.map.eyebrow}</p>
              <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight sm:text-[2.9rem]">{t.map.title}</h2>
              <p className="mt-5 text-base leading-8 text-white/76">{t.map.text}</p>
              <div className="mt-8 grid gap-4">
                {t.map.legend.map((item, index) => (
                  <div key={item} className="flex items-center gap-4 text-sm font-semibold text-white/88">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/28 bg-white/8">
                      {index === 0 && <Factory size={18} aria-hidden="true" />}
                      {index === 1 && <Building2 size={18} aria-hidden="true" />}
                      {index === 2 && <Warehouse size={18} aria-hidden="true" />}
                      {index === 3 && <Truck size={18} aria-hidden="true" />}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={transition}
              className="relative min-h-[520px]"
            >
              <motion.img
                src="/Morocco-Map_EN_HP.png"
                alt="Carte du Maroc avec sites phosphate OCP"
                className="absolute left-1/2 top-1/2 h-[520px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain sm:h-[620px]"
                animate={prefersReducedMotion ? undefined : { y: ["-50%", "-52%", "-50%"] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute bottom-3 right-3 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold text-white/75 backdrop-blur-md">
                Sources: USGS, IFDC, KPMG
              </div>
            </motion.div>
          </div>
        </section>

        <section id="contact" className="bg-[#f6f7ef] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={fadeUp}
              transition={transition}
              className="self-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">{t.contact.eyebrow}</p>
              <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-[#102b20] sm:text-[2.9rem]">{t.contact.title}</h2>
              <p className="mt-5 text-base leading-8 text-[#5e7166]">{t.contact.text}</p>
              <div className="mt-8 grid gap-4 text-sm font-semibold text-[#314238]">
                <a className="flex items-center gap-3" href="mailto:contact@ocpstock.ma">
                  <Mail className="text-[#0d6b4d]" size={20} aria-hidden="true" />
                  contact@ocpstock.ma
                </a>
                <a className="flex items-center gap-3" href="tel:+212500000000">
                  <PhoneCall className="text-[#0d6b4d]" size={20} aria-hidden="true" />
                  +212 5 00 00 00 00
                </a>
                <p className="flex items-center gap-3">
                  <MapPin className="text-[#0d6b4d]" size={20} aria-hidden="true" />
                  Casablanca, Maroc
                </p>
              </div>
            </motion.div>

            <motion.form
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              transition={transition}
              className="rounded-lg border border-[#dfe6d7] bg-white p-6 shadow-[0_22px_70px_rgba(16,43,32,0.10)] sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  {t.contact.name}
                  <input className="h-12 rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-4 font-normal outline-none transition focus:border-[#0d6b4d] focus:bg-white" placeholder={lang === "fr" ? "Votre nom" : "Your name"} />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  {t.contact.email}
                  <input type="email" className="h-12 rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-4 font-normal outline-none transition focus:border-[#0d6b4d] focus:bg-white" placeholder="vous@ocpgroup.ma" />
                </label>
              </div>
              <label className="mt-5 grid gap-2 text-sm font-bold text-[#314238]">
                {t.contact.message}
                <textarea className="min-h-36 rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-4 py-3 font-normal outline-none transition focus:border-[#0d6b4d] focus:bg-white" placeholder={t.contact.placeholder} />
              </label>
              <button
                type="button"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0d6b4d] px-6 text-sm font-bold text-white transition hover:bg-[#0a563d] sm:w-auto"
              >
                {t.contact.button}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </motion.form>
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} nav={t.nav} />
    </div>
  );
}

function AuthModal({
  lang,
  mode,
  message,
  onModeChange,
  onClose,
  onLoginSubmit,
  onSignupSubmit,
  onForgotPassword
}: {
  lang: Lang;
  mode: AuthMode;
  message: string;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSignupSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}) {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedFiliale, setSelectedFiliale] = useState("");
  const isLogin = mode === "login";

  const inputClass =
    "h-12 w-full rounded-full border border-[#dfe6d7] bg-white px-11 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
  const selectClass =
    "h-12 w-full rounded-full border border-[#dfe6d7] bg-white px-4 text-sm font-semibold text-[#102b20] outline-none transition focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#061d15]/70 px-4 py-6 backdrop-blur-sm sm:py-8" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative mx-auto grid min-h-[min(840px,calc(100svh-48px))] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-[0_34px_110px_rgba(0,0,0,0.32)] lg:grid-cols-[0.95fr_1.05fr]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-[#082b1f]/55 text-white backdrop-blur-md transition hover:bg-[#082b1f]"
          aria-label={lang === "fr" ? "Fermer" : "Close"}
        >
          <X size={19} aria-hidden="true" />
        </button>

        <aside className="relative min-h-[260px] overflow-hidden bg-[#0a3d2b] lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(214,236,85,0.28),transparent_30%),linear-gradient(135deg,#0a3d2b,#061d15_58%,#102b20)]" />
          <motion.img
            key={mode}
            src="/hero-warehouse.png"
            alt=""
            className={
              isLogin
                ? "absolute inset-0 h-full w-full object-cover opacity-78 [object-position:0%_50%]"
                : "absolute inset-0 h-full w-full object-cover opacity-72 [object-position:58%_50%]"
            }
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,29,21,0.10),rgba(6,29,21,0.90))]" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6ec55]">OCP Stock</p>
            <h2 className="font-display mt-3 max-w-md text-3xl font-medium leading-tight sm:text-4xl">
              {lang === "fr" ? "Accès sécurisé à OCP Stock." : "Secure access to OCP Stock."}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/74">
              {lang === "fr"
                ? "Identifiez-vous avec votre email ou matricule pour accéder aux flux, alertes et tableaux de bord."
                : "Sign in with your email or employee ID to access flows, alerts and dashboards."}
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[520px]">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 inline-flex rounded-full border border-[#dfe6d7] bg-[#f6f7ef] p-1">
                <button
                  type="button"
                  onClick={() => onModeChange("login")}
                  className={`h-10 rounded-full px-5 text-sm font-bold transition ${
                    isLogin ? "bg-[#0d6b4d] text-white shadow-[0_10px_24px_rgba(13,107,77,0.18)]" : "text-[#5e7166] hover:text-[#102b20]"
                  }`}
                >
                  {lang === "fr" ? "Connexion" : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("signup")}
                  className={`h-10 rounded-full px-5 text-sm font-bold transition ${
                    !isLogin ? "bg-[#0d6b4d] text-white shadow-[0_10px_24px_rgba(13,107,77,0.18)]" : "text-[#5e7166] hover:text-[#102b20]"
                  }`}
                >
                  {lang === "fr" ? "Inscription" : "Sign up"}
                </button>
              </div>

              <h2 className="font-display text-4xl font-medium tracking-tight text-[#102b20]">
                {isLogin ? (lang === "fr" ? "Se connecter" : "Sign in") : lang === "fr" ? "Créer un compte" : "Create account"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#6c7c71]">
                {isLogin
                  ? lang === "fr"
                    ? "Email ou matricule, puis mot de passe."
                    : "Email or employee ID, then password."
                  : lang === "fr"
                    ? "Renseignez vos informations professionnelles."
                    : "Enter your professional information."}
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-lg border border-[#d6ec55]/50 bg-[#f5fadf] px-4 py-3 text-sm font-semibold leading-6 text-[#37531c]">
                {message}
              </div>
            )}

            {isLogin ? (
              <form className="grid gap-5" onSubmit={onLoginSubmit}>
                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  {lang === "fr" ? "Email ou matricule" : "Email or employee ID"}
                  <span className="relative">
                    <AtSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                    <input required name="identifiant" autoComplete="username" className={inputClass} placeholder={lang === "fr" ? "email@ocpgroup.ma ou matricule" : "email@ocpgroup.ma or ID"} />
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  {lang === "fr" ? "Mot de passe" : "Password"}
                  <span className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                    <input required name="motdepasse" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" className={inputClass} placeholder="••••••••" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#829187] transition hover:text-[#0d6b4d]"
                      aria-label={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showLoginPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 font-semibold text-[#5e7166]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#b8c6bc] accent-[#0d6b4d]" />
                    {lang === "fr" ? "Se souvenir de moi" : "Remember me"}
                  </label>
                  <button type="button" onClick={onForgotPassword} className="font-bold text-[#0d6b4d] underline-offset-4 transition hover:underline">
                    {lang === "fr" ? "Mot de passe oublié ?" : "Forgot password?"}
                  </button>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0d6b4d] px-6 text-sm font-bold text-white shadow-[0_18px_42px_rgba(13,107,77,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0a563d]"
                >
                  <LogIn size={18} aria-hidden="true" />
                  {lang === "fr" ? "Se connecter" : "Sign in"}
                </button>

                <p className="text-center text-sm font-semibold text-[#6c7c71]">
                  {lang === "fr" ? "Tu n'as pas un compte ?" : "Do not have an account?"}{" "}
                  <button type="button" onClick={() => onModeChange("signup")} className="font-bold text-[#0d6b4d]">
                    {lang === "fr" ? "S'enregistrer" : "Sign up"}
                  </button>
                </p>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={onSignupSubmit}>
                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  Nom complet
                  <span className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                    <input required name="fullName" className={inputClass} placeholder="Prénom et nom" />
                  </span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-[#314238]">
                    Matricule
                    <span className="relative">
                      <IdCard className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                      <input required name="matricule" className={inputClass} placeholder="OCP-0000" />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-[#314238]">
                    Email
                    <span className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                      <input required name="email" type="email" className={inputClass} placeholder="vous@ocpgroup.ma" />
                    </span>
                  </label>
                </div>

                <div className="grid gap-4">
                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-bold text-[#314238]">Filiale</legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {filialeOptions.map((option) => (
                        <label
                          key={option.name}
                          className={`relative flex min-h-[76px] cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#0d6b4d] hover:shadow-[0_16px_34px_rgba(16,43,32,0.10)] ${
                            selectedFiliale === option.name
                              ? "border-[#0d6b4d] shadow-[0_0_0_4px_rgba(13,107,77,0.10)]"
                              : "border-[#dfe6d7]"
                          }`}
                        >
                          <input
                            required
                            type="radio"
                            name="filiale"
                            value={option.name}
                            checked={selectedFiliale === option.name}
                            onChange={() => setSelectedFiliale(option.name)}
                            className="sr-only"
                          />
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#edf2e8] bg-[#f8faf7] p-1.5">
                            <img src={option.logoSrc} alt="" className="max-h-8 max-w-8 object-contain" />
                          </span>
                          <span className="text-sm font-black text-[#102b20]">{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="grid gap-2 text-sm font-bold text-[#314238]">
                    Fonction
                    <span className="relative">
                      <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                      <select required name="fonction" className={`${selectClass} pl-11`}>
                        <option value="">Sélectionner</option>
                        {functionOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </span>
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-bold text-[#314238]">
                  Département
                  <select required name="departement" className={selectClass}>
                    <option value="">Sélectionner le département</option>
                    {departmentOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-[#314238]">
                    Mot de passe
                    <span className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                      <input required name="motdepasse" type={showSignupPassword ? "text" : "password"} autoComplete="new-password" className={inputClass} placeholder="••••••••" />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-[#314238]">
                    Confirmer
                    <span className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={18} aria-hidden="true" />
                      <input required name="confirmation" type={showSignupPassword ? "text" : "password"} autoComplete="new-password" className={inputClass} placeholder="••••••••" />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#829187] transition hover:text-[#0d6b4d]"
                        aria-label={showSignupPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showSignupPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0d6b4d] px-6 text-sm font-bold text-white shadow-[0_18px_42px_rgba(13,107,77,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0a563d]"
                >
                  <UserPlus size={18} aria-hidden="true" />
                  {lang === "fr" ? "Créer le compte" : "Create account"}
                </button>

                <p className="text-center text-sm font-semibold text-[#6c7c71]">
                  {lang === "fr" ? "Tu as déjà un compte ?" : "Already have an account?"}{" "}
                  <button type="button" onClick={() => onModeChange("login")} className="font-bold text-[#0d6b4d]">
                    {lang === "fr" ? "Se connecter" : "Sign in"}
                  </button>
                </p>
              </form>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function StrategicPartnersMarquee() {
  const marqueeItems = [...strategicPartners, ...strategicPartners];

  return (
    <div className="partner-marquee mt-10" aria-label="Partenaires stratégiques OCP">
      <div className="partner-marquee-track flex w-max gap-4 px-4 sm:px-6 lg:px-8" role="list">
        {marqueeItems.map((partner, index) => (
          <article
            key={`${partner.name}-${index}`}
            className="group flex h-[138px] w-[260px] shrink-0 flex-col justify-between rounded-lg border border-[#dfe6d7] bg-white p-4 shadow-[0_16px_42px_rgba(16,43,32,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#b7d534] hover:shadow-[0_22px_56px_rgba(16,43,32,0.14)]"
            role="listitem"
            aria-hidden={index >= strategicPartners.length}
          >
            <div className="flex h-20 items-center justify-center rounded-md bg-[#f8faf7] px-4">
              {partner.logoSrc ? (
                <img
                  src={partner.logoSrc}
                  alt={partner.name}
                  loading="lazy"
                  className="max-h-14 max-w-[190px] object-contain transition duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-black text-white shadow-[0_10px_24px_rgba(16,43,32,0.16)]"
                    style={{ backgroundColor: partner.color }}
                  >
                    {partner.initials}
                  </span>
                  <p className="break-words text-[0.92rem] font-black uppercase leading-tight" style={{ color: partner.color }}>
                    {partner.wordmark}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="h-1.5 w-16 rounded-full transition-all duration-300 group-hover:w-24" style={{ backgroundColor: partner.accent }} />
              <span className="truncate text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#829187]">{partner.descriptor}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HeroSlideshow({ reduced }: { reduced: boolean }) {
  const [active, setActive] = useState(0);
  const slideDuration = 5.2;

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length);
    }, slideDuration * 1000);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#05211a]">
      {heroSlides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-in-out ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.src}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            className="hero-slide-img h-full w-full object-cover"
            style={{ transformOrigin: slide.origin }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_42%,rgba(4,26,20,0.6))]" />

      <div className="absolute bottom-6 left-4 z-10 flex gap-2 sm:left-6 lg:left-8">
        {heroSlides.map((slide, index) => (
          <span key={slide.src} className="h-[3px] w-10 overflow-hidden rounded-full bg-white/25">
            {index === active &&
              (reduced ? (
                <span className="block h-full w-full rounded-full bg-[#d6ec55]" />
              ) : (
                <motion.span
                  key={active}
                  className="block h-full rounded-full bg-[#d6ec55]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: slideDuration, ease: "linear" }}
                />
              ))}
          </span>
        ))}
      </div>
    </div>
  );
}

const PORT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Section "Port Casablanca" : chorégraphie éditoriale liée au scroll.
// Le titre se révèle mot à mot, l'image s'ouvre en clip-path avec contre-zoom,
// puis photo et légende dérivent en parallaxe à deux vitesses pendant le scroll.
function PortHistorySection({ lang, t, reduced }: { lang: Lang; t: (typeof content)["fr"]["about"]; reduced: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  // L'image est plus haute que son cadre (-inset-y-[7%]) : ±5% de dérive reste couvert.
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], [22, -30]);

  const textGroup = {
    hidden: {},
    visible: { transition: reduced ? undefined : { staggerChildren: 0.11, delayChildren: 0.05 } }
  };
  const rise = {
    hidden: { opacity: 0, y: reduced ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.7, ease: PORT_EASE } }
  };
  const lineGrow = {
    hidden: { scaleX: reduced ? 1 : 0 },
    visible: { scaleX: 1, transition: { duration: reduced ? 0 : 0.8, ease: PORT_EASE } }
  };
  const titleGroup = {
    hidden: {},
    visible: { transition: reduced ? undefined : { staggerChildren: 0.045 } }
  };
  const wordRise = {
    hidden: { y: reduced ? "0%" : "118%" },
    visible: { y: "0%", transition: { duration: reduced ? 0 : 0.68, ease: PORT_EASE } }
  };
  const bulletGroup = {
    hidden: {},
    visible: { transition: reduced ? undefined : { staggerChildren: 0.09 } }
  };
  const frameReveal = {
    hidden: { clipPath: reduced ? "inset(0% 0% 0% 0% round 0.5rem)" : "inset(12% 8% 12% 8% round 0.75rem)" },
    visible: { clipPath: "inset(0% 0% 0% 0% round 0.5rem)", transition: { duration: reduced ? 0 : 1.05, ease: PORT_EASE } }
  };
  const imageZoom = {
    hidden: { scale: reduced ? 1 : 1.14 },
    visible: { scale: 1, transition: { duration: reduced ? 0 : 1.35, ease: PORT_EASE } }
  };
  const cardRise = {
    hidden: { opacity: 0, y: reduced ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.7, ease: PORT_EASE, delay: reduced ? 0 : 0.4 } }
  };

  const titleWords = t.title.split(" ");

  return (
    <section id="port-casablanca" ref={sectionRef} className="overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={textGroup}
          className="self-center"
        >
          <motion.p variants={rise} className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">
            <motion.span variants={lineGrow} className="h-px w-10 origin-left bg-[#0d6b4d]/70" aria-hidden="true" />
            {t.eyebrow}
          </motion.p>
          <motion.h2
            variants={titleGroup}
            className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-[#102b20] sm:text-[2.9rem]"
          >
            <span className="sr-only">{t.title}</span>
            {titleWords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                aria-hidden="true"
                className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top"
              >
                <motion.span variants={wordRise} className="inline-block will-change-transform">
                  {index < titleWords.length - 1 ? `${word} ` : word}
                </motion.span>
              </span>
            ))}
          </motion.h2>
          <motion.p variants={rise} className="mt-5 text-base leading-8 text-[#5e7166]">
            {t.text}
          </motion.p>
          <motion.div variants={bulletGroup} className="mt-8 grid gap-4">
            {t.bullets.map((bullet) => (
              <motion.div key={bullet} variants={rise} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 shrink-0 text-[#0d6b4d]" size={20} aria-hidden="true" />
                <p className="text-sm font-semibold leading-7 text-[#314238]">{bullet}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={frameReveal}
          className="relative min-h-[460px] overflow-hidden rounded-lg bg-[#0a3d2b]"
        >
          <motion.div style={reduced ? undefined : { y: imageY }} className="absolute -inset-y-[7%] inset-x-0">
            <motion.img
              variants={imageZoom}
              src="/port.jpg"
              alt={lang === "fr" ? "Port de Casablanca" : "Casablanca Port"}
              className="h-full w-full object-cover opacity-[0.86]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,61,43,0.04),rgba(10,61,43,0.84))]" />
          <motion.div style={reduced ? undefined : { y: cardY }} className="absolute bottom-6 left-6 right-6">
            <motion.div variants={cardRise} className="rounded-lg border border-white/20 bg-[#082b1f]/76 p-5 text-white backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6ec55]">
                {lang === "fr" ? "Port Casablanca" : "Casablanca Port"}
              </p>
              <p className="font-display mt-3 text-2xl font-medium leading-snug">
                {lang === "fr" ? "Le premier couloir d'export du phosphate marocain." : "The first export corridor for Moroccan phosphate."}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PortGalleryStackSection({ lang, reduced }: { lang: Lang; reduced: boolean }) {
  const copy =
    lang === "fr"
      ? {
          eyebrow: "Port Casablanca en images",
          title: "Inside OCP Casa Port",
          text: "Une lecture visuelle des étapes qui structurent le passage du stock, de l'arrivée au quai jusqu'au chargement export."
        }
      : {
          eyebrow: "Casablanca Port in images",
          title: "Inside OCP Casa Port",
          text: "A visual reading of the steps that structure stock movement, from quay arrival to export loading."
        };

  const cardContent = (card: (typeof portStackCards)[number], index: number) => {
    const item = card[lang];

    return (
      <article className="grid min-h-[440px] bg-white lg:min-h-[500px] lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative min-h-[260px] overflow-hidden bg-[#0a3d2b] lg:min-h-[500px]">
          <img
            src={card.image}
            alt={`${item.title} ${item.label}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,40,29,0.12),rgba(7,40,29,0.54))]" />
        </div>

        <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0d6b4d]">{item.label}</p>
            <h3 className="font-display mt-4 max-w-md text-3xl font-medium leading-tight tracking-tight text-[#102b20] sm:text-[2.35rem]">
              {item.title}
            </h3>
            <p className="mt-5 max-w-md text-base leading-8 text-[#5e7166]">{item.text}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf2e8]">
            <span className="block h-full rounded-full bg-[#0d6b4d]" style={{ width: `${((index + 1) / portStackCards.length) * 100}%` }} />
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="overflow-hidden bg-[#f6f7ef] pt-20 pb-10 sm:pt-24 sm:pb-12" aria-label={copy.eyebrow}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: PORT_EASE }}
          className="max-w-3xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">{copy.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-[#102b20] sm:text-[2.7rem]">
            {copy.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[#5e7166]">{copy.text}</p>
        </motion.div>

        {reduced ? (
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {portStackCards.map((card, index) => (
              <div key={card.image} className="overflow-hidden rounded-lg border border-[#dfe6d7] bg-white">
                {cardContent(card, index)}
              </div>
            ))}
          </div>
        ) : (
          <ScrollStack
            useWindowScroll
            itemDistance={118}
            itemScale={0.026}
            itemStackDistance={34}
            baseScale={0.88}
            blurAmount={0.25}
            className="mt-[-2vh]"
          >
            {portStackCards.map((card, index) => (
              <ScrollStackItem key={card.image} itemClassName="min-h-[440px] lg:min-h-[500px]">
                {cardContent(card, index)}
              </ScrollStackItem>
            ))}
          </ScrollStack>
        )}
      </div>
    </section>
  );
}

function StockPipeline({ lang, t, reduced }: { lang: Lang; t: (typeof content)["fr"]["stock"]; reduced: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const transition = reduced ? { duration: 0 } : { duration: 0.7, ease: "easeOut" as const };

  // Progression du scroll dans la section (0 → 1) : écouteurs scroll/resize
  // throttlés par rAF, avec un intervalle de secours pour les environnements
  // où ces événements sont suspendus (onglet caché, aperçu...).
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = Math.min(1, Math.max(0, (window.innerHeight * 0.62 - rect.top) / rect.height));
      setProgress((current) => (Math.abs(current - next) < 0.002 ? current : next));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const fallback = window.setInterval(measure, 300);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearInterval(fallback);
    };
  }, []);

  const active = Math.min(2, Math.max(0, Math.floor(progress * 3)));

  const stages = [
    {
      src: "/pipeline-train.webp",
      position: "50% 62%",
      alt: lang === "fr" ? "Train de phosphate venant de Khouribga" : "Phosphate train arriving from Khouribga",
      step: lang === "fr" ? "Entrée" : "Inbound",
      label: lang === "fr" ? "Train de Khouribga" : "Train from Khouribga",
      caption:
        lang === "fr"
          ? "Chaque wagon reçu est enregistré à l’instant : article, lot, emplacement."
          : "Every received wagon is registered instantly: item, batch, location."
    },
    {
      src: "/portman.jpeg",
      position: "50% 50%",
      alt: lang === "fr" ? "Parc de stockage du port de Casablanca" : "Casablanca port storage yard",
      step: lang === "fr" ? "Stockage" : "Storage",
      label: lang === "fr" ? "Parc du port de Casablanca" : "Casablanca port stockyard",
      caption:
        lang === "fr"
          ? "Niveaux et seuils surveillés en continu, du déchargement au hangar."
          : "Levels and thresholds monitored continuously, from unloading to hangar."
    },
    {
      src: "/navire.png",
      position: "50% 42%",
      alt: lang === "fr" ? "Chargement d’un navire au quai" : "Vessel loading at the quay",
      step: lang === "fr" ? "Sortie" : "Outbound",
      label: lang === "fr" ? "Chargement navire" : "Vessel loading",
      caption:
        lang === "fr"
          ? "Chaque tonne expédiée reste reliée à son lot, son quai et son navire."
          : "Every shipped ton stays linked to its batch, wharf and vessel."
    }
  ];

  return (
    <section id="stock" className="bg-[#f6f7ef] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          transition={transition}
          className="max-w-3xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">{t.eyebrow}</p>
          <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-[#102b20] sm:text-[2.9rem]">
            {t.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5e7166]">{t.text}</p>
        </motion.div>

        <div ref={trackRef} className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          {/* Visuel épinglé : les images du pipeline se fondent au scroll */}
          <div className="lg:order-2">
            <div className="lg:sticky lg:top-24">
              <motion.figure
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                transition={transition}
                className="relative overflow-hidden rounded-2xl bg-[#04150f] shadow-[0_40px_90px_rgba(16,43,32,0.30)]"
              >
                <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[4/5]">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.src}
                      className={`absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-in-out ${
                        active === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
                      } ${reduced ? "!transition-none" : ""}`}
                    >
                      <img
                        src={stage.src}
                        alt={stage.alt}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="h-full w-full scale-110 object-cover"
                        style={{
                          objectPosition: stage.position,
                          transform: reduced ? undefined : `translateY(${(progress - 0.5) * 7}%) scale(1.1)`
                        }}
                      />
                    </div>
                  ))}

                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,21,15,0.30),transparent_32%,rgba(4,21,15,0.90))]" />

                  {/* Indicateur d'étapes */}
                  <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
                    {stages.map((stage, index) => (
                      <span
                        key={stage.src}
                        className={
                          "h-1.5 rounded-full transition-all duration-500 " +
                          (active === index ? "w-8 bg-[#d6ec55]" : "w-3 bg-white/30")
                        }
                      />
                    ))}
                  </div>
                  <span className="absolute right-5 top-5 z-10 rounded-full border border-white/20 bg-[#04150f]/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
                    0{active + 1} / 03
                  </span>

                  {/* Légende de l'étape active */}
                  <figcaption className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-7">
                    <div key={active} className="caption-swap">
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#d6ec55]">
                        {stages[active].step} — {stages[active].label}
                      </span>
                      <p className="font-display mt-3 max-w-md text-2xl font-medium leading-snug sm:text-3xl">
                        {stages[active].caption}
                      </p>
                    </div>
                  </figcaption>
                </div>
              </motion.figure>
            </div>
          </div>

          {/* Étapes du pipeline reliées aux fonctionnalités */}
          <div className="relative lg:order-1">
            <span aria-hidden="true" className="absolute bottom-10 left-[23px] top-4 w-px bg-[#d8e0d0]" />
            <span
              aria-hidden="true"
              className="absolute bottom-10 left-[23px] top-4 w-px origin-top bg-[#0d6b4d]"
              style={{ transform: `scaleY(${reduced ? 1 : progress})` }}
            />

            {stages.map((stage, index) => {
              const Icon = solutionIcons[index];
              const card = t.cards[index];
              const isActive = active === index;
              return (
                <motion.article
                  key={card.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp}
                  transition={{ ...transition, delay: reduced ? 0 : index * 0.06 }}
                  className="relative flex gap-6 pb-14 last:pb-0 lg:min-h-[46vh] lg:items-center lg:pb-0"
                >
                  <div
                    className={
                      "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-full border-2 transition-colors duration-500 lg:self-center " +
                      (isActive
                        ? "border-[#0d6b4d] bg-[#0d6b4d] text-white"
                        : "border-[#d8e0d0] bg-[#f6f7ef] text-[#5e7166]")
                    }
                  >
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div
                    className={
                      "rounded-xl border p-6 transition-all duration-500 sm:p-7 " +
                      (isActive
                        ? "border-[#0d6b4d]/25 bg-white shadow-[0_24px_70px_rgba(16,43,32,0.12)]"
                        : "border-transparent bg-transparent")
                    }
                  >
                    <p
                      className={
                        "text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 " +
                        (isActive ? "text-[#0d6b4d]" : "text-[#8a9a90]")
                      }
                    >
                      0{index + 1} · {stage.step} — {stage.label}
                    </p>
                    <h3
                      className={
                        "font-display mt-3 text-2xl font-medium leading-snug transition-colors duration-500 sm:text-[1.7rem] " +
                        (isActive ? "text-[#102b20]" : "text-[#7d8d83]")
                      }
                    >
                      {card.title}
                    </h3>
                    <p
                      className={
                        "mt-3 text-sm leading-7 transition-colors duration-500 sm:text-base sm:leading-8 " +
                        (isActive ? "text-[#5e7166]" : "text-[#93a399]")
                      }
                    >
                      {card.text}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
