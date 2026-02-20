import { useState } from "react";
import { Box, Text, useInput } from "ink";

type Duration = 15 | 30 | 60;
const DURATIONS: Duration[] = [15, 30, 60];

type MenuProps = {
  onStart: (duration: Duration) => void;
  onQuit: () => void;
  defaultDuration: Duration;
};

export function Menu({ onStart, onQuit, defaultDuration }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(
    DURATIONS.indexOf(defaultDuration)
  );

  useInput((input, key) => {
    if (input === "q") {
      onQuit();
    } else if (key.leftArrow || input === "h") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.rightArrow || input === "l") {
      setSelectedIndex((prev) => Math.min(DURATIONS.length - 1, prev + 1));
    } else if (key.return) {
      onStart(DURATIONS[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text bold color="yellow">
        wpmx
      </Text>

      <Box marginTop={2} gap={2}>
        {DURATIONS.map((d, i) => (
          <Text
            key={d}
            bold={i === selectedIndex}
            color={i === selectedIndex ? "white" : "gray"}
            underline={i === selectedIndex}
          >
            {d}s
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>h / l or ← / → to choose, Enter to start</Text>
      </Box>

      <Box flexDirection="column" marginTop={2} gap={0}>
        <Text dimColor>─── keys ───</Text>
        <Text dimColor>
          <Text color="gray">Tab</Text>    restart game
        </Text>
        <Text dimColor>
          <Text color="gray">Esc</Text>    back to menu
        </Text>
        <Text dimColor>
          <Text color="gray">q</Text>      quit
        </Text>
      </Box>
    </Box>
  );
}
