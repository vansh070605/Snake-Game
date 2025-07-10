import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Play, Pause } from 'lucide-react';
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
        toast({ title: "Game Over!", description: `Final Score: ${score}` });
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setGameRunning(false);
        toast({ title: "Game Over!", description: `Final Score: ${score}` });
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
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        toast({ title: "Food eaten! +10 points" });
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
    toast({ title: "Game Started!" });
  };

  const pauseGame = () => {
    setGameRunning(!gameRunning);
    toast({ title: gameRunning ? "Game Paused" : "Game Resumed" });
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameRunning(false);
    toast({ title: "Game Reset" });
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
    <div className="flex flex-col items-center gap-6 p-4 min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Snake Game</h1>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <span>Score: {score}</span>
          <span>High Score: {highScore}</span>
        </div>
      </div>

      <Card className="p-6 bg-card border-border">
        <div
          ref={gameRef}
          className="relative bg-muted/20 border-2 border-border rounded-lg"
          style={{
            width: GRID_SIZE * 16,
            height: GRID_SIZE * 16,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Game Grid */}
          <div className="absolute inset-0">
            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-75 ${
                  index === 0
                    ? 'bg-primary border-2 border-primary-foreground rounded-sm'
                    : 'bg-primary/80 rounded-sm'
                }`}
                style={{
                  left: segment.x * 16,
                  top: segment.y * 16,
                  width: 16,
                  height: 16,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-destructive rounded-full animate-pulse"
              style={{
                left: food.x * 16 + 2,
                top: food.y * 16 + 2,
                width: 12,
                height: 12,
              }}
            />
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Game Over!</h2>
                <p className="text-muted-foreground mb-4">Score: {score}</p>
                <Button onClick={startGame} size="sm">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Game Controls */}
        <div className="flex justify-center gap-2">
          {!gameRunning && !gameOver && (
            <Button onClick={startGame} variant="default">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          {gameRunning && (
            <Button onClick={pauseGame} variant="secondary">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Mobile Direction Controls */}
        <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto md:hidden">
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('UP')}
            disabled={!gameRunning}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('LEFT')}
            disabled={!gameRunning}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('RIGHT')}
            disabled={!gameRunning}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('DOWN')}
            disabled={!gameRunning}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <div></div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p className="md:hidden">Swipe or use buttons to control the snake</p>
          <p className="hidden md:block">Use arrow keys or WASD to control the snake. Press space to pause/resume.</p>
        </div>
      </div>
    </div>
  );
};