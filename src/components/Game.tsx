import { Box, Text, useInput, useStdout } from "ink";
import type { Key } from "ink";
import { useGame, type GameResults } from "../hooks/useGame.ts";
import { memo, useEffect, useMemo, useCallback } from "react";

const PastWord = memo(({ word, inputChars, dim = false }: { word: string; inputChars: string[]; dim?: boolean }) => (
  <Box marginRight={1}>
    {word.split("").map((char, charIndex) => {
      const inputChar = inputChars[charIndex];
      if (dim) {
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
    {!dim && inputChars.length > word.length &&
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

const CurrentWord = memo(({ word, currentInput }: { word: string; currentInput: string }) => (
  <Box marginRight={1}>
    {word.split("").map((char, charIndex) => {
      const inputChar = currentInput[charIndex];
      if (inputChar === undefined && charIndex === currentInput.length) {
        return (
          <Text key={charIndex} color="white" bold underline>
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
  </Box>
));

type GameProps = {
  duration: number;
  onFinish: (results: GameResults) => void;
  onExit: () => void;
  onRestart: () => void;
};

/** Split word indices into visual rows based on available terminal width */
function buildLines(words: string[], availableWidth: number): number[][] {
  const result: number[][] = [];
  let currentLine: number[] = [];
  let currentWidth = 0;
  for (let i = 0; i < words.length; i++) {
    const wordWidth = words[i].length + 1; // +1 for trailing space
    if (currentLine.length > 0 && currentWidth + wordWidth > availableWidth) {
      result.push(currentLine);
      currentLine = [i];
      currentWidth = wordWidth;
    } else {
      currentLine.push(i);
      currentWidth += wordWidth;
    }
  }
  if (currentLine.length > 0) result.push(currentLine);
  return result;
}

export function Game({ duration, onFinish, onExit, onRestart }: GameProps) {
  const game = useGame(duration);
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns ?? 80;
  // paddingX={2} adds 2 chars on each side; subtract a little extra for safety
  const availableWidth = terminalWidth - 6;

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

  const liveWpm = useMemo(() => {
    if (!game.isRunning || game.isFinished) return 0;
    const elapsed = (duration - game.timeLeft) || 1;
    return Math.round((game.correctCharsAcc / 5) / (elapsed / 60));
  }, [game.correctCharsAcc, game.timeLeft, game.isRunning, game.isFinished, duration]);

  // Split words into visual rows (computed once per game since words are fixed)
  const lines = useMemo(
    () => buildLines(game.words, availableWidth),
    [game.words, availableWidth],
  );

  // Which row contains the current word
  const currentLineIndex = useMemo(() => {
    return lines.findIndex(
      (line) => line.length > 0 && line[0] <= game.currentWordIndex && game.currentWordIndex <= line[line.length - 1],
    );
  }, [lines, game.currentWordIndex]);

  // Always show: [previous row, active row, next row]
  const prevLine = lines[currentLineIndex - 1] ?? [];
  const activeLine = lines[currentLineIndex] ?? [];
  const nextLine = lines[currentLineIndex + 1] ?? [];

  const renderWord = (wordIndex: number, dimPast = false) => {
    if (wordIndex < game.currentWordIndex) {
      return (
        <PastWord
          key={wordIndex}
          word={game.words[wordIndex]}
          inputChars={game.charInputs[wordIndex]}
          dim={dimPast}
        />
      );
    }
    if (wordIndex === game.currentWordIndex) {
      return (
        <CurrentWord
          key={wordIndex}
          word={game.words[wordIndex]}
          currentInput={game.currentInput}
        />
      );
    }
    return <FutureWord key={wordIndex} word={game.words[wordIndex]} />;
  };

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

      <Box marginTop={1} flexDirection="column">
        {/* Previous row — dimmed so focus stays on the active row */}
        <Box flexDirection="row" height={1}>
          {prevLine.map((wordIndex) => renderWord(wordIndex, true))}
        </Box>

        {/* Active row — always in the center */}
        <Box flexDirection="row" marginY={1}>
          {activeLine.map((wordIndex) => renderWord(wordIndex, false))}
        </Box>

        {/* Next row — dimmed upcoming words */}
        <Box flexDirection="row" height={1}>
          {nextLine.map((wordIndex) => renderWord(wordIndex, false))}
        </Box>
      </Box>
    </Box>
  );
}
