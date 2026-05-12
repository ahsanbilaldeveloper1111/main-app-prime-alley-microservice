/**
 * One-time migration: rename Next.js Pages Router entry files to *.page.*
 * so colocated modules under src/pages/ are not treated as routes.
 *
 * Run: node scripts/apply-next-page-extensions.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGES = path.join(ROOT, "src", "pages");

function norm(p) {
  return p.replaceAll("\\", "/");
}

const SKIP_API = new Set([norm(path.join(PAGES, "api", "auth", "authOptions.ts"))]);

const EXCLUDE_DIR = new Set(["components", "partials", "_partials", "hooks"]);

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function withPageExt(abs, ext) {
  const dir = path.dirname(abs);
  const base = path.basename(abs, ext);
  return path.join(dir, `${base}.page${ext}`);
}

function hasSiblingIndex(dir) {
  return (
    fs.existsSync(path.join(dir, "index.tsx")) ||
    fs.existsSync(path.join(dir, "index.ts")) ||
    fs.existsSync(path.join(dir, "index.page.tsx")) ||
    fs.existsSync(path.join(dir, "index.page.ts"))
  );
}

function pathHasExcludedDir(abs) {
  const parts = norm(abs).split("/");
  return parts.some((seg) => EXCLUDE_DIR.has(seg));
}

const files = walkFiles(PAGES);
const jobs = [];

for (const abs of files) {
  const n = norm(abs);
  if (n.includes("/api/")) {
    if (SKIP_API.has(n)) continue;
    for (const ext of [".ts", ".js"]) {
      if (abs.endsWith(ext) && !abs.endsWith(`.page${ext}`)) {
        jobs.push({ kind: "api", from: abs, ext });
      }
    }
    continue;
  }

  if (pathHasExcludedDir(abs)) continue;

  for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
    if (!abs.endsWith(ext) || abs.endsWith(`.page${ext}`)) continue;

    const bn = path.basename(abs);
    const dir = path.dirname(abs);
    const relDir = norm(dir);
    const isPagesRoot = relDir === norm(PAGES);

    if (bn === `index${ext}`) {
      jobs.push({ kind: "index", from: abs, ext });
      continue;
    }
    if (bn.startsWith("_app") || bn.startsWith("_document") || bn.startsWith("_error")) {
      jobs.push({ kind: "special", from: abs, ext });
      continue;
    }
    if (bn.startsWith("[") && bn.includes("]")) {
      jobs.push({ kind: "dynamic", from: abs, ext });
      continue;
    }
    if ((ext === ".tsx" || ext === ".ts") && isPagesRoot) {
      jobs.push({ kind: "root", from: abs, ext });
      continue;
    }
    if (ext === ".tsx" && bn !== `index${ext}` && !bn.startsWith("[") && !bn.startsWith("_")) {
      if (hasSiblingIndex(dir)) continue;
      jobs.push({ kind: "leaf", from: abs, ext });
    }
  }
}

for (const job of jobs) {
  const { from, ext } = job;
  const to = withPageExt(from, ext);
  if (fs.existsSync(to)) {
    console.error("Refusing overwrite, target exists:", norm(to));
    process.exit(1);
  }
}

for (const job of jobs) {
  const { from, ext, kind } = job;
  const to = withPageExt(from, ext);
  fs.renameSync(from, to);
  console.log(norm(from), "->", norm(to));

  if (kind === "index") {
    const shim = path.join(
      path.dirname(from),
      ext === ".tsx" || ext === ".ts" ? "index.ts" : "index.js",
    );
    if (ext === ".tsx" || ext === ".ts") {
      fs.writeFileSync(shim, `export { default } from "./index.page";\n`, "utf8");
      console.log("  +", norm(shim));
    } else {
      fs.writeFileSync(
        shim,
        `export { default } from "./index.page${ext}";\n`,
        "utf8",
      );
      console.log("  +", norm(shim));
    }
  } else if (kind === "root" || kind === "leaf") {
    const base = path.basename(from, ext);
    const shim = path.join(path.dirname(from), `${base}.ts`);
    fs.writeFileSync(shim, `export { default } from "./${base}.page";\n`, "utf8");
    console.log("  +", norm(shim));
  }
}

console.log("Done. Add pageExtensions to next.config.ts and run build.");
