import { Box, Text, useInput } from "ink";
import type { GameResults } from "../hooks/useGame.ts";

type ResultsProps = {
  results: GameResults;
  personalBest: number | null;
  onRestart: () => void;
  onMenu: () => void;
  onQuit: () => void;
};

export function Results({
  results,
  personalBest,
  onRestart,
  onMenu,
  onQuit,
}: ResultsProps) {
  useInput((input, key) => {
    if (key.tab) {
      onRestart();
    } else if (key.escape) {
      onMenu();
    } else if (input === "q") {
      onQuit();
    }
  });

  const isNewPB = personalBest !== null && results.wpm >= personalBest;

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text bold color="yellow">
        typesprint
      </Text>
      <Box flexDirection="column" alignItems="center" marginTop={2} gap={0}>
        <Text bold color="white">
          {results.wpm} wpm
        </Text>
        {isNewPB && (
          <Text color="greenBright" bold>
            new personal best!
          </Text>
        )}
        {personalBest !== null && !isNewPB && (
          <Text dimColor>pb: {personalBest} wpm</Text>
        )}
        <Text color="white">{results.accuracy}% accuracy</Text>
        <Text dimColor>{results.time}s</Text>
      </Box>
      <Box marginTop={2} gap={2}>
        <Text dimColor>Tab → restart</Text>
        <Text dimColor>Esc → menu</Text>
        <Text dimColor>q → quit</Text>
      </Box>
    </Box>
  );
}
