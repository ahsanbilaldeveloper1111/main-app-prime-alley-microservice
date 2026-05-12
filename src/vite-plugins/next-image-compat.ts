import type { Plugin } from "vite";

const ASSET_EXT_RE = /\.(png|jpe?g|svg|gif|webp|avif|ico|bmp)(\?.*)?$/i;
const DEFAULT_EXPORT_RE =
  /export\s+default\s+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/;

/**
 * Compatibility shim for Next.js-style static image imports.
 *
 * In Next.js, `import logo from "./logo.png"` produces an object shaped like
 * `{ src, width, height, blurDataURL }`. Vite's default behavior is to return
 * a plain URL string, which breaks ~50 components in this repo that read
 * `logo.src` directly. This plugin runs after the default asset transform and
 * rewrites the `export default "<url>"` payload into a Next-compatible
 * object literal so existing call sites keep working without churn.
 */
export function nextImageCompatPlugin(): Plugin {
  return {
    name: "next-image-compat",
    enforce: "post",
    transform(code, id) {
      if (!ASSET_EXT_RE.test(id)) return null;
      const match = code.match(DEFAULT_EXPORT_RE);
      if (!match) return null;
      const [fullMatch, urlLiteral] = match;
      const replacement = `const __nextImageSrc = ${urlLiteral};\nexport default { src: __nextImageSrc, height: 0, width: 0, blurDataURL: __nextImageSrc, toString() { return __nextImageSrc; } };`;
      return {
        code: code.replace(fullMatch, replacement),
        map: null,
      };
    },
  };
}
