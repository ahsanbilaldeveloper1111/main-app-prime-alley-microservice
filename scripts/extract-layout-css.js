const fs = require("fs");
const s = fs.readFileSync("src/Layouts/index.tsx", "utf8");
const open = "<style>{`";
const i = s.indexOf(open);
if (i < 0) throw new Error("open not found");
const a = i + open.length;
const close = "`}</style>";
const b = s.indexOf(close, a);
if (b < 0) throw new Error("close not found");
const css = s.slice(a, b);
fs.mkdirSync("src/Layouts/components", { recursive: true });
fs.writeFileSync(
  "src/Layouts/components/layoutInlineCss.ts",
  "export const LAYOUT_INLINE_CSS = " + JSON.stringify(css) + ";\n",
);
console.log("ok", css.length, JSON.stringify(css.slice(0, 40)));
