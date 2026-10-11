import React from "react";

export default function SpeechBubble({ message }) {
  if (!message || !message.text) return null;
  const isThink = message.type === "think";

  return (
    <div
      className={`absolute -top-10 left-14 z-20 max-w-[140px] px-2 py-1 text-xs text-black bg-white border border-gray-400 shadow ${
        isThink ? "rounded-2xl" : "rounded-lg"
      }`}
    >
      {message.text}
    </div>
  );
}
