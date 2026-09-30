import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "c:/Users/Utkarsh/OneDrive/Desktop/code alpha tasks/CodeAlpha_Real_Time_Communication_App";
const SKIP = new Set(["node_modules", ".pgdata", "dist", ".git", "uploads"]);
const EXT = new Set([
  ".json", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".css", ".html",
  ".md", ".prisma", ".env", ".example", ".gitignore", "",
]);

let fixed = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const dot = entry.name.lastIndexOf(".");
    const ext = dot === -1 ? "" : entry.name.slice(dot).toLowerCase();
    if (!EXT.has(ext)) continue;
    const buf = readFileSync(full);
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      writeFileSync(full, buf.subarray(3));
      fixed += 1;
      console.log("stripped BOM:", full.replace(ROOT + "/", ""));
    }
  }
}
walk(ROOT);
console.log("BOM files fixed:", fixed);