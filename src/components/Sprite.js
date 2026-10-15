import React, { useRef, useState } from "react";
import CatSprite from "./CatSprite";
import SpeechBubble from "./SpeechBubble";

const DRAG_THRESHOLD = 3;

export default function Sprite({ sprite, selected, onSelect, onMove }) {
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: sprite.x,
      originY: sprite.y,
      moved: false,
    };
    onSelect(sprite.id);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      setIsDragging(true);
    }
    onMove(sprite.id, drag.originX + dx, drag.originY + dy);
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: `${sprite.x}px`,
        top: `${sprite.y}px`,
        width: "95px",
        height: "100px",
        transition: isDragging ? "none" : "left 0.28s linear, top 0.28s linear",
        zIndex: isDragging || selected ? 2 : 1,
      }}
    >
      <SpeechBubble message={sprite.message} />
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(event) => event.preventDefault()}
        className="absolute inset-0 bg-transparent p-0 border-0 overflow-visible"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
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
