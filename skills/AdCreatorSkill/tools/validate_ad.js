#!/usr/bin/env node
// Tool to validate ad components before submission
// Usage: node validate_ad.js <json-data>

const MAX_TAGLINE_LENGTH = 50;
const MAX_BENEFIT_LENGTH = 60;
const MAX_COMPANY_NAME_LENGTH = 30;
const MAX_AGENT_PROMPT_LENGTH = 500;
const MIN_BENEFITS = 2;
const MAX_BENEFITS = 6;

function validateAd(adData) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  try {
    // Validate required fields
    if (!adData.companyName) {
      errors.push('Company name is required');
    } else if (adData.companyName.length > MAX_COMPANY_NAME_LENGTH) {
      errors.push(`Company name exceeds ${MAX_COMPANY_NAME_LENGTH} characters`);
    }

    if (!adData.tagline) {
      errors.push('Tagline is required');
    } else if (adData.tagline.length > MAX_TAGLINE_LENGTH) {
      errors.push(`Tagline exceeds ${MAX_TAGLINE_LENGTH} characters (currently ${adData.tagline.length})`);
      suggestions.push(`Consider shortening to: "${adData.tagline.substring(0, MAX_TAGLINE_LENGTH - 3)}..."`);
    }

    if (!adData.benefits || !Array.isArray(adData.benefits)) {
      errors.push('Benefits list is required');
    } else {
      if (adData.benefits.length < MIN_BENEFITS) {
        errors.push(`At least ${MIN_BENEFITS} benefits are required`);
      } else if (adData.benefits.length > MAX_BENEFITS) {
        warnings.push(`More than ${MAX_BENEFITS} benefits may overwhelm readers`);
        suggestions.push('Consider focusing on your top 3-4 benefits');
      }

      // Check individual benefit lengths
      adData.benefits.forEach((benefit, index) => {
        if (benefit.length > MAX_BENEFIT_LENGTH) {
          warnings.push(`Benefit ${index + 1} is too long (${benefit.length} chars)`);
          suggestions.push(`Shorten: "${benefit.substring(0, 30)}..."`);
        }
      });
    }

    if (!adData.link) {
      errors.push('Link is required');
    } else if (!isValidUrl(adData.link)) {
      errors.push('Link must be a valid URL');
    }

    if (!adData.adPrompt) {
      errors.push('Agent discovery prompt is required');
    } else if (adData.adPrompt.length > MAX_AGENT_PROMPT_LENGTH) {
      errors.push(`Agent prompt exceeds ${MAX_AGENT_PROMPT_LENGTH} characters`);
      suggestions.push('Focus on key features and use cases');
    }

    if (!adData.style) {
      warnings.push('No style specified, defaulting to professional');
    } else if (!['professional', 'tech', 'decorative', 'minimal'].includes(adData.style)) {
      errors.push('Invalid style. Choose: professional, tech, decorative, or minimal');
    }

    // Quality checks
    if (adData.tagline && !hasGoodTagline(adData.tagline)) {
      suggestions.push('Tagline tips: Focus on the key benefit, use active voice');
    }

    if (adData.adPrompt && !hasKeywords(adData.adPrompt)) {
      suggestions.push('Agent prompt could include more technical keywords for better discovery');
    }

    // Calculate quality score
    const score = calculateQualityScore(adData, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
      summary: generateSummary(errors, warnings, score)
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation failed: ${error.message}`],
      warnings: [],
      suggestions: [],
      score: 0,
      summary: 'Validation error occurred'
    };
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function hasGoodTagline(tagline) {
  // Check for basic quality indicators
  const hasActionWord = /\b(get|build|create|discover|transform|power|boost|simplify)\b/i.test(tagline);
  const notTooGeneric = !/\b(best|great|awesome|amazing)\b/i.test(tagline);
  return hasActionWord || notTooGeneric;
}

function hasKeywords(prompt) {
  // Check for technical keywords that help with discovery
  const technicalKeywords = /\b(API|SDK|REST|GraphQL|webhook|integration|real-time|cloud|SaaS|platform|service|tool|framework|library)\b/i;
  return technicalKeywords.test(prompt);
}

function calculateQualityScore(adData, errors, warnings) {
  let score = 100;

  // Deduct for errors and warnings
  score -= errors.length * 20;
  score -= warnings.length * 5;

  // Bonus for good practices
  if (adData.tagline && adData.tagline.length < 30) score += 5;
  if (adData.benefits && adData.benefits.length === 3 || adData.benefits.length === 4) score += 5;
  if (adData.adPrompt && hasKeywords(adData.adPrompt)) score += 10;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(errors, warnings, score) {
  if (errors.length === 0 && warnings.length === 0) {
    return '✅ Ad is perfect and ready for submission!';
  } else if (errors.length === 0) {
    return `✅ Ad is valid with ${warnings.length} minor suggestion(s). Score: ${score}/100`;
  } else {
    return `❌ Ad has ${errors.length} error(s) that must be fixed. Score: ${score}/100`;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate_ad.js <json-data>');
    console.error('Example: node validate_ad.js \'{"companyName":"Test","tagline":"Test tagline","benefits":["b1","b2"],"link":"https://test.com","adPrompt":"Test prompt","style":"professional"}\'');
    process.exit(1);
  }

  try {
    const adData = JSON.parse(args[0]);
    const result = validateAd(adData);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(JSON.stringify({
      valid: false,
      errors: [`Invalid JSON: ${error.message}`],
      warnings: [],
      suggestions: [],
      score: 0,
      summary: 'Could not parse ad data'
    }, null, 2));
    process.exit(1);
  }
}

module.exports = { validateAd };