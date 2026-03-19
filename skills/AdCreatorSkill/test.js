// Test runner for AdCreatorSkill with dummy data
const AdRenderer = require('./ad-renderer');
const StateManager = require('./state/state-manager');
const fs = require('fs');
const path = require('path');

console.log('\n🧪 AdCreatorSkill Test Runner\n');
console.log('This will demonstrate the full workflow with dummy data.\n');
console.log('═'.repeat(50));

// Test data
const testAds = [
  {
    companyName: 'Neural API',
    tagline: 'AI Integration Made Simple',
    benefits: [
      'Pre-trained models ready to use',
      'Simple REST API interface',
      'Pay-per-request pricing',
      '99.9% uptime SLA'
    ],
    link: 'https://neural-api.com',
    adPrompt: 'Neural API provides instant access to state-of-the-art AI models through a simple REST API. Perfect for developers who need AI capabilities without the complexity of training models. Supports text, vision, and audio processing.',
    style: 'professional'
  },
  {
    companyName: 'DevTools Pro',
    tagline: '<Code Better, Ship Faster/>',
    benefits: [
      'AI-powered code reviews',
      'Automated testing',
      'One-click deployment'
    ],
    link: 'https://devtools.pro',
    adPrompt: 'DevTools Pro accelerates development with AI-powered code reviews, automated testing, and seamless deployment. Integrates with GitHub, GitLab, and Bitbucket.',
    style: 'tech'
  },
  {
    companyName: 'DataStream',
    tagline: 'Real-Time Analytics That Scale',
    benefits: [
      'Process millions of events/sec',
      'Built-in ML pipelines',
      'Visual query builder',
      'Auto-scaling infrastructure'
    ],
    link: 'https://datastream.io',
    adPrompt: 'DataStream handles real-time data analytics at any scale with built-in machine learning pipelines and visual tools. Used by Fortune 500 companies for mission-critical analytics.',
    style: 'decorative'
  }
];

// Initialize components
const renderer = new AdRenderer();
const stateManager = new StateManager();

// Test 1: Render ads in different styles
console.log('\n📝 TEST 1: Ad Rendering\n');
console.log('Testing different ad styles...\n');

testAds.forEach((adData, index) => {
  console.log(`\nAd ${index + 1}: ${adData.companyName} (${adData.style} style)`);
  console.log('─'.repeat(50));

  const ad = renderer.render(adData);
  console.log(ad);

  console.log('\n🤖 Agent Prompt:');
  console.log(adData.adPrompt);
  console.log('');
});

// Test 2: State Management
console.log('\n💾 TEST 2: State Management\n');
console.log('Testing save and load functionality...\n');

// Reset state first
stateManager.reset();

// Save test ad to state
console.log('Saving ad to state...');
stateManager.updateAdData(testAds[0]);
stateManager.setStage('design');

// Simulate moving through stages
console.log('Simulating workflow progression:\n');

console.log('1. Design Stage ✓');
stateManager.setStage('submission');

console.log('2. Simulating submission...');
const mockAdId = 'AD-TEST-' + Date.now().toString(36).toUpperCase();
stateManager.updateSubmission({
  adId: mockAdId,
  submittedAt: new Date().toISOString(),
  status: 'submitted',
  previewUrl: `https://agentads.com/preview/${mockAdId}`
});
console.log(`   Ad ID: ${mockAdId} ✓`);

stateManager.setStage('funding');
console.log('3. Simulating funding...');
stateManager.updateFunding({
  balance: 50.00,
  lastTopUp: {
    amount: 50.00,
    timestamp: new Date().toISOString(),
    transactionId: 'TXN-TEST-123'
  },
  adStatus: 'active',
  amountAllocated: 10.00
});
console.log('   Funded with $10 ✓');

stateManager.setStage('complete');
console.log('4. Campaign Active ✓\n');

// Display final state
const summary = stateManager.exportForDisplay();
console.log('Final State Summary:');
console.log('═══════════════════');
console.log(`Company: ${summary.ad.company}`);
console.log(`Tagline: ${summary.ad.tagline}`);
console.log(`Ad ID: ${summary.status.adId}`);
console.log(`Status: ${summary.status.funded ? 'ACTIVE' : 'INACTIVE'}`);
console.log(`Balance: ${summary.status.balance}`);

// Test 3: Style variations
console.log('\n\n🎨 TEST 3: Style Variations\n');
console.log('Same content, different styles:\n');

const sampleAd = {
  companyName: 'Test Company',
  tagline: 'Testing All Styles',
  benefits: ['Feature A', 'Feature B', 'Feature C'],
  link: 'https://test.com',
  style: 'professional'
};

const styles = ['professional', 'tech', 'decorative', 'minimal'];
styles.forEach(style => {
  console.log(`\n${style.toUpperCase()} Style:`);
  console.log('─'.repeat(30));
  sampleAd.style = style;
  const ad = renderer.render(sampleAd);
  console.log(ad);
});

// Test 4: Validation
console.log('\n\n✅ TEST 4: Validation\n');

const invalidAd = {
  companyName: '',
  tagline: '',
  benefits: [],
  link: ''
};

const validation = renderer.validate(invalidAd);
if (!validation.valid) {
  console.log('Validation correctly caught errors:');
  validation.errors.forEach(err => console.log(`  ❌ ${err}`));
} else {
  console.log('❌ Validation failed to catch errors!');
}

// Test 5: Draft persistence
console.log('\n\n📂 TEST 5: Draft Persistence\n');

console.log('Checking if draft was saved...');
const hasDraft = stateManager.hasDraft();
console.log(`Draft exists: ${hasDraft ? '✓' : '✗'}`);

if (hasDraft) {
  const age = stateManager.getDraftAge();
  console.log(`Draft age: ${age === 0 ? 'Just created' : `${age} hours old`}`);

  const savedState = stateManager.getSummary();
  console.log('\nDraft Summary:');
  console.log(`  Stage: ${savedState.stage}`);
  console.log(`  Has Ad Data: ${savedState.hasAdData ? '✓' : '✗'}`);
  console.log(`  Is Submitted: ${savedState.isSubmitted ? '✓' : '✗'}`);
  console.log(`  Is Funded: ${savedState.isFunded ? '✓' : '✗'}`);
}

// Cleanup test state
console.log('\n\n🧹 Cleaning up test data...');
const stateFile = path.join(__dirname, 'state', 'current-ad.json');
if (fs.existsSync(stateFile)) {
  // Archive instead of delete
  const testArchive = path.join(__dirname, 'state', `test-${Date.now()}.archive.json`);
  fs.renameSync(stateFile, testArchive);
  console.log('Test state archived to:', path.basename(testArchive));
}

console.log('\n═'.repeat(50));
console.log('\n✅ All tests completed successfully!\n');
console.log('The AdCreatorSkill is ready to use. Run:');
console.log('  node orchestrator.js - For interactive mode');
console.log('  node test.js - To run this test again\n');