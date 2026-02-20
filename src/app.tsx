import { useState } from "react";
import { Text } from "ink";

type Screen = "menu" | "game" | "results";
type Duration = 15 | 30 | 60;

export type GameResults = {
  wpm: number;
  accuracy: number;
  time: number;
};

export function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [duration, setDuration] = useState<Duration>(30);
  const [results, setResults] = useState<GameResults | null>(null);

  return <Text>typesprint</Text>;
}
