import { Box, Text, useInput, useStdout } from "ink";
import type { Key } from "ink";
import { useGame, type GameResults } from "../hooks/useGame.ts";
import { memo, useEffect, useMemo, useCallback, useState } from "react";

const PastWord = memo(({ word, inputChars }: { word: string; inputChars: string[] }) => (
  <Box marginRight={1}>
    {word.split("").map((char, charIndex) => {
      const inputChar = inputChars[charIndex];
      return (
        <Text key={charIndex} color={inputChar === char ? "green" : "red"}>
          {char}
        </Text>
      );
    })}
    {inputChars.length > word.length &&
      inputChars
        .slice(word.length)
        .map((char, i) => (
          <Text key={`extra-${i}`} color="red" strikethrough>
            {char}
          </Text>
        ))}
  </Box>
));

const FutureWord = memo(({ word }: { word: string }) => (
  <Box marginRight={1}>
    <Text dimColor>{word}</Text>
  </Box>
));

const CurrentWord = memo(
  ({ word, currentInput, cursorVisible }: { word: string; currentInput: string; cursorVisible: boolean }) => (
    <Box marginRight={1}>
      {word.split("").map((char, charIndex) => {
        const inputChar = currentInput[charIndex];
        const isCursor = charIndex === currentInput.length;
        if (isCursor && inputChar === undefined) {
          return cursorVisible ? (
            <Text key={charIndex} backgroundColor="white" color="black">
              {char}
            </Text>
          ) : (
            <Text key={charIndex} dimColor>
              {char}
            </Text>
          );
        }
        if (inputChar === undefined) {
          return (
            <Text key={charIndex} dimColor>
              {char}
            </Text>
          );
        }
        return (
          <Text key={charIndex} color={inputChar === char ? "green" : "red"}>
            {char}
          </Text>
        );
      })}
      {currentInput.length > word.length &&
        currentInput
          .slice(word.length)
          .split("")
          .map((char, i) => (
            <Text key={`extra-${i}`} color="red">
              {char}
            </Text>
          ))}
      {currentInput.length >= word.length &&
        (cursorVisible ? <Text backgroundColor="white"> </Text> : <Text> </Text>)}
    </Box>
  ),
);

type GameProps = {
  duration: number;
  onFinish: (results: GameResults) => void;
  onExit: () => void;
  onRestart: () => void;
};

export function Game({ duration, onFinish, onExit, onRestart }: GameProps) {
  const game = useGame(duration);
  const { stdout } = useStdout();

  useEffect(() => {
    if (game.isFinished) {
      onFinish(game.getResults());
    }
  }, [game.isFinished]);

  const handleInput = useCallback(
    (input: string, key: Key) => {
      if (key.escape) {
        onExit();
        return;
      }
      if (key.tab) {
        onRestart();
        return;
      }
      if (game.isFinished) return;

      if (key.backspace || key.delete) {
        game.handleBackspace();
      } else if (input && !key.ctrl && !key.meta) {
        for (const char of input) {
          if (char === " ") {
            game.handleSpace();
          } else if (char >= "!" && char <= "~") {
            game.handleChar(char);
          }
        }
      }
    },
    [onExit, onRestart, game.isFinished, game.handleBackspace, game.handleSpace, game.handleChar],
  );

  useInput(handleInput);

  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  const liveWpm = useMemo(() => {
    if (!game.isRunning || game.isFinished) return 0;
    const elapsed = (duration - game.timeLeft) || 1;
    return Math.round((game.correctCharsAcc / 5) / (elapsed / 60));
  }, [game.correctCharsAcc, game.timeLeft, game.isRunning, game.isFinished, duration]);

  const currentWordIdx = game.currentWordIndex;
  const currentWord = game.words[currentWordIdx] || "";

  // Available width after paddingX={2} on each side
  const termWidth = stdout.columns || 80;
  const availableWidth = termWidth - 4;
  const currentWordWidth = Math.max(currentWord.length, game.currentInput.length) + 1;
  const sideWidth = Math.floor((availableWidth - currentWordWidth) / 2);

  // Past words: walk backwards from current, take as many as fit
  const leftWords: Array<{ word: string; index: number }> = [];
  let usedLeft = 0;
  for (let i = currentWordIdx - 1; i >= 0; i--) {
    const w = game.words[i];
    const wWidth = w.length + 1;
    if (usedLeft + wWidth > sideWidth) break;
    leftWords.unshift({ word: w, index: i });
    usedLeft += wWidth;
  }

  // Future words: walk forward from current, take as many as fit
  const rightWords: Array<{ word: string; index: number }> = [];
  let usedRight = 0;
  for (let i = currentWordIdx + 1; i < game.words.length; i++) {
    const w = game.words[i];
    const wWidth = w.length + 1;
    if (usedRight + wWidth > sideWidth) break;
    rightWords.push({ word: w, index: i });
    usedRight += wWidth;
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box justifyContent="space-between">
        <Text color="yellow" bold>
          {game.timeLeft}s
        </Text>
        <Text color="yellow" bold>
          {liveWpm} wpm
        </Text>
      </Box>
      <Box marginTop={1}>
        <Box width={sideWidth} justifyContent="flex-end">
          {leftWords.map(({ word, index }) => (
            <PastWord key={index} word={word} inputChars={game.charInputs[index]} />
          ))}
        </Box>
        <CurrentWord word={currentWord} currentInput={game.currentInput} cursorVisible={cursorVisible} />
        <Box flexGrow={1}>
          {rightWords.map(({ word, index }) => (
            <FutureWord key={index} word={word} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
