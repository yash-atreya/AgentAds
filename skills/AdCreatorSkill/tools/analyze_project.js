#!/usr/bin/env node
// Tool to analyze a project and suggest ad content
// Usage: node analyze_project.js [project-path]

const fs = require('fs');
const path = require('path');

function analyzeProject(projectPath = process.cwd()) {
  const result = {
    projectName: path.basename(projectPath),
    hasPackageJson: false,
    hasReadme: false,
    suggestions: {
      companyName: '',
      taglines: [],
      benefits: [],
      keywords: []
    }
  };

  // Check for package.json
  const packagePath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packagePath)) {
    result.hasPackageJson = true;
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    result.suggestions.companyName = pkg.name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (pkg.description) {
      result.description = pkg.description;
    }

    if (pkg.keywords && Array.isArray(pkg.keywords)) {
      result.suggestions.keywords = pkg.keywords;
    }
  }

  // Check for README
  const readmePaths = ['README.md', 'readme.md', 'Readme.md'];
  for (const readmeName of readmePaths) {
    const readmePath = path.join(projectPath, readmeName);
    if (fs.existsSync(readmePath)) {
      result.hasReadme = true;
      const readme = fs.readFileSync(readmePath, 'utf8');

      // Extract features (lines starting with - or *)
      const features = readme.match(/^[\-\*]\s+(.+)$/gm);
      if (features) {
        result.suggestions.benefits = features
          .slice(0, 4)
          .map(f => f.replace(/^[\-\*]\s+/, ''));
      }

      // Extract first heading as potential company name
      const heading = readme.match(/^#\s+(.+)$/m);
      if (heading && !result.suggestions.companyName) {
        result.suggestions.companyName = heading[1];
      }
      break;
    }
  }

  // Generate tagline suggestions based on keywords
  if (result.suggestions.keywords.length > 0) {
    const keyword = result.suggestions.keywords[0];
    result.suggestions.taglines = [
      `The Future of ${capitalize(keyword)}`,
      `${capitalize(keyword)} Made Simple`,
      `Your ${capitalize(keyword)} Solution`
    ];
  } else {
    result.suggestions.taglines = [
      'Innovation at Your Fingertips',
      'Built for Developers',
      'Simple. Fast. Reliable.'
    ];
  }

  // If no benefits found, create generic ones
  if (result.suggestions.benefits.length === 0) {
    result.suggestions.benefits = [
      'Easy to integrate',
      'Comprehensive documentation',
      'Reliable performance',
      'Great developer experience'
    ];
  }

  return result;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const analysis = analyzeProject(projectPath);
  console.log(JSON.stringify(analysis, null, 2));
}

module.exports = { analyzeProject };