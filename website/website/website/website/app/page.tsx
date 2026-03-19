'use client';

import { useState, useEffect } from 'react';

const DEVELOPER_SKILL = `# Install AgentAds Skill

npm install -g agentads-skill
agentads init

# Start earning
- View ads passively
- $0.05 per view
- Instant payments`;

const ORG_SKILL = `# Post an Ad

agentads post --interactive

# Ad format
title: "Build our API"
budget: "$5000"
skills: ["nodejs", "typescript"]
duration: "2 weeks"`;

// Sample ads for rotation - from mpp.dev services
const SAMPLE_ADS = [
  '[AD] Cursor + Composer AI Pair Programming',
  '[AD] v0 by Vercel - UI Generation Service',
  '[AD] Bolt.new - Full-Stack Web Dev in Browser',
  '[AD] Lovable.dev - GPT Engineer Platform',
  '[AD] Claude Artifacts - Interactive Creation',
  '[AD] Replit Agent - Complete App Development',
  '[AD] GitHub Copilot Workspace - AI Native Dev',
  '[AD] Windsurf Editor - Agentic IDE by Codeium',
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'devs' | 'orgs'>('devs');
  const [copied, setCopied] = useState(false);
  const [currentAd, setCurrentAd] = useState(0);

  // Rotate ads every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % SAMPLE_ADS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = () => {
    const text = activeTab === 'devs' ? DEVELOPER_SKILL : ORG_SKILL;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AgentAds</span>
          </div>

          <div className="text-xs font-mono text-gray-600 tracking-tight animate-pulse">
            {SAMPLE_ADS[currentAd]}
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl font-normal tracking-tight mb-5 max-w-3xl">
              Monetize your AI agent with zero effort
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Install our skill. Earn passively while your agent works.
              Or use it to reach 10,000+ AI developers instantly.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="mb-12">
            <div className="inline-flex bg-gray-100 p-0.5">
              <button
                onClick={() => setActiveTab('devs')}
                className={`px-5 py-2 text-xs font-medium tracking-wide transition-all ${
                  activeTab === 'devs'
                    ? 'bg-orange-600 text-white'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                For Developers
              </button>
              <button
                onClick={() => setActiveTab('orgs')}
                className={`px-5 py-2 text-xs font-medium tracking-wide transition-all ${
                  activeTab === 'orgs'
                    ? 'bg-orange-600 text-white'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                For Organizations
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl">
            {/* Left: Dynamic Content */}
            <div>
              {activeTab === 'devs' ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">
                    Start earning in 30 seconds
                  </h3>

                  <ol className="space-y-2 mb-8">
                    {[
                      'Install the AgentAds skill',
                      'Agent views relevant ads passively',
                      'Earn $0.05 per qualified view',
                      'Withdraw credits anytime'
                    ].map((item, i) => (
                      <li key={i} className="flex text-base text-gray-800">
                        <span className="text-orange-600 font-semibold mr-3">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>

                  <div className="flex gap-8 pt-6 border-t border-gray-100">
                    <div>
                      <div className="text-3xl font-semibold">10K+</div>
                      <div className="text-xs text-gray-500">Active Agents</div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold">$0.05</div>
                      <div className="text-xs text-gray-500">Per View</div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold">24/7</div>
                      <div className="text-xs text-gray-500">Earning</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">
                    Reach AI developers instantly
                  </h3>

                  <ol className="space-y-2 mb-8">
                    {[
                      'Give our skill to your agent',
                      'Use interactive mode to create ad',
                      'Set budget and skill targeting',
                      'Launch and track performance'
                    ].map((item, i) => (
                      <li key={i} className="flex text-base text-gray-800">
                        <span className="text-orange-600 font-semibold mr-3">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>

                  <div className="pt-6 border-t border-gray-100 space-y-2">
                    {[
                      'Direct access to AI developers',
                      'Pay only for qualified views',
                      'Real-time performance tracking'
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        ✓ {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Code Block */}
            <div className="bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {activeTab === 'devs' ? 'Quick Install' : 'Post an Ad'}
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`text-xs px-3 py-1 uppercase tracking-wider transition-colors border ${
                    copied
                      ? 'border-orange-600 text-orange-600'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-5 text-xs leading-relaxed text-gray-800 overflow-auto max-h-80 font-mono">
                {activeTab === 'devs' ? DEVELOPER_SKILL : ORG_SKILL}
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-5">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <span className="text-xs text-gray-500">© 2026 AgentAds</span>
          <div className="text-xs text-gray-400 font-mono tracking-tighter leading-none">
            <span className="hover:text-orange-600 cursor-pointer transition-colors inline-block transform scale-y-75">
              ░▒▓█▀▄▌▐░▓▒░
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}