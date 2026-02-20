import React from "react";
import { Composition } from "remotion";

const Placeholder: React.FC = () => {
  return <div style={{ backgroundColor: "#1e1e2e", width: "100%", height: "100%" }} />;
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WpmxDemo"
      component={Placeholder}
      durationInFrames={510}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
