import { Box, Text, useInput } from "ink";
import { useGame, type GameResults } from "../hooks/useGame.ts";
import { useEffect } from "react";

type GameProps = {
  duration: number;
  onFinish: (results: GameResults) => void;
  onExit: () => void;
  onRestart: () => void;
};

export function Game({ duration, onFinish, onExit, onRestart }: GameProps) {
  const game = useGame(duration);

  useEffect(() => {
    if (game.isFinished) {
      onFinish(game.getResults());
    }
  }, [game.isFinished]);

  useInput((input, key) => {
    if (key.escape) {
      onExit();
      return;
    }
    if (key.tab) {
      onRestart();
      return;
    }
    if (game.isFinished) return;

    if (key.backspace) {
      game.handleBackspace();
    } else if (input === " ") {
      game.handleSpace();
    } else if (input && !key.ctrl && !key.meta && input.length === 1) {
      game.handleChar(input);
    }
  });

  const liveWpm = game.isRunning && !game.isFinished
    ? Math.round(
        (() => {
          let correct = 0;
          for (let i = 0; i < game.currentWordIndex; i++) {
            const word = game.words[i];
            const input = game.charInputs[i].join("");
            if (input === word) correct += word.length + 1;
            else {
              for (let j = 0; j < word.length; j++) {
                if (input[j] === word[j]) correct++;
              }
            }
          }
          const elapsed = (duration - game.timeLeft) || 1;
          return (correct / 5) / (elapsed / 60);
        })()
      )
    : 0;

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
      <Box marginTop={1} flexWrap="wrap">
        {game.words.slice(0, Math.min(game.words.length, game.currentWordIndex + 30)).map((word, wordIndex) => {
          const isCurrentWord = wordIndex === game.currentWordIndex;
          const isPast = wordIndex < game.currentWordIndex;
          const wordResult = game.wordResults[wordIndex];

          if (isPast) {
            return (
              <Box key={wordIndex} marginRight={1}>
                <Text color={wordResult === "correct" ? "green" : "red"}>
                  {word}
                </Text>
              </Box>
            );
          }

          if (isCurrentWord) {
            return (
              <Box key={wordIndex} marginRight={1}>
                {word.split("").map((char, charIndex) => {
                  const inputChar = game.currentInput[charIndex];
                  if (inputChar === undefined && charIndex === game.currentInput.length) {
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
                  if (inputChar === char) {
                    return (
                      <Text key={charIndex} color="green">
                        {char}
                      </Text>
                    );
                  }
                  return (
                    <Text key={charIndex} color="red">
                      {char}
                    </Text>
                  );
                })}
                {game.currentInput.length > word.length &&
                  game.currentInput
                    .slice(word.length)
                    .split("")
                    .map((char, i) => (
                      <Text key={`extra-${i}`} color="red">
                        {char}
                      </Text>
                    ))}
              </Box>
            );
          }

          return (
            <Box key={wordIndex} marginRight={1}>
              <Text dimColor>{word}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
