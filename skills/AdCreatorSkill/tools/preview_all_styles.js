#!/usr/bin/env node
// Tool to preview ad in all available styles at once
// Usage: node preview_all_styles.js <json-data>

const fs = require('fs');
const path = require('path');

// Get styles configuration
const styles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../templates/styles.json'), 'utf8')
);

function renderAd(adData, styleName) {
  const style = styles.styles[styleName];
  const width = styles.widths.standard.total;
  const innerWidth = styles.widths.standard.inner;

  let ad = '';

  // Top border
  ad += style.borders.topLeft;
  ad += style.borders.horizontal.repeat(width - 2);
  ad += style.borders.topRight + '\n';

  // Company name
  const paddedCompany = centerText(adData.companyName.toUpperCase(), innerWidth);
  ad += style.borders.vertical + ' ' + paddedCompany + ' ' + style.borders.vertical + '\n';

  // Tagline
  if (adData.tagline) {
    const paddedTagline = centerText(`"${adData.tagline}"`, innerWidth);
    ad += style.borders.vertical + ' ' + paddedTagline + ' ' + style.borders.vertical + '\n';
  }

  // Divider
  ad += style.borders.dividerLeft;
  ad += style.borders.dividerHorizontal.repeat(width - 2);
  ad += style.borders.dividerRight + '\n';

  // Benefits (limit to 3 for preview)
  const benefitsToShow = adData.benefits.slice(0, 3);
  benefitsToShow.forEach(benefit => {
    const bulletPoint = style.bullets.default;
    const benefitText = ` ${bulletPoint} ${benefit}`;
    const paddedBenefit = padRight(benefitText, innerWidth);
    ad += style.borders.vertical + ' ' + paddedBenefit + ' ' + style.borders.vertical + '\n';
  });

  // Bottom border (simplified for preview)
  ad += style.borders.bottomLeft;
  ad += style.borders.horizontal.repeat(width - 2);
  ad += style.borders.bottomRight;

  return ad;
}

function centerText(text, width) {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

function padRight(text, width) {
  return text + ' '.repeat(Math.max(0, width - text.length));
}

function previewAllStyles(adData) {
  const styleNames = Object.keys(styles.styles);
  const previews = {};

  console.log('\n═══ ALL STYLE PREVIEWS ═══\n');

  styleNames.forEach((styleName, index) => {
    console.log(`${index + 1}. ${styles.styles[styleName].name || styleName.toUpperCase()} STYLE:`);
    console.log('─'.repeat(50));

    const ad = renderAd(adData, styleName);
    previews[styleName] = ad;
    console.log(ad);
    console.log('');
  });

  console.log('Choose a style by saying the number (1-4) or style name.\n');

  return previews;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node preview_all_styles.js <json-data>');
    process.exit(1);
  }

  try {
    const adData = JSON.parse(args[0]);
    previewAllStyles(adData);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { previewAllStyles };