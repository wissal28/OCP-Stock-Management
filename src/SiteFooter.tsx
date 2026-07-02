import type { ComponentType, SVGProps } from "react";

type Lang = "fr" | "en";
type SocialIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  href: string;
};

type SocialItem = {
  href: string;
  ariaLabel: string;
  tooltip: string;
  color: string;
  Icon: SocialIconComponent;
};

type SiteFooterProps = {
  lang?: Lang;
  nav?: NavItem[];
  homeHrefPrefix?: string;
};

const defaultNav: Record<Lang, NavItem[]> = {
  fr: [
    { label: "Accueil", href: "#accueil" },
    { label: "Gestion stock", href: "#stock" },
    { label: "Port Casablanca", href: "#port-casablanca" },
    { label: "Réseau", href: "#reseau" },
    { label: "Contact", href: "#contact" }
  ],
  en: [
    { label: "Home", href: "#accueil" },
    { label: "Stock control", href: "#stock" },
    { label: "Casablanca Port", href: "#port-casablanca" },
    { label: "Network", href: "#reseau" },
    { label: "Contact", href: "#contact" }
  ]
};

const socialItems: SocialItem[] = [
  {
    href: "https://www.facebook.com/OCPGroupINT",
    ariaLabel: "Facebook OCP Group",
    tooltip: "Facebook",
    color: "#1877f2",
    Icon: FacebookIcon
  },
  {
    href: "https://www.instagram.com/ocpgroup/",
    ariaLabel: "Instagram OCP Group",
    tooltip: "Instagram",
    color: "#e4405f",
    Icon: InstagramIcon
  },
  {
    href: "https://x.com/ocpgroup",
    ariaLabel: "X OCP Group",
    tooltip: "X",
    color: "#111111",
    Icon: XSocialIcon
  },
  {
    href: "https://ma.linkedin.com/company/ocpgroup",
    ariaLabel: "LinkedIn OCP Group",
    tooltip: "LinkedIn",
    color: "#0a66c2",
    Icon: LinkedinIcon
  },
  {
    href: "https://www.youtube.com/ocpchannel",
    ariaLabel: "YouTube OCP Group",
    tooltip: "YouTube",
    color: "#ff0000",
    Icon: YoutubeIcon
  }
];

export default function SiteFooter({ lang = "fr", nav = defaultNav[lang], homeHrefPrefix = "" }: SiteFooterProps) {
  const resolveHref = (href: string) => (homeHrefPrefix && href.startsWith("#") ? `${homeHrefPrefix}${href}` : href);
  const quickLinks = [
    ...nav.map((item) => ({ ...item, href: resolveHref(item.href) })),
    { label: lang === "fr" ? "Espace administrateur" : "Admin space", href: "/admin" }
  ];

  return (
    <footer className="relative overflow-visible bg-[#082b1f] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 pb-20 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <img src="/Logo-OCP_Footer.svg" alt="OCP" className="h-11 w-auto" />
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/68">
            {lang === "fr"
              ? "Pilotage digital des stocks, des flux logistiques et des operations terrain."
              : "Digital monitoring for stock, logistics flows and field operations."}
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 lg:items-end">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6ec55]">
            {lang === "fr" ? "Reseaux sociaux" : "Social media"}
          </p>
          <SocialTooltip items={socialItems} />
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-xs font-semibold text-white/54 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>2026 OCP Stock Intelligence</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {quickLinks.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialTooltip({ items }: { items: SocialItem[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4" aria-label="OCP social media links">
      {items.map((item) => {
        const Icon = item.Icon;

        return (
          <li key={item.href} className="group relative">
            <a
              href={item.href}
              aria-label={item.ariaLabel}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-[#102b20] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ec55]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className="absolute bottom-0 left-0 h-0 w-full transition-all duration-300 ease-in-out group-hover:h-full group-focus-within:h-full"
                style={{ backgroundColor: item.color }}
              />
              <Icon className="relative z-10 h-7 w-7 transition-colors duration-300 ease-in-out group-hover:text-white group-focus-within:text-white" aria-hidden="true" />
            </a>
            <span
              className="pointer-events-none invisible absolute bottom-[-40px] left-1/2 z-20 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-300 ease-in-out group-hover:visible group-hover:bottom-[-50px] group-hover:opacity-100 group-focus-within:visible group-focus-within:bottom-[-50px] group-focus-within:opacity-100"
              style={{ backgroundColor: item.color }}
            >
              {item.tooltip}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.45-4.92 8.45-9.94Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7.8 2h8.4A5.81 5.81 0 0 1 22 7.8v8.4a5.81 5.81 0 0 1-5.8 5.8H7.8A5.81 5.81 0 0 1 2 16.2V7.8A5.81 5.81 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7.25A4.75 4.75 0 1 1 12 16.75 4.75 4.75 0 0 1 12 7.25Zm0 2A2.75 2.75 0 1 0 12 14.75 2.75 2.75 0 0 0 12 9.25Z" />
    </svg>
  );
}

function XSocialIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2h3.05l-6.66 7.62L23.12 22h-6.13l-4.8-6.28L6.7 22H3.65l7.12-8.14L3.25 2h6.28l4.34 5.73L18.9 2Zm-1.07 17.82h1.69L8.62 4.06H6.8l11.03 15.76Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.38 4.27 5.47v6.28ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.53V8.98H7.1v11.47ZM22.23 0H1.76C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0Z" />
    </svg>
  );
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.58 12 3.58 12 3.58s-7.5 0-9.38.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3 3 0 0 0 2.12-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  );
}
