import React from "react";

export function SettingsEmbeddedFilters({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="settings-embedded-page__filters">{children}</div>;
}

export function SettingsEmbeddedFilterField({
  id,
  label,
  children,
}: Readonly<{
  id: string;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="settings-embedded-page__filter-field" htmlFor={id}>
      <span className="settings-embedded-page__filter-label">{label}</span>
      {children}
    </label>
  );
}
