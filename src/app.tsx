import { useState, useCallback } from "react";
import { useApp } from "ink";
import { Menu } from "./components/Menu.tsx";
import { Game } from "./components/Game.tsx";
import { Results } from "./components/Results.tsx";

type Screen = "menu" | "game" | "results";
type Duration = 15 | 30 | 60;

export type GameResults = {
  wpm: number;
  accuracy: number;
  time: number;
};

export function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("menu");
  const [duration, setDuration] = useState<Duration>(30);
  const [results, setResults] = useState<GameResults | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback((d: Duration) => {
    setDuration(d);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleFinish = useCallback((r: GameResults) => {
    setResults(r);
    setScreen("results");
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleMenu = useCallback(() => {
    setScreen("menu");
  }, []);

  if (screen === "menu") {
    return <Menu onStart={handleStart} />;
  }

  if (screen === "game") {
    return (
      <Game
        key={gameKey}
        duration={duration}
        onFinish={handleFinish}
        onExit={handleMenu}
        onRestart={handleRestart}
      />
    );
  }

  if (screen === "results" && results) {
    return (
      <Results results={results} onRestart={handleRestart} onMenu={handleMenu} />
    );
  }

  return null;
}
