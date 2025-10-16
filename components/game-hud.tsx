"use client"

import { Trophy, Ghost, Snowflake } from "lucide-react"

interface GameHUDProps {
  score: number
  level: number
  isPaused: boolean
  activePowerUps: string[]
}

export default function GameHUD({ score, level, isPaused, activePowerUps }: GameHUDProps) {
  return (
    <div className="w-full max-w-4xl mb-6 flex items-center justify-between px-4">
      {/* Score */}
      <div className="flex items-center gap-6">
        <div className="bg-green-900/80 border border-green-700/50 rounded-lg px-6 py-3 backdrop-blur-sm shadow-lg">
          <p className="text-green-300 text-xs uppercase tracking-wider">Score</p>
          <p className="text-3xl font-bold text-green-100">{score}</p>
        </div>

        <div className="bg-green-900/80 border border-green-700/50 rounded-lg px-6 py-3 backdrop-blur-sm shadow-lg">
          <p className="text-green-300 text-xs uppercase tracking-wider">Level</p>
          <p className="text-3xl font-bold text-green-100">{level}</p>
        </div>
      </div>

      {/* Active Power-ups */}
      <div className="flex items-center gap-3">
        {activePowerUps.includes("freeze") && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 animate-pulse shadow-lg">
            <Snowflake className="h-6 w-6 text-blue-300" />
          </div>
        )}
        {activePowerUps.includes("ghost") && (
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 animate-pulse shadow-lg">
            <Ghost className="h-6 w-6 text-purple-300" />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        {isPaused && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-yellow-300 font-semibold">PAUSED</p>
          </div>
        )}

        <div className="bg-green-900/80 border border-green-700/50 rounded-lg p-3 shadow-lg">
          <Trophy className="h-6 w-6 text-yellow-400" />
        </div>
      </div>
    </div>
  )
}