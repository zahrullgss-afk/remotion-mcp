import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const Intro = ({ title, subtitle, background, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [25, 50], [30, 0], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          color,
          fontSize: 110,
          fontWeight: 800,
          textAlign: "center",
          padding: "0 80px",
          transform: `scale(${scale})`,
          opacity: titleOpacity,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            color,
            fontSize: 46,
            marginTop: 30,
            textAlign: "center",
            padding: "0 80px",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
