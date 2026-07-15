import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Field & Signal home">
      <svg className="brand-mark" viewBox="0 0 44 44" role="img" aria-label="Field and Signal logo">
        <path d="M7 32.5V10.8h20.8" />
        <path d="M12 27.5V15.8h11" />
        <path d="M17 22.5v-1.7h1.7" />
        <path className="signal" d="M25.5 35.5c5.5-2.7 9-7.9 9-13.5s-3.5-10.8-9-13.5" />
        <path className="signal" d="M29.8 39c7.4-3.5 12.2-9.9 12.2-17S37.2 8.5 29.8 5" />
        <circle cx="18" cy="22" r="2.8" />
      </svg>
      {!compact && <span className="brand-name">Field <i>&</i> Signal</span>}
    </Link>
  );
}
