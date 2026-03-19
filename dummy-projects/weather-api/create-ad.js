// Custom ad creator for Weather API project
const path = require('path');
const fs = require('fs');

// Import the AdRenderer from the skill
const AdRenderer = require('../../skills/AdCreatorSkill/ad-renderer');

// Read project info
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const readme = fs.readFileSync('./README.md', 'utf8');

console.log('\n🎯 Creating Ad for Weather API Service\n');
console.log('Analyzing project...\n');

// Extract project information
const projectInfo = {
  name: packageJson.name,
  description: packageJson.description,
  keywords: packageJson.keywords,
  features: readme.match(/- .+/g)?.slice(0, 4).map(f => f.replace('- ', '')) || []
};

console.log('Project detected:');
console.log(`  Name: ${projectInfo.name}`);
console.log(`  Description: ${projectInfo.description}`);
console.log(`  Keywords: ${projectInfo.keywords.join(', ')}\n`);

// Create ad data based on project
const adData = {
  companyName: 'Weather API',
  tagline: 'Real-Time Weather, Real Simple',
  benefits: [
    'Real-time weather for any location',
    '7-day forecasts with 95% accuracy',
    'WebSocket support for live updates',
    'Free tier with 1000 requests/day'
  ],
  link: 'https://weather-api.dev',
  adPrompt: 'Weather API Service provides real-time weather data and forecasts through a simple REST API. Features include current weather, 7-day forecasts, historical data, and live updates via WebSocket. Perfect for developers building weather-dependent applications. Free tier available.',
  style: 'professional'
};

// Create renderer
const renderer = new AdRenderer();

// Show different styles
console.log('═'.repeat(50));
console.log('\n📊 GENERATED ADS FOR YOUR PROJECT:\n');

// Professional style
console.log('1️⃣ PROFESSIONAL STYLE:\n');
adData.style = 'professional';
console.log(renderer.render(adData));

// Tech style
console.log('\n\n2️⃣ TECH STYLE:\n');
adData.style = 'tech';
console.log(renderer.render(adData));

// Decorative style
console.log('\n\n3️⃣ DECORATIVE STYLE:\n');
adData.style = 'decorative';
console.log(renderer.render(adData));

// Show the agent prompt
console.log('\n\n🤖 AGENT PROMPT (Hidden from users):');
console.log('━'.repeat(50));
console.log(adData.adPrompt);
console.log('━'.repeat(50));

// Save to file
const outputFile = 'weather-api-ad.json';
fs.writeFileSync(outputFile, JSON.stringify(adData, null, 2));

console.log(`\n✅ Ad configuration saved to ${outputFile}`);
console.log('\n📝 Next Steps:');
console.log('1. Review the generated ads above');
console.log('2. Choose your preferred style');
console.log('3. Edit the ad data in weather-api-ad.json if needed');
console.log('4. Run the full interactive workflow: cd ../../skills/AdCreatorSkill && node orchestrator.js');
console.log('\nThe ad is ready to be submitted to the AgentAds network!');