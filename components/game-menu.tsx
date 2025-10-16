"use client"

import { Button } from "@/components/ui/button"
import { Play, Users, Bot, Trophy, Crown } from "lucide-react"
import { useEffect, useState } from "react"

interface Score {
  playerName: string
  score: number
  level: number
  theme: string
}

interface GameMenuProps {
  onStartGame: (mode: "single" | "multi" | "ai") => void
  highScore: number
}

export default function GameMenu({ onStartGame, highScore }: GameMenuProps) {
  const [leaderboard, setLeaderboard] = useState<Score[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        setLeaderboard(data)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
    
    return () => {
      setMounted(false)
    }
  }, [])

  // Don't render the leaderboard until we're on the client side
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-green-950">
        <div className="text-green-400">Loading...</div>
      </div>
    )
  }

  // Handle the case when leaderboard is still loading or failed to load
  const displayLeaderboard = leaderboard || []
  const hasLeaderboard = displayLeaderboard.length > 0

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-green-950 py-8">
      <div className="relative z-10 text-center space-y-6 px-4 w-full max-w-5xl">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-green-400">SNAKE</h1>
          <h2 className="text-3xl md:text-5xl font-bold text-green-300">EVOLUTION</h2>
          <p className="text-green-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The most addictive snake game. Evolve through levels, collect power-ups, and dominate the arena.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Modes */}
          <div className="bg-green-900/50 backdrop-blur-sm border border-green-800 rounded-xl p-4">
            <h3 className="text-xl font-bold text-green-300 mb-4">Game Modes</h3>
            <div className="space-y-3">
              <Button
                onClick={() => onStartGame("single")}
                className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-500 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Single Player
              </Button>
              <Button
                onClick={() => onStartGame("multi")}
                variant="outline"
                className="w-full h-14 text-base font-semibold border-green-600 text-green-300 hover:bg-green-900/50"
              >
                <Users className="mr-2 h-4 w-4" />
                Multiplayer
              </Button>
              <Button
                onClick={() => onStartGame("ai")}
                variant="outline"
                className="w-full h-14 text-base font-semibold border-green-600 text-green-300 hover:bg-green-900/50"
              >
                <Bot className="mr-2 h-4 w-4" />
                VS AI
              </Button>
            </div>

            {highScore > 0 && (
              <div className="mt-6 p-3 bg-green-800/30 rounded-lg border border-green-700/50">
                <p className="text-green-300 text-xs uppercase tracking-wider">Your High Score</p>
                <p className="text-3xl font-bold text-green-100">{highScore.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2 bg-green-900/50 backdrop-blur-sm border border-green-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-300">Leaderboard</h3>
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-pulse text-green-300">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                {hasLeaderboard ? (
                  displayLeaderboard.map((entry, index) => (
                    <div 
                      key={`${entry.playerName}-${index}`} 
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        index === 0 ? 'bg-yellow-900/30 border border-yellow-800/50' : 'bg-green-800/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full ${
                          index === 0 ? 'bg-yellow-500 text-yellow-900' : 'bg-green-700 text-green-200'
                        } font-bold text-sm`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-green-100">{entry.playerName}</p>
                          <p className="text-xs text-green-400">Level {entry.level} • {entry.theme}</p>
                        </div>
                      </div>
                      <span className={`text-base font-bold ${
                        index === 0 ? 'text-yellow-400' : 'text-green-300'
                      }`}>
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-green-400">
                    No scores yet. Be the first to play!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-green-400 text-xs mt-6">
          <p>Use arrow keys to move • Collect food to grow • Avoid walls and yourself</p>
        </div>
      </div>
    </div>
  )
}