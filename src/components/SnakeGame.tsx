import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Play, Pause, Trophy, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION: Direction = 'RIGHT';
const GAME_SPEED = 150;

export const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved) : 0;
  });

  const gameRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (!gameRunning || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setGameRunning(false);
        toast({ title: "💀 Game Over!", description: `Final Score: ${score}` });
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setGameRunning(false);
        toast({ title: "💀 Game Over!", description: `Final Score: ${score}` });
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snake-high-score', newScore.toString());
            toast({ title: "🎉 New High Score!", description: `${newScore} points!` });
          } else {
            toast({ title: "🍎 Delicious! +10 points" });
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, gameRunning, gameOver, food, score, highScore, generateFood]);

  const handleDirectionChange = useCallback((newDirection: Direction) => {
    if (!gameRunning) return;
    
    // Prevent reverse direction
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    
    if (opposites[direction] !== newDirection) {
      setDirection(newDirection);
    }
  }, [direction, gameRunning]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameRunning(true);
    toast({ title: "🎮 Game Started! Let's go!" });
  };

  const pauseGame = () => {
    setGameRunning(!gameRunning);
    toast({ title: gameRunning ? "⏸️ Game Paused" : "▶️ Game Resumed" });
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameRunning(false);
    toast({ title: "🔄 Game Reset" });
  };

  // Game loop
  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleDirectionChange('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (gameOver) {
            startGame();
          } else {
            pauseGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleDirectionChange, gameOver, gameRunning]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Minimum swipe distance
    if (Math.max(absDeltaX, absDeltaY) < 30) return;

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      handleDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      // Vertical swipe
      handleDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
    }

    touchStartRef.current = null;
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg">
            SNAKE
          </h1>
          <div className="absolute -top-2 -right-2 animate-glow-pulse">
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        {/* Score Display */}
        <div className="flex justify-center gap-8">
          <Card className="px-6 py-3 bg-gradient-card border-game-border shadow-glow-primary">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{score}</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </Card>
          <Card className="px-6 py-3 bg-gradient-card border-game-border shadow-glow-primary">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-primary" />
                <div className="text-2xl font-bold text-primary">{highScore}</div>
              </div>
              <div className="text-sm text-muted-foreground">Best</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Game Board */}
      <Card className="p-8 bg-gradient-card border-2 border-game-border shadow-2xl shadow-primary/20 animate-scale-in">
        <div
          ref={gameRef}
          className="relative bg-gradient-game-bg border-2 border-game-border rounded-xl overflow-hidden"
          style={{
            width: GRID_SIZE * 20,
            height: GRID_SIZE * 20,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div key={`row-${i}`}>
                {Array.from({ length: GRID_SIZE }).map((_, j) => (
                  <div
                    key={`cell-${i}-${j}`}
                    className="absolute border-grid-line border-[0.5px]"
                    style={{
                      left: j * 20,
                      top: i * 20,
                      width: 20,
                      height: 20,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Game Elements */}
          <div className="absolute inset-0">
            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-100 ${
                  index === 0
                    ? 'bg-snake-head border-2 border-primary-foreground rounded-lg shadow-glow-primary animate-glow-pulse'
                    : 'bg-snake-body rounded-md shadow-lg'
                }`}
                style={{
                  left: segment.x * 20 + 2,
                  top: segment.y * 20 + 2,
                  width: 16,
                  height: 16,
                  zIndex: 10,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-food rounded-full shadow-glow-food animate-food-bounce border-2 border-destructive-foreground"
              style={{
                left: food.x * 20 + 3,
                top: food.y * 20 + 3,
                width: 14,
                height: 14,
                zIndex: 5,
              }}
            />
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-xl animate-fade-in">
              <div className="text-center space-y-6">
                <div className="text-6xl">💀</div>
                <h2 className="text-4xl font-bold text-foreground">Game Over!</h2>
                <div className="space-y-2">
                  <p className="text-xl text-muted-foreground">Final Score: <span className="text-primary font-bold">{score}</span></p>
                  {score === highScore && score > 0 && (
                    <p className="text-lg text-primary font-semibold animate-glow-pulse">🎉 New High Score!</p>
                  )}
                </div>
                <Button onClick={startGame} size="lg" className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow-primary">
                  <Play className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {/* Start Screen */}
          {!gameRunning && !gameOver && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-xl animate-fade-in">
              <div className="text-center space-y-6">
                <div className="text-6xl">🐍</div>
                <h2 className="text-4xl font-bold text-foreground">Ready to Play?</h2>
                <p className="text-lg text-muted-foreground">Collect food and grow your snake!</p>
                <Button onClick={startGame} size="lg" className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow-primary">
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Game Control Buttons */}
        <div className="flex justify-center gap-4">
          {gameRunning && (
            <Button onClick={pauseGame} variant="secondary" size="lg" className="shadow-lg">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={resetGame} variant="outline" size="lg" className="shadow-lg border-game-border">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        {/* Mobile Direction Controls */}
        <div className="grid grid-cols-3 gap-3 max-w-56 mx-auto md:hidden">
          <div></div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDirectionChange('UP')}
            disabled={!gameRunning}
            className="h-14 border-game-border shadow-lg hover:shadow-glow-primary transition-all"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDirectionChange('LEFT')}
            disabled={!gameRunning}
            className="h-14 border-game-border shadow-lg hover:shadow-glow-primary transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDirectionChange('RIGHT')}
            disabled={!gameRunning}
            className="h-14 border-game-border shadow-lg hover:shadow-glow-primary transition-all"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDirectionChange('DOWN')}
            disabled={!gameRunning}
            className="h-14 border-game-border shadow-lg hover:shadow-glow-primary transition-all"
          >
            <ArrowDown className="w-6 h-6" />
          </Button>
          <div></div>
        </div>

        {/* Instructions */}
        <Card className="p-6 bg-gradient-card border-game-border max-w-md mx-auto">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground">How to Play</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="md:hidden">🔄 Swipe or tap buttons to move</p>
              <p className="hidden md:block">⌨️ Arrow keys, WASD, or spacebar</p>
              <p>🍎 Eat food to grow and score points</p>
              <p>⚠️ Don't hit walls or yourself!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};