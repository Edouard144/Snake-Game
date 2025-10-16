"use client"

import { useState } from "react"
import GameMenu from "./game-menu"
import GameBoard from "./game-board"
import GameOver from "./game-over"

export type GameState = "menu" | "playing" | "paused" | "gameover" | "multiplayer" | "ai"
export type Theme = "forest" | "desert" | "neon" | "galaxy"

export interface GameStats {
  score: number
  highScore: number
  level: number
  theme: Theme
}

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [gameStats, setGameStats] = useState<GameStats>(() => {
    // Initialize with default values first
    const defaultStats = {
      score: 0,
      highScore: 0,
      level: 1,
      theme: "neon" as const,
    };
    
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      return {
        ...defaultStats,
        highScore: Number.parseInt(localStorage.getItem("snakeHighScore") || "0"),
      };
    }
    
    return defaultStats;
  });

  const startGame = (mode: "single" | "multi" | "ai") => {
    setGameStats((prev) => ({ ...prev, score: 0, level: 1 }))
    if (mode === "single") {
      setGameState("playing")
    } else if (mode === "multi") {
      setGameState("multiplayer")
    } else {
      setGameState("ai")
    }
  }

  const endGame = async (finalScore: number) => {
    const newHighScore = Math.max(finalScore, gameStats.highScore)
    localStorage.setItem("snakeHighScore", newHighScore.toString())
    
    try {
      // Save score to the new API endpoint
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: 'Player', // You might want to get this from user input
          score: finalScore,
          level: gameStats.level,
          theme: gameStats.theme,
        }),
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
    
    setGameStats((prev) => ({ ...prev, score: finalScore, highScore: newHighScore }));
    setGameState("gameover");
  }

  const returnToMenu = () => {
    setGameState("menu")
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {gameState === "menu" && <GameMenu onStartGame={startGame} highScore={gameStats.highScore} />}

      {(gameState === "playing" || gameState === "multiplayer" || gameState === "ai") && (
        <GameBoard
          mode={gameState === "multiplayer" ? "multi" : gameState === "ai" ? "ai" : "single"}
          onGameOver={endGame}
          onUpdateStats={setGameStats}
          currentStats={gameStats}
        />
      )}

      {gameState === "gameover" && (
        <GameOver
          score={gameStats.score}
          highScore={gameStats.highScore}
          level={gameStats.level}
          onRestart={() => startGame("single")}
          onMenu={returnToMenu}
        />
      )}
    </div>
  )
}
