import { UdallerLogo } from "@/components/ui/UdallerLogo";

type SovereignHeaderProps = {
  appName: string;
};

const navLinks = [
  { label: "UDALLER ONE", href: "https://udaller.one" },
  { label: "SCOPE SENTRY", href: "https://scope.udaller.one" },
  { label: "TRUE RATE", href: "https://rate.udaller.one" },
  { label: "TAX SHIELD", href: "https://tools.udaller.one" },
] as const;

export default function SovereignHeader({ appName }: SovereignHeaderProps) {
  return (
    <header
      className="bg-[#18181B] border-b border-gray-800 py-4 px-6"
      role="banner"
    >
      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="https://udaller.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 rounded"
          >
            <UdallerLogo className="h-8 w-auto" />
          </a>
          <span className="text-gray-600 shrink-0" aria-hidden>
            |
          </span>
          <span className="text-[#F4C430] font-semibold tracking-wide truncate">
            {appName}
          </span>
        </div>

        {/* Right: Suite Navigation (desktop) */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium tracking-wider">
          {navLinks.map(({ label, href }) => {
            const isActive =
              label.toLowerCase() === appName.toLowerCase();
            return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white transition-colors"
                }
              >
                {label}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
