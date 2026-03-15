import type { JSX } from "react";

export function IconLock(): JSX.Element {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.35" />
      <rect x="18" y="36" width="44" height="30" rx="5" fill="#F5C842" stroke="#2D3748" strokeWidth="2.2" />
      <rect x="24" y="41" width="32" height="20" rx="3" fill="#F7D96A" />
      <path d="M27 36V27C27 19.82 32.82 14 40 14s13 5.82 13 13v9" stroke="#2D3748" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="40" cy="51" r="5" fill="#2D3748" />
      <rect x="38" y="52" width="4" height="7" rx="1.5" fill="#2D3748" />
    </svg>
  );
}

export function IconKeys(): JSX.Element {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3" />
      <circle cx="30" cy="32" r="14" fill="#F5C842" stroke="#2D3748" strokeWidth="2.2" />
      <circle cx="30" cy="32" r="8" fill="#fff" stroke="#2D3748" strokeWidth="1.8" />
      <circle cx="30" cy="32" r="3.5" fill="#F5C842" stroke="#2D3748" strokeWidth="1.5" />
      <path d="M40 40l22 20" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 50l5-5" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M54 55l5-5" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 20l22 20" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}

export function IconRuler(): JSX.Element {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3" />
      <path d="M20 62L20 20L54 62Z" fill="#5B9BD5" stroke="#2D3748" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20 62L54 62" stroke="#2D3748" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 52h5M20 44h4M20 36h5M20 28h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="58" cy="30" r="7" fill="#F5C842" stroke="#2D3748" strokeWidth="1.8" />
      <path d="M55 30h6M58 27v6" stroke="#2D3748" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="62" cy="50" r="8" fill="#F7D96A" stroke="#2D3748" strokeWidth="1.8" />
      <path d="M60 48l4 4M64 48l-4 4" stroke="#2D3748" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconPencil(): JSX.Element {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3" />
      <path d="M44 14L62 32L34 60L16 60L16 42L44 14Z" fill="#F5E6A3" stroke="#2D3748" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M40 18L58 36" stroke="#2D3748" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <path d="M16 42L22 48L16 60Z" fill="#F5C842" stroke="#2D3748" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="55" y="10" width="12" height="8" rx="2" fill="#F48FB1" stroke="#2D3748" strokeWidth="1.8" transform="rotate(45 55 10)" />
      <path d="M50 15L58 23" stroke="#2D3748" strokeWidth="1.5" />
    </svg>
  );
}

export function MagnifyPlaceholder({ fontFamily }: Readonly<{ fontFamily: string }>): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", paddingTop: "16px" }}>
      <svg width="110" height="95" viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="55" cy="86" rx="38" ry="7" fill="#e5e7eb" />
        <path d="M18 66L55 86L92 66L55 46Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.2" />
        <path d="M18 66L55 76L92 66" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="72" y1="52" x2="86" y2="66" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
        <circle cx="56" cy="36" r="20" fill="none" stroke="#d1d5db" strokeWidth="4" />
        <circle cx="56" cy="36" r="14" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />
        <circle cx="50" cy="30" r="4" fill="#e5e7eb" opacity="0.7" />
        <path d="M56 26a8 8 0 0 1 5 3" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="78" y1="22" x2="82" y2="18" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="82" y1="28" x2="88" y2="26" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="79" y1="35" x2="85" y2="36" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontFamily, fontSize: "13px", fontWeight: 300, color: "#141414", margin: 0, textAlign: "center" }}>
        Choose a template to preview access.
      </p>
    </div>
  );
}

