/**
 * `next/font/google` shim. Next.js's font loader downloaded font files at
 * build time and returned a `{ className, style }` accessor; in this SPA we
 * fall back to whatever is loaded by the global stylesheet (or the system
 * default) and expose a no-op className.
 *
 * If you need optimized self-hosted webfonts later, drop the dependency in a
 * stylesheet rather than re-introducing this layer.
 */

interface FontOptions {
  subsets?: string[];
  weight?: string | string[];
  style?: string | string[];
  display?: string;
  variable?: string;
}

interface FontResult {
  className: string;
  style: { fontFamily: string };
  variable?: string;
}

function makeFont(_name: string) {
  return (_options?: FontOptions): FontResult => ({
    className: "",
    style: { fontFamily: "inherit" },
  });
}

export const Inter = makeFont("Inter");
export const Lexend_Deca = makeFont("Lexend_Deca");
export const Roboto = makeFont("Roboto");
export const Open_Sans = makeFont("Open_Sans");
export const Poppins = makeFont("Poppins");
export const Lato = makeFont("Lato");

const handler = {
  get: (_target: object, prop: string) => makeFont(prop),
};

const proxy = new Proxy({}, handler);

export default proxy;
