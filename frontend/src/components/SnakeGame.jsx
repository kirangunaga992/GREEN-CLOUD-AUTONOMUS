import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState([[5, 5]]);
  const [food, setFood] = useState([10, 10]);
  const [direction, setDirection] = useState([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = [head[0] + direction[0], head[1] + direction[1]];

      // Check collision with walls
      if (
        newHead[0] < 0 ||
        newHead[0] >= GRID_SIZE ||
        newHead[1] < 0 ||
        newHead[1] >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      // Check collision with self
      for (let segment of prevSnake) {
        if (newHead[0] === segment[0] && newHead[1] === segment[1]) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }
      }

      const newSnake = [newHead, ...prevSnake];

      // Check collision with food
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore((s) => s + 10);
        setFood([
          Math.floor(Math.random() * GRID_SIZE),
          Math.floor(Math.random() * GRID_SIZE),
        ]);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
         e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp':
          if (direction[1] !== 1) setDirection([0, -1]);
          break;
        case 'ArrowDown':
          if (direction[1] !== -1) setDirection([0, 1]);
          break;
        case 'ArrowLeft':
          if (direction[0] !== 1) setDirection([-1, 0]);
          break;
        case 'ArrowRight':
          if (direction[0] !== -1) setDirection([1, 0]);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(moveSnake, SPEED);
      return () => clearInterval(interval);
    }
  }, [moveSnake, isPlaying]);

  const resetGame = () => {
    setSnake([[5, 5]]);
    setDirection([1, 0]);
    setFood([10, 10]);
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col items-center">
      <h3 className="text-white font-semibold mb-2">🐍 Snake Game</h3>
      <div className="text-slate-400 text-sm mb-4">Score: <span className="text-green-400 font-bold">{score}</span></div>
      
      <div 
        className="relative bg-slate-900 border-2 border-slate-700 rounded"
        style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            className="absolute bg-green-500 rounded-sm"
            style={{
              left: segment[0] * CELL_SIZE,
              top: segment[1] * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
            }}
          />
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: food[0] * CELL_SIZE,
            top: food[1] * CELL_SIZE,
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
          }}
        />
        
        {(!isPlaying && !gameOver) && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <button 
              onClick={() => setIsPlaying(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition-colors"
            >
              Play Game
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center">
            <div className="text-red-400 font-bold mb-2">Game Over!</div>
            <button 
              onClick={resetGame}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors text-sm"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-4">Use arrow keys to move</div>
    </div>
  );
}
