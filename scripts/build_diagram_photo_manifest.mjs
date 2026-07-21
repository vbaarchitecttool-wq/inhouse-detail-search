import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const commentaryDir = path.join(projectRoot, "src", "commentary");
const outputDir = path.join(projectRoot, "public", "diagrams");
const outputPath = path.join(outputDir, "manifest.json");

const hashLabel = (value) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const buildPrompt = (label) => `Use case: scientific-educational
Asset type: landscape visual layer for a Japanese construction specification learning card
Primary request: Create one highly photorealistic, technically plausible construction visual that clearly represents this Japanese building-work topic: ${label}
Scene/backdrop: an authentic Japanese construction site, workshop, inspection area, or finished building location appropriate to the topic
Subject: make the essential materials, components, workmanship, or decisive process stage prominent and easy for a first-year construction manager to recognize
Style/medium: documentary construction photography or physically realistic architectural visualization; realistic material texture, scale, joints, tools, wear, and site conditions
Composition/framing: landscape 3:2, clear visual hierarchy, uncluttered, no collage; use a sectional or cutaway view only when the topic cannot be understood from an ordinary camera view
Lighting/mood: neutral daylight or clean inspection lighting, high clarity, natural color
Constraints: technically plausible Japanese practice; educational accuracy over drama; no text, labels, arrows, dimensions, logos, trademarks, or watermark; no unsafe behavior; no unrelated equipment or decoration`;

const files = fs
  .readdirSync(commentaryDir)
  .filter((name) => /^ch\d{2}\.ts$/.test(name))
  .sort((left, right) => left.localeCompare(right, "en", { numeric: true }));

const diagrams = [];
const seenHashes = new Set();
const svgPattern =
  /const\s+(SVG_[A-Z0-9_]+)\s*=\s*`\s*<svg\b[^>]*\baria-label="([^"]+)"/g;

for (const file of files) {
  const source = fs.readFileSync(path.join(commentaryDir, file), "utf8");
  const chapter = file.slice(2, 4);
  let match;

  while ((match = svgPattern.exec(source)) !== null) {
    const [, constant, ariaLabel] = match;
    const hash = hashLabel(ariaLabel);
    if (seenHashes.has(hash)) {
      throw new Error(`Duplicate diagram hash ${hash} for ${constant}`);
    }
    seenHashes.add(hash);

    diagrams.push({
      id: `${chapter}-${constant.replace(/^SVG_/, "").toLowerCase()}`,
      chapter: Number(chapter),
      sourceFile: `src/commentary/${file}`,
      constant,
      ariaLabel,
      hash,
      assetPath: `/diagrams/photo-${hash}.webp`,
      prompt: buildPrompt(ariaLabel),
    });
  }
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      count: diagrams.length,
      diagrams,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote ${diagrams.length} diagram prompts to ${outputPath}`);
