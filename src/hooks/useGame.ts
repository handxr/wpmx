import { useState, useCallback, useEffect, useRef } from "react";
import words from "../data/words.json";

export type GameState = {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
};

export type GameHook = GameState & {
  charInputs: string[][];
  correctCharsAcc: number;
  startGame: () => void;
  handleChar: (char: string) => void;
  handleBackspace: () => void;
  handleSpace: () => void;
  getResults: () => GameResults;
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
  const charInputsRef = useRef<string[][]>(
    Array.from({ length: wordCount }, () => [])
  );
  const wordsRef = useRef<string[]>([]);
  const currentWordIndexRef = useRef(0);
  const isFinishedRef = useRef(false);
  const isRunningRef = useRef(false);
  const correctCharsAccRef = useRef(0);
  const totalCharsAccRef = useRef(0);
  const wordCorrectCharsRef = useRef<number[]>([]);
  const wordTotalCharsRef = useRef<number[]>([]);

  const [state, setState] = useState<GameState>(() => {
    const generatedWords = generateWords(wordCount);
    wordsRef.current = generatedWords;
    return {
      words: generatedWords,
      currentWordIndex: 0,
      currentInput: "",
      timeLeft: duration,
      isRunning: false,
      isFinished: false,
    };
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (state.isRunning && !state.isFinished) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(duration - elapsed, 0);
        setState((prev) => {
          if (prev.timeLeft === newTimeLeft) return prev;
          if (newTimeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            isFinishedRef.current = true;
            isRunningRef.current = false;
            return { ...prev, timeLeft: 0, isRunning: false, isFinished: true };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 200);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning, state.isFinished, duration]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    isRunningRef.current = true;
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const handleChar = useCallback((char: string) => {
    if (isFinishedRef.current) return;
    charInputsRef.current[currentWordIndexRef.current].push(char);
    if (!isRunningRef.current) {
      startTimeRef.current = Date.now();
      isRunningRef.current = true;
    }
    setState((prev) => ({
      ...prev,
      isRunning: true,
      currentInput: prev.currentInput + char,
    }));
  }, []);

  const handleBackspace = useCallback(() => {
    if (isFinishedRef.current) return;

    const currentIdx = currentWordIndexRef.current;
    const currentChars = charInputsRef.current[currentIdx];

    if (currentChars.length === 0) {
      if (currentIdx === 0) return;
      const prevIndex = currentIdx - 1;
      currentWordIndexRef.current = prevIndex;
      const lastCorrect = wordCorrectCharsRef.current.pop() || 0;
      const lastTotal = wordTotalCharsRef.current.pop() || 0;
      correctCharsAccRef.current -= lastCorrect;
      totalCharsAccRef.current -= lastTotal;
      const prevInput = charInputsRef.current[prevIndex].join("");
      setState((prev) => ({
        ...prev,
        currentWordIndex: prevIndex,
        currentInput: prevInput,
      }));
    } else {
      charInputsRef.current[currentIdx].pop();
      setState((prev) => ({
        ...prev,
        currentInput: prev.currentInput.slice(0, -1),
      }));
    }
  }, []);

  const handleSpace = useCallback(() => {
    if (isFinishedRef.current || !isRunningRef.current) return;

    const currentIdx = currentWordIndexRef.current;
    const word = wordsRef.current[currentIdx];
    const inputChars = charInputsRef.current[currentIdx];
    const input = inputChars.join("");

    let correct = 0;
    if (input === word) {
      correct = word.length + 1;
    } else {
      for (let j = 0; j < word.length; j++) {
        if (inputChars[j] === word[j]) correct++;
      }
    }
    const total = Math.max(word.length, input.length) + 1;

    wordCorrectCharsRef.current.push(correct);
    wordTotalCharsRef.current.push(total);
    correctCharsAccRef.current += correct;
    totalCharsAccRef.current += total;
    currentWordIndexRef.current = currentIdx + 1;

    setState((prev) => ({
      ...prev,
      currentWordIndex: currentIdx + 1,
      currentInput: "",
    }));
  }, []);

  const getResults = useCallback((): GameResults => {
    const correctChars = correctCharsAccRef.current;
    const totalChars = totalCharsAccRef.current;
    const wpm =
      totalChars > 0
        ? Math.round((correctChars / 5) / (duration / 60))
        : 0;
    const accuracy =
      totalChars > 0
        ? Math.round((correctChars / totalChars) * 1000) / 10
        : 0;
    return { wpm, accuracy, time: duration };
  }, [duration]);

  return {
    ...state,
    charInputs: charInputsRef.current,
    correctCharsAcc: correctCharsAccRef.current,
    startGame,
    handleChar,
    handleBackspace,
    handleSpace,
    getResults,
  };
}
