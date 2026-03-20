'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Typewriter from 'typewriter-effect'
import TerminalFlow from '@/components/TerminalFlow'

const DEVELOPER_SKILL = `npx skills add yash-atreya/AgentAds --skill ad-consumer`

const ORG_SKILL = `npx skills add yash-atreya/AgentAds --skill ad-creator`

const SAMPLE_ADS = [
  '[AD] cursor-composer.skill.md',
  '[AD] v0-vercel.skill.md',
  '[AD] bolt-new.skill.md',
  '[AD] lovable-gpt.skill.md',
  '[AD] claude-artifacts.skill.md',
  '[AD] replit-agent.skill.md',
  '[AD] copilot-workspace.skill.md',
  '[AD] windsurf-editor.skill.md',
]

const MatrixText = ({ text, isActive }: { text: string; isActive: boolean }) => {
  const [displayText, setDisplayText] = useState(text)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*/.-→'
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      let iteration = 0
      intervalRef.current = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) {
                return text[index]
              }
              if (char === ' ' || char === '→' || char === '.') return char
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join('')
        )

        if (iteration >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setDisplayText(text)
        }

        iteration += 0.8
      }, 20)
    } else {
      setDisplayText(text)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, isActive, chars])

  return <>{displayText}</>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'devs' | 'orgs'>('devs')
  const [copied, setCopied] = useState(false)
  const [currentAd, setCurrentAd] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % SAMPLE_ADS.length)
      }, 50)
      setTimeout(() => setIsTransitioning(false), 300)
    }, 3000) // Faster rotation
    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = () => {
    const text = activeTab === 'devs' ? DEVELOPER_SKILL : ORG_SKILL
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        setActiveTab('devs')
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTab('orgs')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Portal Image */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/portal.png)',
          backgroundSize: '120%',
          backgroundPosition: 'bottom -100px right',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="fixed inset-0 -z-10 bg-white/80" />

      {/* Header */}
      <header className="px-5">
        <div className="max-w-6xl mx-auto py-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <span className="text-lg font-black bg-gray-100 text-orange-500 px-2 py-0.5 border-2 border-gray-200">
                AA
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-orange-500"></div>
            </div>
            <span className="text-base font-bold tracking-tight bg-gray-100 border-2 border-l-0 border-gray-200 px-2 py-0.5">
              AgentAds
            </span>
          </div>

          <button
            onClick={() => console.log('Ad clicked:', SAMPLE_ADS[currentAd])}
            className="text-xs font-mono text-gray-600 tracking-tight hover:text-orange-600 transition-colors cursor-pointer"
          >
            <MatrixText text={SAMPLE_ADS[currentAd]} isActive={isTransitioning} />
          </button>
        </div>
      </header>

      <main className="flex-1 py-16 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-3xl font-semibold tracking-tight mb-3 max-w-3xl">
              <Typewriter
                onInit={(typewriter) => {
                  typewriter
                    .typeString('Monetize your AI agent with zero effort')
                    .start();
                }}
                options={{
                  delay: 25,
                  cursor: '_',
                  loop: false,
                }}
              />
            </h1>
            <p className="text-3xl font-normal tracking-tight text-black/40 max-w-3xl">
              Reach agent-first developers instantly
            </p>
          </div>

          {/* Toggle Buttons - No rounded corners */}
          <div className="mb-12">
            <div className="inline-flex bg-gray-100 p-0.5">
              <button
                onClick={() => setActiveTab('devs')}
                className={`px-5 py-2 text-xs font-medium tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'devs'
                    ? 'bg-orange-600 text-white'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                <kbd className="px-1 py-0 text-[9px] font-mono bg-orange-50 border border-orange-300 text-orange-600">E</kbd>
                Earn via ads
              </button>
              <button
                onClick={() => setActiveTab('orgs')}
                className={`px-5 py-2 text-xs font-medium tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'orgs'
                    ? 'bg-orange-600 text-white'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                <kbd className="px-1 py-0 text-[9px] font-mono bg-orange-50 border border-orange-300 text-orange-600">P</kbd>
                Post an Ad
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Dynamic Content + Quick Install */}
            <div className="max-w-lg">
              {activeTab === 'devs' ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">
                    Start earning in 30 seconds
                  </h3>

                  <ol className="space-y-2 mb-8">
                    {[
                      'Install our skill - agents earn while coding',
                      'View relevant ads between tasks for $0.10 each',
                      'Withdraw earnings instantly'
                    ].map((item, i) => (
                      <li key={i} className="flex text-base text-gray-800">
                        <span className="text-orange-600 font-semibold mr-3">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>

                  {/* Compact Quick Install */}
                  <div className="mb-8 bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Quick Install
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className={`text-xs px-2 py-0.5 uppercase tracking-wider transition-colors border ${
                          copied
                            ? 'border-orange-600 text-orange-600'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-3 text-xs text-gray-800 font-mono">
                      {DEVELOPER_SKILL}
                    </pre>
                  </div>

                  <div className="flex gap-8 pt-6 border-t border-gray-100">
                    <div>
                      <div className="text-3xl font-semibold text-orange-600">24/7</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-orange-600">$0.10</div>
                      <div className="text-xs text-gray-500">Per View</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">
                    Reach agent-first developers
                  </h3>

                  <ol className="space-y-2 mb-8">
                    {[
                      'Create targeted ads for agent-first developers in seconds',
                      'Pay $0.10 per view - only when agents engage',
                      'Track real-time performance and conversions'
                    ].map((item, i) => (
                      <li key={i} className="flex text-base text-gray-800">
                        <span className="text-orange-600 font-semibold mr-3">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>

                  {/* Compact Post Ad */}
                  <div className="mb-8 bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Post an Ad
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className={`text-xs px-2 py-0.5 uppercase tracking-wider transition-colors border ${
                          copied
                            ? 'border-orange-600 text-orange-600'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-3 text-xs text-gray-800 font-mono">
                      {ORG_SKILL}
                    </pre>
                  </div>

                  <div className="flex gap-8 pt-6 border-t border-gray-100">
                    <div>
                      <div className="text-3xl font-semibold text-orange-600">$0.10</div>
                      <div className="text-xs text-gray-500">CPC</div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-orange-600">100%</div>
                      <div className="text-xs text-gray-500">Targeted</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Terminal Animation */}
            <div>
              <TerminalFlow mode={activeTab === 'devs' ? 'devs' : 'orgs'} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5">
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
  )
}