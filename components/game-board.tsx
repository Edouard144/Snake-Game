"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { GameStats, Theme } from "./snake-game"
import GameHUD from "./game-hud"

interface GameBoardProps {
  mode: "single" | "multi" | "ai"
  onGameOver: (score: number) => void
  onUpdateStats: (stats: GameStats) => void
  currentStats: GameStats
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type PowerUpType = "normal" | "super" | "freeze" | "ghost" | "bomb"

interface Position {
  x: number
  y: number
}

interface PowerUp {
  position: Position
  type: PowerUpType
  expiresAt?: number
}

interface Snake {
  body: Position[]
  direction: Direction
  nextDirection: Direction
  color: string
  glowColor: string
}

const GRID_SIZE = 20
const INITIAL_SPEED = 200 // Increased from 150 to slow down the snake
const SPEED_INCREMENT = 5 // Reduced from 10 to make speed increases less dramatic
const POINTS_PER_LEVEL = 50

export default function GameBoard({ mode, onGameOver, onUpdateStats, currentStats }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gridWidth, setGridWidth] = useState(30)
  const [gridHeight, setGridHeight] = useState(20)
  const [isPaused, setIsPaused] = useState(false)

  // Game state
  const gameStateRef = useRef({
    snake1: {
      body: [{ x: 10, y: 10 }],
      direction: "RIGHT" as Direction,
      nextDirection: "RIGHT" as Direction,
      color: "#00ff88",
      glowColor: "rgba(0, 255, 136, 0.5)",
    } as Snake,
    snake2:
      mode === "multi"
        ? ({
            body: [{ x: 20, y: 10 }],
            direction: "LEFT" as Direction,
            nextDirection: "LEFT" as Direction,
            color: "#ff00ff",
            glowColor: "rgba(255, 0, 255, 0.5)",
          } as Snake)
        : null,
    aiSnake:
      mode === "ai"
        ? ({
            body: [{ x: 20, y: 10 }],
            direction: "LEFT" as Direction,
            nextDirection: "LEFT" as Direction,
            color: "#ff6600",
            glowColor: "rgba(255, 102, 0, 0.5)",
          } as Snake)
        : null,
    powerUps: [] as PowerUp[],
    obstacles: [] as Position[],
    movingObstacles: [] as Array<{ position: Position; direction: Direction; speed: number }>,
    portals: [] as Array<{ entry: Position; exit: Position }>,
    score: 0,
    level: 1,
    speed: INITIAL_SPEED,
    theme: "neon" as Theme,
    activePowerUps: new Set<string>(),
    gameRunning: true,
  })

  // Initialize canvas size
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 1200)
      const maxHeight = window.innerHeight - 200

      const cellsX = Math.floor(maxWidth / GRID_SIZE)
      const cellsY = Math.floor(maxHeight / GRID_SIZE)

      setGridWidth(Math.max(cellsX, 20))
      setGridHeight(Math.max(cellsY, 15))
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  // Spawn power-up
  const spawnPowerUp = useCallback(() => {
    const state = gameStateRef.current
    const types: PowerUpType[] = ["normal", "normal", "normal", "super", "freeze", "ghost", "bomb"]
    const type = types[Math.floor(Math.random() * types.length)]

    let position: Position
    let attempts = 0

    do {
      position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }
      attempts++
    } while (
      attempts < 50 &&
      (state.snake1.body.some((seg) => seg.x === position.x && seg.y === position.y) ||
        (state.snake2 && state.snake2.body.some((seg) => seg.x === position.x && seg.y === position.y)) ||
        (state.aiSnake && state.aiSnake.body.some((seg) => seg.x === position.x && seg.y === position.y)) ||
        state.obstacles.some((obs) => obs.x === position.x && obs.y === position.y) ||
        state.movingObstacles.some((mo) => mo.position.x === position.x && mo.position.y === position.y) ||
        Math.abs(position.x - state.snake1.body[0].x) < 3 ||
        Math.abs(position.y - state.snake1.body[0].y) < 3)
    )

    state.powerUps.push({ position, type })
  }, [gridWidth, gridHeight])

  // Spawn obstacles
  const spawnObstacles = useCallback(() => {
    const state = gameStateRef.current
    const numObstacles = Math.min(Math.floor(state.level / 2), 10)

    state.obstacles = []
    state.movingObstacles = []

    for (let i = 0; i < numObstacles; i++) {
      let position: Position
      let attempts = 0

      do {
        position = {
          x: Math.floor(Math.random() * gridWidth),
          y: Math.floor(Math.random() * gridHeight),
        }
        attempts++
      } while (
        attempts < 50 &&
        (state.snake1.body.some((seg) => seg.x === position.x && seg.y === position.y) ||
          (state.snake2 && state.snake2.body.some((seg) => seg.x === position.x && seg.y === position.y)) ||
          (state.aiSnake && state.aiSnake.body.some((seg) => seg.x === position.x && seg.y === position.y)) ||
          state.obstacles.some((obs) => obs.x === position.x && obs.y === position.y) ||
          Math.abs(position.x - state.snake1.body[0].x) < 3 ||
          Math.abs(position.y - state.snake1.body[0].y) < 3)
      )

      // Static obstacle
      if (i % 3 !== 0) {
        state.obstacles.push(position)
      } else {
        // Moving obstacle
        const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"]
        state.movingObstacles.push({
          position,
          direction: directions[Math.floor(Math.random() * directions.length)],
          speed: 3,
        })
      }
    }
  }, [gridWidth, gridHeight])

  // Spawn portals
  const spawnPortals = useCallback(() => {
    const state = gameStateRef.current

    if (state.level >= 5 && state.level % 5 === 0 && state.portals.length === 0) {
      let entry: Position, exit: Position
      let attempts = 0

      do {
        entry = {
          x: Math.floor(Math.random() * gridWidth),
          y: Math.floor(Math.random() * gridHeight),
        }
        exit = {
          x: Math.floor(Math.random() * gridWidth),
          y: Math.floor(Math.random() * gridHeight),
        }
        attempts++
      } while (
        attempts < 50 &&
        (Math.abs(entry.x - exit.x) < 5 ||
          Math.abs(entry.y - exit.y) < 5 ||
          state.obstacles.some(
            (obs) => (obs.x === entry.x && obs.y === entry.y) || (obs.x === exit.x && obs.y === exit.y),
          ))
      )

      state.portals.push({ entry, exit })
    }
  }, [gridWidth, gridHeight])

  // Check collision
  const checkCollision = useCallback(
    (head: Position, snake: Snake, checkSelf = true): boolean => {
      const state = gameStateRef.current

      // Wall collision (unless ghost mode active)
      if (!state.activePowerUps.has("ghost")) {
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
          return true
        }
      }

      // Self collision
      if (checkSelf) {
        const body = snake.body.slice(1)
        if (body.some((seg) => seg.x === head.x && seg.y === head.y)) {
          return true
        }
      }

      // Other snake collision
      if (mode === "multi" && state.snake2) {
        const otherSnake = snake === state.snake1 ? state.snake2 : state.snake1
        if (otherSnake.body.some((seg) => seg.x === head.x && seg.y === head.y)) {
          return true
        }
      }

      if (mode === "ai" && state.aiSnake) {
        // Player hits AI
        if (snake === state.snake1 && state.aiSnake.body.some((seg) => seg.x === head.x && seg.y === head.y)) {
          return true
        }
        // AI hits player
        if (snake === state.aiSnake && state.snake1.body.some((seg) => seg.x === head.x && seg.y === head.y)) {
          return true
        }
      }

      // Obstacle collision
      if (state.obstacles.some((obs) => obs.x === head.x && obs.y === head.y)) {
        return true
      }

      // Moving obstacle collision
      if (state.movingObstacles.some((mo) => mo.position.x === head.x && mo.position.y === head.y)) {
        return true
      }

      return false
    },
    [gridWidth, gridHeight, mode],
  )

  // Move snake
  const moveSnake = useCallback(
    (snake: Snake): boolean => {
      const state = gameStateRef.current
      snake.direction = snake.nextDirection

      const head = { ...snake.body[0] }

      switch (snake.direction) {
        case "UP":
          head.y--
          break
        case "DOWN":
          head.y++
          break
        case "LEFT":
          head.x--
          break
        case "RIGHT":
          head.x++
          break
      }

      // Wrap around if ghost mode
      if (state.activePowerUps.has("ghost")) {
        if (head.x < 0) head.x = gridWidth - 1
        if (head.x >= gridWidth) head.x = 0
        if (head.y < 0) head.y = gridHeight - 1
        if (head.y >= gridHeight) head.y = 0
      }

      const portal = state.portals.find((p) => p.entry.x === head.x && p.entry.y === head.y)
      if (portal) {
        head.x = portal.exit.x
        head.y = portal.exit.y
      }

      // Check collision
      if (checkCollision(head, snake)) {
        return false
      }

      snake.body.unshift(head)

      // Check power-up collection
      const powerUpIndex = state.powerUps.findIndex((pu) => pu.position.x === head.x && pu.position.y === head.y)

      if (powerUpIndex !== -1) {
        const powerUp = state.powerUps[powerUpIndex]
        state.powerUps.splice(powerUpIndex, 1)

        switch (powerUp.type) {
          case "normal":
            state.score += 10
            break
          case "super":
            state.score += 20
            if (snake.body.length > 3) {
              snake.body.splice(-2, 2)
            }
            break
          case "freeze":
            state.score += 15
            state.activePowerUps.add("freeze")
            setTimeout(() => state.activePowerUps.delete("freeze"), 5000)
            break
          case "ghost":
            state.score += 15
            state.activePowerUps.add("ghost")
            setTimeout(() => state.activePowerUps.delete("ghost"), 3000)
            break
          case "bomb":
            state.score = Math.max(0, state.score - 20)
            if (snake.body.length > 3) {
              snake.body.splice(-2, 2)
            }
            break
        }

        // Spawn new power-up
        if (state.powerUps.length < 3) {
          spawnPowerUp()
        }

        // Check level up
        const newLevel = Math.floor(state.score / POINTS_PER_LEVEL) + 1
        if (newLevel > state.level) {
          state.level = newLevel
          state.speed = Math.max(50, INITIAL_SPEED - (newLevel - 1) * SPEED_INCREMENT)

          spawnObstacles()
          spawnPortals()

          // Expand grid slightly
          if (newLevel % 3 === 0) {
            setGridWidth((prev) => Math.min(prev + 2, 50))
            setGridHeight((prev) => Math.min(prev + 2, 40))
          }
        }
      } else {
        snake.body.pop()
      }

      return true
    },
    [checkCollision, spawnPowerUp, spawnObstacles, spawnPortals],
  )

  // Update moving obstacles
  const updateMovingObstacles = useCallback(() => {
    const state = gameStateRef.current

    state.movingObstacles.forEach((obstacle) => {
      const { position, direction } = obstacle

      // Move obstacle
      switch (direction) {
        case "UP":
          position.y--
          if (position.y < 0) obstacle.direction = "DOWN"
          break
        case "DOWN":
          position.y++
          if (position.y >= gridHeight) obstacle.direction = "UP"
          break
        case "LEFT":
          position.x--
          if (position.x < 0) obstacle.direction = "RIGHT"
          break
        case "RIGHT":
          position.x++
          if (position.x >= gridWidth) obstacle.direction = "LEFT"
          break
      }
    })
  }, [gridWidth, gridHeight])

  const getAIDirection = useCallback((): Direction => {
    const state = gameStateRef.current
    if (!state.aiSnake) return "RIGHT"

    const aiHead = state.aiSnake.body[0]
    const currentDir = state.aiSnake.direction

    // Find nearest power-up
    let target: Position | null = null
    let minDist = Number.POSITIVE_INFINITY

    state.powerUps.forEach((pu) => {
      if (pu.type !== "bomb") {
        const dist = Math.abs(pu.position.x - aiHead.x) + Math.abs(pu.position.y - aiHead.y)
        if (dist < minDist) {
          minDist = dist
          target = pu.position
        }
      }
    })

    if (!target) {
      // Random movement if no target
      const possibleDirs: Direction[] = []
      if (currentDir !== "DOWN") possibleDirs.push("UP")
      if (currentDir !== "UP") possibleDirs.push("DOWN")
      if (currentDir !== "RIGHT") possibleDirs.push("LEFT")
      if (currentDir !== "LEFT") possibleDirs.push("RIGHT")
      return possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
    }

    // Simple pathfinding toward target
    const dx = target.x - aiHead.x
    const dy = target.y - aiHead.y

    const possibleMoves: Array<{ dir: Direction; priority: number }> = []

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && currentDir !== "LEFT") possibleMoves.push({ dir: "RIGHT", priority: Math.abs(dx) })
      if (dx < 0 && currentDir !== "RIGHT") possibleMoves.push({ dir: "LEFT", priority: Math.abs(dx) })
      if (dy > 0 && currentDir !== "UP") possibleMoves.push({ dir: "DOWN", priority: Math.abs(dy) })
      if (dy < 0 && currentDir !== "DOWN") possibleMoves.push({ dir: "UP", priority: Math.abs(dy) })
    } else {
      if (dy > 0 && currentDir !== "UP") possibleMoves.push({ dir: "DOWN", priority: Math.abs(dy) })
      if (dy < 0 && currentDir !== "DOWN") possibleMoves.push({ dir: "UP", priority: Math.abs(dy) })
      if (dx > 0 && currentDir !== "LEFT") possibleMoves.push({ dir: "RIGHT", priority: Math.abs(dx) })
      if (dx < 0 && currentDir !== "RIGHT") possibleMoves.push({ dir: "LEFT", priority: Math.abs(dx) })
    }

    // Check for safe moves
    for (const move of possibleMoves.sort((a, b) => b.priority - a.priority)) {
      const testHead = { ...aiHead }
      switch (move.dir) {
        case "UP":
          testHead.y--
          break
        case "DOWN":
          testHead.y++
          break
        case "LEFT":
          testHead.x--
          break
        case "RIGHT":
          testHead.x++
          break
      }

      // Check if move is safe
      const isSafe =
        testHead.x >= 0 &&
        testHead.x < gridWidth &&
        testHead.y >= 0 &&
        testHead.y < gridHeight &&
        !state.aiSnake.body.some((seg) => seg.x === testHead.x && seg.y === testHead.y) &&
        !state.obstacles.some((obs) => obs.x === testHead.x && obs.y === testHead.y) &&
        !state.movingObstacles.some((mo) => mo.position.x === testHead.x && mo.position.y === testHead.y)

      if (isSafe) {
        return move.dir
      }
    }

    // Fallback: try any safe direction
    const allDirs: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"]
    for (const dir of allDirs) {
      if (
        (dir === "UP" && currentDir === "DOWN") ||
        (dir === "DOWN" && currentDir === "UP") ||
        (dir === "LEFT" && currentDir === "RIGHT") ||
        (dir === "RIGHT" && currentDir === "LEFT")
      ) {
        continue
      }

      const testHead = { ...aiHead }
      switch (dir) {
        case "UP":
          testHead.y--
          break
        case "DOWN":
          testHead.y++
          break
        case "LEFT":
          testHead.x--
          break
        case "RIGHT":
          testHead.x++
          break
      }

      const isSafe =
        testHead.x >= 0 &&
        testHead.x < gridWidth &&
        testHead.y >= 0 &&
        testHead.y < gridHeight &&
        !state.aiSnake!.body.some((seg) => seg.x === testHead.x && seg.y === testHead.y)

      if (isSafe) return dir
    }

    return currentDir
  }, [gridWidth, gridHeight])

  // Game loop
  useEffect(() => {
    if (isPaused) return

    const state = gameStateRef.current

    // Initial power-ups
    if (state.powerUps.length === 0) {
      spawnPowerUp()
    }

    // Frame counter for moving obstacles
    let frameCount = 0

    const gameLoop = setInterval(() => {
      if (!state.gameRunning) return

      const speed = state.activePowerUps.has("freeze") ? state.speed * 1.5 : state.speed

      frameCount++
      if (frameCount % 3 === 0) {
        updateMovingObstacles()
      }

      if (mode === "ai" && state.aiSnake) {
        state.aiSnake.nextDirection = getAIDirection()
      }

      // Move snakes
      const snake1Alive = moveSnake(state.snake1)
      if (!snake1Alive) {
        state.gameRunning = false
        onGameOver(state.score)
        return
      }

      if (mode === "multi" && state.snake2) {
        const snake2Alive = moveSnake(state.snake2)
        if (!snake2Alive) {
          state.gameRunning = false
          onGameOver(state.score)
          return
        }
      }

      if (mode === "ai" && state.aiSnake) {
        const aiAlive = moveSnake(state.aiSnake)
        if (!aiAlive) {
          // AI died, player wins - bonus points
          state.score += 100
        }
      }

      // Update stats
      onUpdateStats({
        score: state.score,
        highScore: currentStats.highScore,
        level: state.level,
        theme: state.theme,
      })

      // Render
      render()
    }, state.speed)

    return () => clearInterval(gameLoop)
  }, [
    isPaused,
    moveSnake,
    onGameOver,
    onUpdateStats,
    currentStats.highScore,
    mode,
    spawnPowerUp,
    updateMovingObstacles,
    getAIDirection,
  ])

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = gameStateRef.current

    // Clear the canvas with dark green background
    ctx.fillStyle = '#0a1f0a' // Dark green background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add subtle grid lines
    ctx.strokeStyle = '#1a3a1a' // Slightly lighter green for grid
    ctx.lineWidth = 0.5

    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw grid
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath()
      ctx.moveTo(x * GRID_SIZE, 0)
      ctx.lineTo(x * GRID_SIZE, gridHeight * GRID_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * GRID_SIZE)
      ctx.lineTo(gridWidth * GRID_SIZE, y * GRID_SIZE)
      ctx.stroke()
    }

    state.portals.forEach((portal) => {
      // Entry portal
      const entryX = portal.entry.x * GRID_SIZE
      const entryY = portal.entry.y * GRID_SIZE

      ctx.shadowBlur = 30
      ctx.shadowColor = "#00d4ff"
      ctx.fillStyle = "#00d4ff"
      ctx.beginPath()
      ctx.arc(entryX + GRID_SIZE / 2, entryY + GRID_SIZE / 2, GRID_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

      // Exit portal
      const exitX = portal.exit.x * GRID_SIZE
      const exitY = portal.exit.y * GRID_SIZE

      ctx.shadowColor = "#ff00ff"
      ctx.fillStyle = "#ff00ff"
      ctx.beginPath()
      ctx.arc(exitX + GRID_SIZE / 2, exitY + GRID_SIZE / 2, GRID_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    state.obstacles.forEach((obstacle) => {
      const x = obstacle.x * GRID_SIZE
      const y = obstacle.y * GRID_SIZE

      ctx.shadowBlur = 10
      ctx.shadowColor = "#666666"
      ctx.fillStyle = "#333333"
      ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2)
      ctx.shadowBlur = 0
    })

    state.movingObstacles.forEach((obstacle) => {
      const x = obstacle.position.x * GRID_SIZE
      const y = obstacle.position.y * GRID_SIZE

      ctx.shadowBlur = 15
      ctx.shadowColor = "#ff3366"
      ctx.fillStyle = "#ff3366"
      ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
      ctx.shadowBlur = 0
    })

    // Draw power-ups
    state.powerUps.forEach((powerUp) => {
      const x = powerUp.position.x * GRID_SIZE
      const y = powerUp.position.y * GRID_SIZE

      let color = "#ff00ff"
      switch (powerUp.type) {
        case "normal":
          color = "#ff00ff"
          break
        case "super":
          color = "#00d4ff"
          break
        case "freeze":
          color = "#00d4ff"
          break
        case "ghost":
          color = "#ffffff"
          break
        case "bomb":
          color = "#ff3366"
          break
      }

      ctx.shadowBlur = 20
      ctx.shadowColor = color
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw snake 1
    state.snake1.body.forEach((seg, i) => {
      const x = seg.x * GRID_SIZE
      const y = seg.y * GRID_SIZE

      ctx.shadowBlur = i === 0 ? 20 : 10
      ctx.shadowColor = state.snake1.glowColor
      ctx.fillStyle = state.snake1.color
      ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
      ctx.shadowBlur = 0
    })

    // Draw snake 2
    if (mode === "multi" && state.snake2) {
      state.snake2.body.forEach((seg, i) => {
        const x = seg.x * GRID_SIZE
        const y = seg.y * GRID_SIZE

        ctx.shadowBlur = i === 0 ? 20 : 10
        ctx.shadowColor = state.snake2!.glowColor
        ctx.fillStyle = state.snake2!.color
        ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
        ctx.shadowBlur = 0
      })
    }

    if (mode === "ai" && state.aiSnake) {
      state.aiSnake.body.forEach((seg, i) => {
        const x = seg.x * GRID_SIZE
        const y = seg.y * GRID_SIZE

        ctx.shadowBlur = i === 0 ? 20 : 10
        ctx.shadowColor = state.aiSnake!.glowColor
        ctx.fillStyle = state.aiSnake!.color
        ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
        ctx.shadowBlur = 0
      })
    }
  }, [gridWidth, gridHeight, mode])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      if (e.key === "Escape") {
        setIsPaused((prev) => !prev)
        return
      }

      // Player 1 controls (Arrow keys)
      const snake1 = state.snake1
      switch (e.key) {
        case "ArrowUp":
          if (snake1.direction !== "DOWN") snake1.nextDirection = "UP"
          break
        case "ArrowDown":
          if (snake1.direction !== "UP") snake1.nextDirection = "DOWN"
          break
        case "ArrowLeft":
          if (snake1.direction !== "RIGHT") snake1.nextDirection = "LEFT"
          break
        case "ArrowRight":
          if (snake1.direction !== "LEFT") snake1.nextDirection = "RIGHT"
          break
      }

      // Player 2 controls (WASD)
      if (mode === "multi" && state.snake2) {
        const snake2 = state.snake2
        switch (e.key.toLowerCase()) {
          case "w":
            if (snake2.direction !== "DOWN") snake2.nextDirection = "UP"
            break
          case "s":
            if (snake2.direction !== "UP") snake2.nextDirection = "DOWN"
            break
          case "a":
            if (snake2.direction !== "RIGHT") snake2.nextDirection = "LEFT"
            break
          case "d":
            if (snake2.direction !== "LEFT") snake2.nextDirection = "RIGHT"
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [mode])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <GameHUD
        score={currentStats.score}
        level={currentStats.level}
        isPaused={isPaused}
        activePowerUps={Array.from(gameStateRef.current.activePowerUps)}
      />

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={gridWidth * GRID_SIZE}
          height={gridHeight * GRID_SIZE}
          className="border-2 border-border rounded-lg shadow-2xl"
        />

        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-foreground">PAUSED</h2>
              <p className="text-muted">Press ESC to resume</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-muted text-sm space-y-1">
        <p>
          Player 1: Arrow Keys {mode === "multi" && "| Player 2: WASD"}
          {mode === "ai" && "| Orange snake is AI"}
        </p>
        <p>Press ESC to pause</p>
      </div>
    </div>
  )
}
