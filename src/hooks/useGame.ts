import { useState, useCallback, useEffect, useRef } from "react";
import words from "../data/words.json";

export type GameState = {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  wordResults: Array<"correct" | "incorrect" | "pending">;
  charInputs: string[][];
};

export type GameResults = {
  wpm: number;
  accuracy: number;
  time: number;
};

function generateWords(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result;
}

export function useGame(duration: number) {
  const wordCount = Math.max(duration * 3, 50);
  const [state, setState] = useState<GameState>({
    words: generateWords(wordCount),
    currentWordIndex: 0,
    currentInput: "",
    timeLeft: duration,
    isRunning: false,
    isFinished: false,
    wordResults: Array(wordCount).fill("pending"),
    charInputs: Array(wordCount).fill(null).map(() => []),
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (state.isRunning && !state.isFinished) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, timeLeft: 0, isRunning: false, isFinished: true };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning, state.isFinished]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const handleChar = useCallback((char: string) => {
    setState((prev) => {
      if (prev.isFinished) return prev;
      if (!prev.isRunning) {
        startTimeRef.current = Date.now();
        const newCharInputs = [...prev.charInputs];
        newCharInputs[prev.currentWordIndex] = [
          ...newCharInputs[prev.currentWordIndex],
          char,
        ];
        return {
          ...prev,
          isRunning: true,
          currentInput: prev.currentInput + char,
          charInputs: newCharInputs,
        };
      }
      const newCharInputs = [...prev.charInputs];
      newCharInputs[prev.currentWordIndex] = [
        ...newCharInputs[prev.currentWordIndex],
        char,
      ];
      return {
        ...prev,
        currentInput: prev.currentInput + char,
        charInputs: newCharInputs,
      };
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) return prev;

      // If current input is empty, go back to previous word
      if (prev.currentInput.length === 0) {
        if (prev.currentWordIndex === 0) return prev;
        const prevIndex = prev.currentWordIndex - 1;
        const prevInput = prev.charInputs[prevIndex].join("");
        const newWordResults = [...prev.wordResults];
        newWordResults[prevIndex] = "pending";
        return {
          ...prev,
          currentWordIndex: prevIndex,
          currentInput: prevInput,
          wordResults: newWordResults,
        };
      }

      // Otherwise delete last char of current word
      const newCharInputs = [...prev.charInputs];
      newCharInputs[prev.currentWordIndex] = newCharInputs[
        prev.currentWordIndex
      ].slice(0, -1);
      return {
        ...prev,
        currentInput: prev.currentInput.slice(0, -1),
        charInputs: newCharInputs,
      };
    });
  }, []);

  const handleSpace = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished || !prev.isRunning) return prev;
      const word = prev.words[prev.currentWordIndex];
      const isCorrect = prev.currentInput === word;
      const newWordResults = [...prev.wordResults];
      newWordResults[prev.currentWordIndex] = isCorrect
        ? "correct"
        : "incorrect";
      return {
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        currentInput: "",
        wordResults: newWordResults,
      };
    });
  }, []);

  const getResults = useCallback((): GameResults => {
    let correctChars = 0;
    let totalChars = 0;

    for (let i = 0; i < state.currentWordIndex; i++) {
      const word = state.words[i];
      const input = state.charInputs[i].join("");
      totalChars += Math.max(word.length, input.length) + 1;
      if (input === word) {
        correctChars += word.length + 1;
      } else {
        for (let j = 0; j < word.length; j++) {
          if (input[j] === word[j]) correctChars++;
        }
      }
    }

    const timeElapsed = duration;
    const wpm = totalChars > 0 ? Math.round((correctChars / 5) / (timeElapsed / 60)) : 0;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 1000) / 10 : 0;

    return { wpm, accuracy, time: duration };
  }, [state.currentWordIndex, state.charInputs, state.words, duration]);

  return {
    ...state,
    startGame,
    handleChar,
    handleBackspace,
    handleSpace,
    getResults,
  };
}
