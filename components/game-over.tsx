"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Home, Share2 } from "lucide-react"

interface GameOverProps {
  score: number
  highScore: number
  level: number
  onRestart: () => void
  onMenu: () => void
}

export default function GameOver({ score, highScore, level, onRestart, onMenu }: GameOverProps) {
  const isNewHighScore = score === highScore && score > 0

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-danger rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-1 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Game Over Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-danger text-glow">GAME OVER</h1>
          {isNewHighScore && (
            <p className="text-2xl md:text-3xl font-bold text-primary animate-pulse">🎉 NEW HIGH SCORE! 🎉</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <p className="text-muted text-sm uppercase tracking-wider">Score</p>
            <p className="text-3xl font-bold text-foreground">{score}</p>
          </div>

          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <p className="text-muted text-sm uppercase tracking-wider">Level</p>
            <p className="text-3xl font-bold text-accent-2">{level}</p>
          </div>

          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <p className="text-muted text-sm uppercase tracking-wider">Best</p>
            <p className="text-3xl font-bold text-primary">{highScore}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <Button
            size="lg"
            onClick={onRestart}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary-hover text-background glow-primary"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Play Again
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onMenu}
            className="w-full h-14 text-lg font-semibold border-2 bg-transparent"
          >
            <Home className="mr-2 h-5 w-5" />
            Main Menu
          </Button>

          <Button size="lg" variant="ghost" className="w-full h-14 text-lg font-semibold">
            <Share2 className="mr-2 h-5 w-5" />
            Share Score
          </Button>
        </div>
      </div>
    </div>
  )
}
