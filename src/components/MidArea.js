import React from "react";
import { useScratch } from "../hooks/useScratch";
import Block, { clearDropHint, readDragData } from "./Block";

export default function MidArea() {
  const {
    selectedSprite,
    isPlaying,
    addBlockAt,
    moveBlockTo,
    removeBlock,
    updateBlockParams,
  } = useScratch();

  const handleDropAt = (payload, parentId, index) => {
    if (isPlaying) return;
    if (payload.source === "palette") {
      addBlockAt(payload.type, parentId, index);
      return;
    }
    if (payload.source === "script" && payload.blockId) {
      moveBlockTo(payload.blockId, parentId, index);
    }
  };

  const handleAreaDrop = (event) => {
    event.preventDefault();
    clearDropHint();
    const payload = readDragData(event);
    if (!payload) return;
    const index = (selectedSprite.blocks || []).length;
    handleDropAt(payload, null, index);
  };

  const handleAreaDragOver = (event) => {
    event.preventDefault();
    if (event.target === event.currentTarget) clearDropHint();
  };

  return (
    <div
      className="flex-1 h-full overflow-auto p-3 bg-gray-50"
      onDragOver={handleAreaDragOver}
      onDrop={handleAreaDrop}
    >
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Script for {selectedSprite.name}
        {isPlaying ? " (playing)" : ""}
      </div>
      {(selectedSprite.blocks || []).length === 0 && (
        <div className="text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded p-6">
          Drag blocks here from the palette
        </div>
      )}
      {(selectedSprite.blocks || []).map((block, index) => (
        <Block
          key={block.id}
          block={block}
          mode="script"
          parentId={null}
          index={index}
          onDropAt={handleDropAt}
          onRemove={removeBlock}
          onParamChange={updateBlockParams}
        />
      ))}
    </div>
  );
}
