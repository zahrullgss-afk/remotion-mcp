import React from "react";
import { Composition } from "remotion";
import { Intro } from "./Intro.jsx";

export const Root = () => {
  return (
    <Composition
      id="Intro"
      component={Intro}
      durationInFrames={150}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Halo Dunia",
        subtitle: "",
        background: "#0f172a",
        color: "#ffffff",
      }}
    />
  );
};
