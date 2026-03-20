#!/usr/bin/env bun
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const styles = JSON.parse(
  readFileSync(join(__dirname, "../assets/styles.json"), "utf8")
);

function centerText(text, width) {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return " ".repeat(leftPad) + text + " ".repeat(rightPad);
}

function padRight(text, width) {
  return text + " ".repeat(Math.max(0, width - text.length));
}

export function renderAd(adData, styleName = "professional") {
  const style = styles.styles[styleName] || styles.styles.professional;
  const { total, inner } = styles.width;
  const b = style.borders;

  let ad = "";

  // Top border
  ad += b.topLeft + b.horizontal.repeat(total - 2) + b.topRight + "\n";

  // Company name
  ad += b.vertical + " " + centerText(adData.companyName.toUpperCase(), inner) + " " + b.vertical + "\n";

  // Tagline
  if (adData.tagline) {
    ad += b.vertical + " " + centerText(`"${adData.tagline}"`, inner) + " " + b.vertical + "\n";
  }

  // Divider
  ad += b.dividerLeft + b.horizontal.repeat(total - 2) + b.dividerRight + "\n";

  // Benefits
  for (const benefit of adData.benefits) {
    const line = ` ${style.bullets.default} ${benefit}`;
    ad += b.vertical + " " + padRight(line, inner) + " " + b.vertical + "\n";
  }

  // Divider
  ad += b.dividerLeft + b.horizontal.repeat(total - 2) + b.dividerRight + "\n";

  // Link
  const linkLine = ` ${style.icons.link} ${adData.link}`;
  ad += b.vertical + " " + padRight(linkLine, inner) + " " + b.vertical + "\n";

  // Bottom border
  ad += b.bottomLeft + b.horizontal.repeat(total - 2) + b.bottomRight;

  return ad;
}

// CLI usage: bun run render_ad.js <style> '<json>'
if (import.meta.main) {
  const styleName = process.argv[2] || "professional";
  const jsonStr = process.argv[3];

  if (!jsonStr) {
    console.error("Usage: render_ad.js <style> '<json-data>'");
    console.error('Styles: professional, tech, minimal');
    process.exit(1);
  }

  const adData = JSON.parse(jsonStr);
  console.log(renderAd(adData, styleName));
}
