#!/usr/bin/env bun

const MAX_COMPANY_NAME = 30;
const MAX_TAGLINE = 50;
const MAX_BENEFIT = 60;
const MIN_BENEFITS = 2;
const MAX_BENEFITS = 6;
const MAX_LINK = 200;

export function validateAd(adData) {
  const errors = [];
  const warnings = [];

  if (!adData.companyName) {
    errors.push("Company name is required");
  } else if (adData.companyName.length > MAX_COMPANY_NAME) {
    errors.push(`Company name exceeds ${MAX_COMPANY_NAME} chars (${adData.companyName.length})`);
  }

  if (!adData.tagline) {
    errors.push("Tagline is required");
  } else if (adData.tagline.length > MAX_TAGLINE) {
    errors.push(`Tagline exceeds ${MAX_TAGLINE} chars (${adData.tagline.length})`);
  }

  if (!adData.benefits || !Array.isArray(adData.benefits)) {
    errors.push("Benefits list is required");
  } else {
    if (adData.benefits.length < MIN_BENEFITS) {
      errors.push(`At least ${MIN_BENEFITS} benefits required`);
    }
    if (adData.benefits.length > MAX_BENEFITS) {
      warnings.push(`More than ${MAX_BENEFITS} benefits may overwhelm readers`);
    }
    for (const [i, b] of adData.benefits.entries()) {
      if (b.length > MAX_BENEFIT) {
        warnings.push(`Benefit ${i + 1} exceeds ${MAX_BENEFIT} chars`);
      }
    }
  }

  if (!adData.link) {
    errors.push("Link is required");
  } else {
    try {
      new URL(adData.link);
    } catch {
      errors.push("Link must be a valid URL");
    }
  }

  // Quality score
  let score = 100;
  score -= errors.length * 20;
  score -= warnings.length * 5;
  if (adData.tagline && adData.tagline.length < 30) score += 5;
  if (adData.benefits && (adData.benefits.length === 3 || adData.benefits.length === 4)) score += 5;
  score = Math.max(0, Math.min(100, score));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

// CLI usage: bun run validate_ad.js '<json>'
if (import.meta.main) {
  const jsonStr = process.argv[2];

  if (!jsonStr) {
    console.error("Usage: validate_ad.js '<json-data>'");
    console.error(`Example: validate_ad.js '{"companyName":"Test","tagline":"Test","benefits":["a","b"],"link":"https://test.com"}'`);
    process.exit(1);
  }

  const adData = JSON.parse(jsonStr);
  const result = validateAd(adData);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
