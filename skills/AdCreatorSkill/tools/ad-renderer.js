// AdRenderer - Renders ASCII art advertisements
const fs = require('fs');
const path = require('path');

class AdRenderer {
  constructor() {
    this.styles = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'templates/styles.json'), 'utf8')
    );
  }

  render(adData) {
    const style = this.styles.styles[adData.style || 'professional'];
    const width = this.styles.widths.standard.total;
    const innerWidth = this.styles.widths.standard.inner;

    let ad = '';

    // Top border
    ad += style.borders.topLeft;
    ad += style.borders.horizontal.repeat(width - 2);
    ad += style.borders.topRight + '\n';

    // Company name
    const paddedCompany = this.centerText(adData.companyName.toUpperCase(), innerWidth);
    ad += style.borders.vertical + ' ' + paddedCompany + ' ' + style.borders.vertical + '\n';

    // Tagline
    if (adData.tagline) {
      const paddedTagline = this.centerText(`"${adData.tagline}"`, innerWidth);
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
      const paddedBenefit = this.padRight(benefitText, innerWidth);
      ad += style.borders.vertical + ' ' + paddedBenefit + ' ' + style.borders.vertical + '\n';
    });

    // Divider
    ad += style.borders.dividerLeft;
    ad += style.borders.dividerHorizontal.repeat(width - 2);
    ad += style.borders.dividerRight + '\n';

    // Link
    const linkText = ` ${style.icons.link} Learn More: ${adData.link}`;
    const paddedLink = this.padRight(linkText, innerWidth);
    ad += style.borders.vertical + ' ' + paddedLink + ' ' + style.borders.vertical + '\n';

    // Bottom border
    ad += style.borders.bottomLeft;
    ad += style.borders.horizontal.repeat(width - 2);
    ad += style.borders.bottomRight;

    return ad;
  }

  renderAll(adData) {
    const styles = ['professional', 'tech', 'decorative', 'minimal'];
    const results = {};

    styles.forEach(styleName => {
      const styledData = { ...adData, style: styleName };
      results[styleName] = this.render(styledData);
    });

    return results;
  }

  centerText(text, width) {
    const padding = Math.max(0, width - text.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }

  padRight(text, width) {
    return text + ' '.repeat(Math.max(0, width - text.length));
  }

  // Validate ad data before rendering
  validate(adData) {
    const errors = [];

    if (!adData.companyName) {
      errors.push('Company name is required');
    }
    if (!adData.tagline) {
      errors.push('Tagline is required');
    }
    if (!adData.benefits || adData.benefits.length === 0) {
      errors.push('At least one benefit is required');
    }
    if (!adData.link) {
      errors.push('Link is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get style preview
  getStylePreview(styleName) {
    const sampleData = {
      companyName: 'Sample Company',
      tagline: 'Sample Tagline',
      benefits: ['Feature 1', 'Feature 2'],
      link: 'https://example.com',
      style: styleName
    };

    return this.render(sampleData);
  }
}

module.exports = AdRenderer;