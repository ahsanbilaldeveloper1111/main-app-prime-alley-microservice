/**
 * `next/dynamic` shim — backed by React.lazy + Suspense.
 *
 * `ssr: false` becomes a no-op (we're in a SPA). `loading` is rendered as the
 * Suspense fallback. Loaders that resolve to either a default export or a
 * named export (`.then(m => m.X)`) both work because we just hand the
 * pre-resolved value back.
 */

import { Suspense, lazy, type ComponentType, type ReactNode } from "react";

// Mirrors Next.js' own `Loader` shape: a single `Promise<T | { default: T }>`
// rather than a `Promise<T> | Promise<{ default: T }>`. The union-inside-Promise
// form is required for callers that pass generic components (TS infers
// `{ default: never }` otherwise).
type Loader<T extends ComponentType<any>> = () => Promise<
  T | { default: T }
>;

interface DynamicOptions {
  loading?: () => ReactNode;
  ssr?: boolean;
  suspense?: boolean;
}

function hasDefaultExport(value: unknown): value is { default: unknown } {
  return !!value && typeof value === "object" && "default" in value;
}

export default function dynamic<T extends ComponentType<any>>(
  loader: Loader<T>,
  options: DynamicOptions = {},
): ComponentType<React.ComponentProps<T>> {
  const Lazy = lazy(async () => {
    // The loader may resolve either to the component directly or to a module
    // namespace exposing it as `default`. Treating the awaited value as
    // `unknown` keeps both casts at the boundary explicit, mirroring Next.js'
    // own runtime contract.
    const resolved: unknown = await loader();
    if (hasDefaultExport(resolved)) {
      return resolved as { default: T };
    }
    return { default: resolved as T };
  });

  function Dynamic(props: React.ComponentProps<T>) {
    const fallback = options.loading ? options.loading() : null;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  }

  Dynamic.displayName = "Dynamic";
  return Dynamic as ComponentType<React.ComponentProps<T>>;
}
