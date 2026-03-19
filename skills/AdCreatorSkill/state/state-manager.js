// State Manager for AdCreatorSkill
const fs = require('fs');
const path = require('path');

class StateManager {
  constructor() {
    this.stateFile = path.join(__dirname, 'current-ad.json');
    this.backupFile = path.join(__dirname, 'current-ad.backup.json');
    this.state = this.loadState();
  }

  // Load state from file or create new
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading state:', error);
      // Try backup file
      if (fs.existsSync(this.backupFile)) {
        const backup = fs.readFileSync(this.backupFile, 'utf8');
        return JSON.parse(backup);
      }
    }
    return this.createNewState();
  }

  // Create fresh state
  createNewState() {
    return {
      currentStage: 'design', // design | submission | funding | complete
      sessionId: this.generateSessionId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      adData: {
        companyName: '',
        tagline: '',
        taglineOptions: [],
        benefits: [],
        link: '',
        adPrompt: '',
        visualAd: '',
        style: 'professional'
      },
      submission: {
        adId: null,
        submittedAt: null,
        status: 'draft', // draft | submitted | failed
        previewUrl: null,
        retryCount: 0,
        lastError: null
      },
      funding: {
        balance: 0,
        lastTopUp: null,
        transactionId: null,
        adStatus: 'inactive', // inactive | active | paused
        amountAllocated: 0
      },
      history: []
    };
  }

  // Save state to file
  saveState() {
    try {
      // Create backup before saving
      if (fs.existsSync(this.stateFile)) {
        fs.copyFileSync(this.stateFile, this.backupFile);
      }

      this.state.lastModified = new Date().toISOString();
      fs.writeFileSync(
        this.stateFile,
        JSON.stringify(this.state, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  // Update current stage
  setStage(stage) {
    const validStages = ['design', 'submission', 'funding', 'complete'];
    if (!validStages.includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    this.addToHistory(`Stage changed from ${this.state.currentStage} to ${stage}`);
    this.state.currentStage = stage;
    this.saveState();
  }

  // Update ad data
  updateAdData(data) {
    this.state.adData = {
      ...this.state.adData,
      ...data
    };
    this.addToHistory('Ad data updated');
    this.saveState();
  }

  // Update submission info
  updateSubmission(data) {
    this.state.submission = {
      ...this.state.submission,
      ...data
    };
    this.addToHistory('Submission info updated');
    this.saveState();
  }

  // Update funding info
  updateFunding(data) {
    this.state.funding = {
      ...this.state.funding,
      ...data
    };
    this.addToHistory('Funding info updated');
    this.saveState();
  }

  // Add entry to history
  addToHistory(action) {
    this.state.history.push({
      timestamp: new Date().toISOString(),
      action: action
    });

    // Keep only last 50 history entries
    if (this.state.history.length > 50) {
      this.state.history = this.state.history.slice(-50);
    }
  }

  // Check if there's a saved draft
  hasDraft() {
    return fs.existsSync(this.stateFile) &&
           this.state.adData.companyName !== '';
  }

  // Get draft age in hours
  getDraftAge() {
    if (!this.hasDraft()) return null;

    const lastModified = new Date(this.state.lastModified);
    const now = new Date();
    const hours = (now - lastModified) / (1000 * 60 * 60);
    return Math.round(hours);
  }

  // Clear current state and start fresh
  reset() {
    // Archive old state if it exists
    if (this.hasDraft()) {
      const archiveName = `ad-${this.state.sessionId}.archive.json`;
      const archivePath = path.join(__dirname, archiveName);
      fs.writeFileSync(archivePath, JSON.stringify(this.state, null, 2));
    }

    this.state = this.createNewState();
    this.saveState();
    return this.state;
  }

  // Get summary of current state
  getSummary() {
    return {
      stage: this.state.currentStage,
      hasAdData: !!this.state.adData.companyName,
      isSubmitted: !!this.state.submission.adId,
      isFunded: this.state.funding.adStatus === 'active',
      draftAge: this.getDraftAge(),
      lastModified: this.state.lastModified
    };
  }

  // Export state for display
  exportForDisplay() {
    const { adData, submission, funding } = this.state;
    return {
      ad: {
        company: adData.companyName || 'Not set',
        tagline: adData.tagline || 'Not set',
        benefits: adData.benefits.length ? adData.benefits : ['Not set'],
        link: adData.link || 'Not set',
        style: adData.style
      },
      status: {
        submitted: submission.status === 'submitted',
        adId: submission.adId || 'Not submitted',
        funded: funding.adStatus === 'active',
        balance: `$${funding.balance.toFixed(2)}`
      }
    };
  }

  // Generate unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Validate state before proceeding to next stage
  validateForStage(targetStage) {
    switch(targetStage) {
      case 'submission':
        return this.validateAdData();
      case 'funding':
        return this.validateSubmission();
      case 'complete':
        return this.validateFunding();
      default:
        return { valid: true };
    }
  }

  validateAdData() {
    const { adData } = this.state;
    const errors = [];

    if (!adData.companyName) errors.push('Company name is required');
    if (!adData.tagline) errors.push('Tagline is required');
    if (adData.benefits.length < 2) errors.push('At least 2 benefits required');
    if (!adData.link) errors.push('Link is required');
    if (!adData.adPrompt) errors.push('Ad prompt is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateSubmission() {
    const { submission } = this.state;
    const errors = [];

    if (!submission.adId) errors.push('Ad must be submitted first');
    if (submission.status !== 'submitted') errors.push('Submission not complete');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateFunding() {
    const { funding } = this.state;
    const errors = [];

    if (funding.adStatus !== 'active') errors.push('Ad must be funded');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = StateManager;