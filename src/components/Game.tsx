import { Box, Text, useInput, useStdout } from "ink";
import type { Key } from "ink";
import { useGame, type GameResults } from "../hooks/useGame.ts";
import { useEffect, useMemo, useCallback, useState } from "react";

type StyledChar = {
  char: string;
  color?: string;
  dimColor?: boolean;
  strikethrough?: boolean;
  isCursor?: boolean;
};

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

  const termWidth = stdout.columns || 80;
  const availableWidth = termWidth - 4;
  const centerCol = Math.floor(availableWidth / 2);
  const currentWordIdx = game.currentWordIndex;

  // Build flat styled character array for all words (cursor style applied at render time)
  const { chars, cursorPos } = useMemo(() => {
    const chars: StyledChar[] = [];
    let cursorPos = 0;

    for (let wi = 0; wi < game.words.length; wi++) {
      const word = game.words[wi];
      const isPast = wi < currentWordIdx;
      const isCurrent = wi === currentWordIdx;

      if (isPast) {
        const inputs = game.charInputs[wi] || [];
        for (let ci = 0; ci < word.length; ci++) {
          chars.push({ char: word[ci], color: inputs[ci] === word[ci] ? "green" : "red" });
        }
        for (let ci = word.length; ci < inputs.length; ci++) {
          chars.push({ char: inputs[ci], color: "red", strikethrough: true });
        }
        chars.push({ char: " " });
      } else if (isCurrent) {
        const typedInWord = Math.min(game.currentInput.length, word.length);
        for (let ci = 0; ci < typedInWord; ci++) {
          chars.push({ char: word[ci], color: game.currentInput[ci] === word[ci] ? "green" : "red" });
        }
        if (game.currentInput.length < word.length) {
          // Cursor on next untyped character
          cursorPos = chars.length;
          chars.push({ char: word[game.currentInput.length], isCursor: true });
          for (let ci = game.currentInput.length + 1; ci < word.length; ci++) {
            chars.push({ char: word[ci], dimColor: true });
          }
          chars.push({ char: " " });
        } else {
          // Extra typed chars beyond word length
          for (let ci = word.length; ci < game.currentInput.length; ci++) {
            chars.push({ char: game.currentInput[ci], color: "red" });
          }
          // Cursor at space position
          cursorPos = chars.length;
          chars.push({ char: " ", isCursor: true });
        }
      } else {
        // Future word
        for (let ci = 0; ci < word.length; ci++) {
          chars.push({ char: word[ci], dimColor: true });
        }
        chars.push({ char: " " });
      }
    }

    return { chars, cursorPos };
  }, [game.words, game.charInputs, currentWordIdx, game.currentInput]);

  // Extract visible window centered on cursor
  const windowStart = cursorPos - centerCol;
  const visibleChars: StyledChar[] = [];
  for (let i = windowStart; i < windowStart + availableWidth; i++) {
    if (i >= 0 && i < chars.length) {
      visibleChars.push(chars[i]);
    } else {
      visibleChars.push({ char: " " });
    }
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box justifyContent="center" gap={2}>
        <Text color="yellow" bold>
          {game.timeLeft}s
        </Text>
        <Text color="yellow" bold>
          {liveWpm} wpm
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          {visibleChars.map((sc, i) => {
            if (sc.isCursor) {
              return cursorVisible ? (
                <Text key={i} backgroundColor="white" color="black">
                  {sc.char}
                </Text>
              ) : (
                <Text key={i} underline>
                  {sc.char}
                </Text>
              );
            }
            return (
              <Text
                key={i}
                color={sc.color}
                dimColor={sc.dimColor}
                strikethrough={sc.strikethrough}
              >
                {sc.char}
              </Text>
            );
          })}
        </Text>
      </Box>
    </Box>
  );
}
