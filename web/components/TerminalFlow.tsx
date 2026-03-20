'use client'

import { useState, useEffect, useRef } from 'react'

interface TerminalFlowProps {
  mode?: 'devs' | 'orgs'
}

const TerminalFlow = ({ mode = 'devs' }: TerminalFlowProps) => {
  const [lines, setLines] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const developerFlow = [
    { text: '$ npx skills add yash-atreya/AgentAds --skill ad-consumer', delay: 100 },
    { text: 'Installing skill... Done', delay: 400 },
    { text: '$ agent start', delay: 700 },
    { text: 'Skill added successfully', delay: 1000 },
    { text: '', delay: 1100 },
    { text: '[Agent working on code...]', delay: 1300 },
    { text: '', delay: 1500 },
    { text: '▸ View ad for $0.10? [Y/n]', delay: 1700 },
    { text: '$ y', delay: 2000 },
    { text: '', delay: 2100 },
    { text: '═══ [AD] cursor-composer.skill ═══', delay: 2300 },
    { text: '+ Earned $0.10', delay: 2600 },
    { text: '$ agentads balance', delay: 2900 },
    { text: 'Balance: $0.10 (1 view)', delay: 3200 },
    { text: '', delay: 3400 },
    { text: '[Agent continues working...]', delay: 3600 },
    { text: '', delay: 3800 },
    { text: '▸ View ad for $0.10? [Y/n]', delay: 4000 },
    { text: '$ y', delay: 4300 },
    { text: '═══ [AD] v0-vercel.skill ═══', delay: 4500 },
    { text: '+ Earned $0.10', delay: 4800 },
    { text: 'Balance: $0.20 (2 views)', delay: 5100 },
  ]

  const advertiserFlow = [
    { text: '$ npx skills add yash-atreya/AgentAds --skill ad-creator', delay: 100 },
    { text: 'Creating new ad campaign...', delay: 400 },
    { text: '', delay: 600 },
    { text: 'Title: Build APIs with our framework', delay: 800 },
    { text: 'Budget: $500', delay: 1200 },
    { text: 'Target: nodejs, typescript, react', delay: 1600 },
    { text: '', delay: 1800 },
    { text: 'Publishing ad...', delay: 2000 },
    { text: '✓ Ad #42851 published successfully', delay: 2400 },
    { text: '', delay: 2600 },
    { text: '$ agentads stats 42851', delay: 2800 },
    { text: '', delay: 3000 },
    { text: 'Live Statistics:', delay: 3200 },
    { text: '├─ Views: 12', delay: 3400 },
    { text: '├─ Clicks: 3', delay: 3600 },
    { text: '├─ Spent: $1.20', delay: 3800 },
    { text: '└─ CTR: 25%', delay: 4000 },
    { text: '', delay: 4200 },
    { text: '[Updating in real-time...]', delay: 4400 },
    { text: '├─ Views: 18', delay: 4800 },
    { text: '├─ Clicks: 5', delay: 5000 },
    { text: '└─ Spent: $1.80', delay: 5200 },
  ]

  const allLines = mode === 'devs' ? developerFlow : advertiserFlow

  // Reset when mode changes
  useEffect(() => {
    setLines([])
    setCurrentIndex(0)
  }, [mode])

  useEffect(() => {
    if (currentIndex < allLines.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, allLines[currentIndex].text])
        setCurrentIndex(currentIndex + 1)
      }, allLines[currentIndex].delay)
      return () => clearTimeout(timer)
    } else {
      // Reset after a pause
      const resetTimer = setTimeout(() => {
        setLines([])
        setCurrentIndex(0)
      }, 3000)
      return () => clearTimeout(resetTimer)
    }
  }, [currentIndex])

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="h-[450px] bg-gray-50 border border-gray-200 font-mono overflow-hidden relative lg:-mt-16">
      {/* Hatching pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0, 0, 0, 0.05) 10px,
              rgba(0, 0, 0, 0.05) 11px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(0, 0, 0, 0.05) 10px,
              rgba(0, 0, 0, 0.05) 11px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.02) 2px,
              rgba(0, 0, 0, 0.02) 3px
            )
          `
        }}
      />
      <div className="bg-white px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-medium">
            {mode === 'devs' ? 'Live Demo - Watch agents earning' : 'Live Demo - Post and track ads'}
          </span>
        </div>
        <div className="flex gap-1">
          <span className="text-gray-400 text-[10px]">─</span>
          <span className="text-gray-400 text-[10px]">□</span>
          <span className="text-gray-400 text-[10px]">×</span>
        </div>
      </div>

      <div ref={scrollRef} className="p-4 text-[11px] leading-relaxed h-full overflow-y-auto">
        <div className="text-gray-400 mb-2">
          {mode === 'devs' ? '// Agent earning passively while you work' : '// Create and track ad campaigns'}
        </div>
        {lines.map((line, i) => (
          <div key={i} className="mb-1">
            {line.startsWith('$') ? (
              <div className="flex items-center text-gray-700">
                <span className="text-gray-400 mr-1">$</span>
                <span>{line.substring(2)}</span>
              </div>
            ) : line.startsWith('+') ? (
              <div className="text-green-600">{line}</div>
            ) : line.startsWith('✓') ? (
              <div className="text-green-600">{line}</div>
            ) : line.startsWith('▸') ? (
              <div className="text-orange-600 font-medium">{line}</div>
            ) : line.startsWith('═══') ? (
              <div className="text-orange-600">{line}</div>
            ) : line.includes('Views:') || line.includes('Clicks:') || line.includes('Spent:') || line.includes('CTR:') ? (
              <div className="text-orange-600 ml-4">{line}</div>
            ) : line.startsWith('[') || line.includes('Balance:') || line.includes('Downloading') || line.includes('Skill added') || line.includes('Statistics:') || line.includes('Title:') || line.includes('Budget:') || line.includes('Target:') ? (
              <div className="text-gray-500 ml-4">{line}</div>
            ) : line === '' ? (
              <div>&nbsp;</div>
            ) : (
              <div className="text-gray-500 ml-4">{line}</div>
            )}
          </div>
        ))}
        {currentIndex < allLines.length && (
          <span className={`inline-block w-1.5 h-3 bg-orange-600 ${showCursor ? 'opacity-100' : 'opacity-0'}`}></span>
        )}
      </div>
    </div>
  )
}

export default TerminalFlow