/**
 * One-off migration: renames and moves files under src/pages. Do not re-run on a dirty tree without review.
 * 1) Delete shim files (single-line re-export of *.page).
 * 2) Rename src/pages (recursive) .page.tsx|.page.ts|.page.jsx|.page.js -> drop ".page" from basename.
 * 3) Move colocated files from src/pages -> src/page-modules (components, partials, hooks, etc.).
 * 4) Move loose *.ts / *.tsx siblings next to index.tsx (non-route files).
 * 5) Rewrite imports: @pages/<rel> -> @page-modules/<rel> for each moved module path.
 *
 * Run: node scripts/revert-page-extensions-and-move-modules.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGES = path.join(ROOT, "src", "pages");
const PM = path.join(ROOT, "src", "page-modules");
const SRC = path.join(ROOT, "src");

const SHIM_RE = /^export\s*\{\s*default\s*\}\s*from\s*["']\.\/[^"']+["']\s*;?\s*$/;

function norm(p) {
  return p.replaceAll("\\", "/");
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function isShimFile(abs) {
  if (!abs.endsWith(".ts") && !abs.endsWith(".js")) return false;
  if (norm(abs).includes("/api/")) return false;
  let raw;
  try {
    raw = fs.readFileSync(abs, "utf8").trim();
  } catch {
    return false;
  }
  return SHIM_RE.test(raw);
}

function mkdirp(d) {
  fs.mkdirSync(d, { recursive: true });
}

function moveFile(from, to) {
  mkdirp(path.dirname(to));
  if (fs.existsSync(to)) {
    throw new Error(`Refusing overwrite: ${norm(to)}`);
  }
  fs.renameSync(from, to);
}

function relNoExtFromPages(abs) {
  const rel = norm(path.relative(PAGES, abs));
  return rel.replace(/\.(tsx|ts|jsx|js)$/, "");
}

const MOVE_SEGMENT = new Set(["components", "partials", "_partials", "hooks"]);

function shouldMoveBySegment(abs) {
  const n = norm(abs);
  if (n.includes("/api/")) return false;
  const parts = n.split("/");
  const idx = parts.indexOf("pages");
  if (idx < 0) return false;
  return parts.slice(idx + 1).some((seg) => MOVE_SEGMENT.has(seg));
}

function pagesToPageModules(abs) {
  return path.join(PM, path.relative(PAGES, abs));
}

function isRouteBasename(bn) {
  if (bn === "index.tsx" || bn === "index.ts") return true;
  if (bn.startsWith("[") && bn.includes("]")) return true;
  if (bn.startsWith("_")) return true;
  return false;
}

const movedRels = new Set();

// --- Phase 1: delete shims ---
for (const abs of walkFiles(PAGES)) {
  if (isShimFile(abs)) {
    fs.unlinkSync(abs);
    console.log("del shim", norm(abs));
  }
}

// --- Phase 2: rename *.page.* ---
const pageExtFiles = walkFiles(PAGES).filter((f) => /\.page\.(tsx|ts|jsx|js)$/.test(f));
pageExtFiles.sort((a, b) => b.length - a.length);
for (const abs of pageExtFiles) {
  const m = abs.match(/^(.+)\.page(\.(tsx|ts|jsx|js))$/);
  if (!m) continue;
  const dest = m[1] + m[2];
  if (fs.existsSync(dest)) {
    throw new Error(`Target exists: ${norm(dest)}`);
  }
  fs.renameSync(abs, dest);
  console.log("rename", norm(abs), "->", norm(dest));
}

// --- Phase 3: move segment-based colocation ---
const afterRename = walkFiles(PAGES);
const toMoveSeg = afterRename.filter(shouldMoveBySegment);
toMoveSeg.sort((a, b) => b.length - a.length);
for (const abs of toMoveSeg) {
  const dest = pagesToPageModules(abs);
  moveFile(abs, dest);
  movedRels.add(relNoExtFromPages(dest));
  console.log("move", norm(abs), "->", norm(dest));
}

// --- Phase 4: loose siblings of index.tsx ---
function looseFilesToMove() {
  const dirs = new Set();
  for (const abs of walkFiles(PAGES)) {
    if (!abs.endsWith(".tsx") && !abs.endsWith(".ts")) continue;
    if (norm(abs).includes("/api/")) continue;
    dirs.add(path.dirname(abs));
  }
  const out = [];
  for (const dir of dirs) {
    // Never treat top-level `src/pages` files as "loose" helpers next to a route index.
    if (path.resolve(dir) === path.resolve(PAGES)) continue;
    if (!fs.existsSync(path.join(dir, "index.tsx"))) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isFile()) continue;
      const abs = path.join(dir, ent.name);
      const bn = ent.name;
      if (bn === "index.tsx") continue;
      if (MOVE_SEGMENT.has(bn)) continue;
      if (isRouteBasename(bn)) continue;
      if (bn.endsWith(".tsx") || bn.endsWith(".ts")) {
        out.push(abs);
      }
    }
  }
  return out;
}

for (const abs of looseFilesToMove()) {
  if (!fs.existsSync(abs)) continue;
  const dest = pagesToPageModules(abs);
  moveFile(abs, dest);
  movedRels.add(relNoExtFromPages(dest));
  console.log("move loose", norm(abs), "->", norm(dest));
}

// --- Phase 5: rewrite imports ---
const rels = [...movedRels].sort((a, b) => b.length - a.length);

function rewriteInText(text) {
  let next = text;
  for (const r of rels) {
    next = next.split(`"@pages/${r}"`).join(`"@page-modules/${r}"`);
    next = next.split(`'@pages/${r}'`).join(`'@page-modules/${r}'`);
    next = next.split(`"@pages/${r}/`).join(`"@page-modules/${r}/`);
    next = next.split(`'@pages/${r}/`).join(`'@page-modules/${r}/`);
  }
  return next;
}

function walkRewrite(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walkRewrite(p);
    } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
      const raw = fs.readFileSync(p, "utf8");
      const next = rewriteInText(raw);
      if (next !== raw) {
        fs.writeFileSync(p, next, "utf8");
        console.log("rewrite", norm(p));
      }
    }
  }
}

walkRewrite(SRC);

// --- Phase 6: fix relative imports from pages into page-modules ---
function fixRelativeImportsInPages() {
  for (const abs of walkFiles(PAGES)) {
    if (!/\.(tsx|ts)$/.test(abs)) continue;
    if (norm(abs).includes("/api/")) continue;
    const dir = path.dirname(abs);
    const pagePrefix = norm(path.relative(PAGES, dir));
    let raw = fs.readFileSync(abs, "utf8");
    let next = raw
      .replace(
        /from\s+["']\.\/components\/([^"']+)["']/g,
        `from "@page-modules/${pagePrefix}/components/$1"`,
      )
      .replace(
        /from\s+["']\.\/partials\/([^"']+)["']/g,
        `from "@page-modules/${pagePrefix}/partials/$1"`,
      )
      .replace(
        /from\s+["']\.\/_partials\/([^"']+)["']/g,
        `from "@page-modules/${pagePrefix}/_partials/$1"`,
      )
      .replace(
        /from\s+["']\.\/hooks\/([^"']+)["']/g,
        `from "@page-modules/${pagePrefix}/hooks/$1"`,
      );

    next = next.replace(/from\s+["']\.\/([^"'/]+)["']/g, (full, name) => {
      const candidate = `${pagePrefix}/${name}`;
      if (movedRels.has(candidate)) {
        return `from "@page-modules/${candidate}"`;
      }
      return full;
    });

    if (next !== raw) {
      fs.writeFileSync(abs, next, "utf8");
      console.log("rel-import", norm(abs));
    }
  }
}

fixRelativeImportsInPages();

console.log("Moved import roots count:", rels.length);
console.log("Remove pageExtensions from next.config.ts if present.");
