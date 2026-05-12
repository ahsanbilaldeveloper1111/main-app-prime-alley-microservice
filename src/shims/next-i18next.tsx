/**
 * `next-i18next` shim — backed by react-i18next.
 *
 * The Next-specific HOCs become identity functions because the i18next
 * provider is mounted directly in `src/main.tsx`. Hooks and the `serverSideTranslations` helper get harmless stubs.
 */

import type { ComponentType } from "react";

export { useTranslation, Trans, withTranslation } from "react-i18next";

export function appWithTranslation<P>(Component: ComponentType<P>): ComponentType<P> {
  return Component;
}

export async function serverSideTranslations(
  _locale: string,
  _namespaces?: string[] | string,
): Promise<{ _nextI18Next?: unknown }> {
  // Translations are bundled and loaded synchronously on the client.
  return {};
}

export const i18n = undefined;
