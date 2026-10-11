import React from "react";
import CatSprite from "./CatSprite";
import SpeechBubble from "./SpeechBubble";

export default function Sprite({ sprite, selected, onSelect }) {
  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: `${sprite.x}px`,
        top: `${sprite.y}px`,
        width: "95px",
        height: "100px",
        transition: "left 0.28s linear, top 0.28s linear",
      }}
    >
      <SpeechBubble message={sprite.message} />
      <button
        type="button"
        onClick={() => onSelect(sprite.id)}
        className="absolute inset-0 bg-transparent p-0 border-0 overflow-visible"
        style={{
          outline: sprite.highlight
            ? "3px solid #ec4899"
            : selected
            ? "2px solid #60a5fa"
            : "none",
        }}
        aria-label={sprite.name}
      >
        <div className="absolute -bottom-4 left-0 w-full text-center text-xs font-semibold text-gray-700">
          {sprite.name}
        </div>
        <div
          style={{
            transform: `rotate(${sprite.rotation}deg)`,
            transition: "transform 0.28s linear",
          }}
        >
          <CatSprite />
        </div>
      </button>
    </div>
  );
}
