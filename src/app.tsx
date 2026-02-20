import { useState, useCallback } from "react";
import { useApp } from "ink";
import { Menu } from "./components/Menu.tsx";
import { Game } from "./components/Game.tsx";
import { Results } from "./components/Results.tsx";
import {
  saveResult,
  saveSettings,
  loadSettings,
  getPersonalBest,
} from "./lib/storage.ts";

type Screen = "menu" | "game" | "results";
type Duration = 15 | 30 | 60;

export type GameResults = {
  wpm: number;
  accuracy: number;
  time: number;
};

export function App() {
  const { exit } = useApp();
  const settings = loadSettings();
  const [screen, setScreen] = useState<Screen>("menu");
  const [duration, setDuration] = useState<Duration>(settings.lastDuration);
  const [results, setResults] = useState<GameResults | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback((d: Duration) => {
    setDuration(d);
    saveSettings({ lastDuration: d });
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleFinish = useCallback(
    (r: GameResults) => {
      saveResult({
        wpm: r.wpm,
        accuracy: r.accuracy,
        duration: r.time,
        date: new Date().toISOString(),
      });
      setResults(r);
      setScreen("results");
    },
    []
  );

  const handleRestart = useCallback(() => {
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleMenu = useCallback(() => {
    setScreen("menu");
  }, []);

  if (screen === "menu") {
    return <Menu onStart={handleStart} onQuit={exit} defaultDuration={duration} />;
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
    const pb = getPersonalBest(results.time);
    return (
      <Results
        results={results}
        personalBest={pb}
        onRestart={handleRestart}
        onMenu={handleMenu}
        onQuit={exit}
      />
    );
  }

  return null;
}
