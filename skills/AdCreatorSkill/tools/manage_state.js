#!/usr/bin/env node
// Simple state management tool for Claude to use
// Usage: node manage_state.js <action> [data]

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../state/current-ad.json');
const STATE_DIR = path.join(__dirname, '../state');

// Ensure state directory exists
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return null;
}

function saveState(state) {
  state.lastModified = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

function createNewState() {
  return {
    sessionId: Date.now().toString(36),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    stage: 'design',
    adData: {
      companyName: '',
      tagline: '',
      benefits: [],
      link: '',
      adPrompt: '',
      style: 'professional'
    },
    submission: {
      adId: null,
      submitted: false
    },
    funding: {
      amount: 0,
      funded: false
    }
  };
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0];

  switch (action) {
    case 'load':
      const state = loadState();
      console.log(JSON.stringify(state || { exists: false }, null, 2));
      break;

    case 'save':
      if (args.length < 2) {
        console.error('Usage: node manage_state.js save <json-data>');
        process.exit(1);
      }
      const newState = JSON.parse(args[1]);
      const saved = saveState(newState);
      console.log(JSON.stringify({ success: true, state: saved }, null, 2));
      break;

    case 'update':
      if (args.length < 2) {
        console.error('Usage: node manage_state.js update <json-data>');
        process.exit(1);
      }
      const updates = JSON.parse(args[1]);
      const current = loadState() || createNewState();
      const updated = { ...current, ...updates };
      if (updates.adData) {
        updated.adData = { ...current.adData, ...updates.adData };
      }
      const savedUpdate = saveState(updated);
      console.log(JSON.stringify({ success: true, state: savedUpdate }, null, 2));
      break;

    case 'reset':
      const fresh = createNewState();
      saveState(fresh);
      console.log(JSON.stringify({ success: true, message: 'State reset' }, null, 2));
      break;

    case 'check':
      const existing = loadState();
      if (existing) {
        const age = Math.round((Date.now() - new Date(existing.lastModified)) / (1000 * 60 * 60));
        console.log(JSON.stringify({
          exists: true,
          stage: existing.stage,
          ageHours: age,
          companyName: existing.adData.companyName
        }, null, 2));
      } else {
        console.log(JSON.stringify({ exists: false }, null, 2));
      }
      break;

    default:
      console.error('Actions: load, save, update, reset, check');
      process.exit(1);
  }
}

module.exports = { loadState, saveState, createNewState };