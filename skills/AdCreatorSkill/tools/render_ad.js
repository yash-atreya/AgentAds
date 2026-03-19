#!/usr/bin/env node
// Tool for Claude to render ads in different styles
// Usage: node render_ad.js <style> <json-data>

const fs = require('fs');
const path = require('path');

// Get styles configuration
const styles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../templates/styles.json'), 'utf8')
);

function renderAd(adData, styleName = 'professional') {
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

  // Benefits
  adData.benefits.forEach(benefit => {
    const bulletPoint = style.bullets.default;
    const benefitText = ` ${bulletPoint} ${benefit}`;
    const paddedBenefit = padRight(benefitText, innerWidth);
    ad += style.borders.vertical + ' ' + paddedBenefit + ' ' + style.borders.vertical + '\n';
  });

  // Divider
  ad += style.borders.dividerLeft;
  ad += style.borders.dividerHorizontal.repeat(width - 2);
  ad += style.borders.dividerRight + '\n';

  // Link
  const linkText = ` ${style.icons.link} Learn More: ${adData.link}`;
  const paddedLink = padRight(linkText, innerWidth);
  ad += style.borders.vertical + ' ' + paddedLink + ' ' + style.borders.vertical + '\n';

  // Bottom border
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

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node render_ad.js <style> <json-data>');
    process.exit(1);
  }

  const styleName = args[0];
  const adData = JSON.parse(args[1]);

  const ad = renderAd(adData, styleName);
  console.log(ad);
}

module.exports = { renderAd };