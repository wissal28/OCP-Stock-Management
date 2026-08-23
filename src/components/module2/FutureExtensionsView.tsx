import { Gauge, Radar } from "lucide-react";

// "Historique des arrêts" (fiche équipement du schéma), "Suivi temps réel" (statut Actif/En attente
// en direct) et "Maintenance" (module dédié) sont désormais livrés — retirés de cette liste.
// "Alertes" est couvert à l'échelle de l'app par la cloche de notifications (stock critique, HSE,
// retards, arrêts prolongés), mais une détection d'anomalie spécifique aux capteurs reste à construire.
const UPCOMING_FEATURES = [
  { label: "Capteurs", description: "Intégration des données de capteurs terrain (vitesse, charge, température).", Icon: Radar },
  { label: "Indicateurs de performance par circuit", description: "Tableaux de bord de disponibilité et de rendement, détaillés par circuit du synoptique.", Icon: Gauge }
];

export default function FutureExtensionsView() {
  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">À venir</p>
          <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Extensions futures du synoptique</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
            Ces fonctionnalités viendront enrichir le module Synoptique Manutention lors de prochaines étapes.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {UPCOMING_FEATURES.map(({ label, description, Icon }) => (
          <article
            key={label}
            className="relative overflow-hidden rounded-lg border border-dashed border-[#b8c6bc] bg-white/75 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.05)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#0d6b4d]/40"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe6d7] bg-[#f3f8d9] text-[#0d6b4d]">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="rounded-full border border-[#e3ecc2] bg-[#f3f8d9] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5c7a12]">
                Bientôt
              </span>
            </div>
            <h3 className="font-display mt-4 text-lg font-medium text-[#102b20]">{label}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6c7c71]">{description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
