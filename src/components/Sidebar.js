import React from "react";
import { PALETTE, getPaletteBlock } from "../constants/blocks";
import { useScratch } from "../hooks/useScratch";
import Block from "./Block";
import Icon from "./Icon";

export default function Sidebar() {
  const { playAll, addBlockAt, selectedSprite, isPlaying } = useScratch();

  return (
    <div className="w-60 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      <div className="font-bold">Events</div>
      <button
        type="button"
        onClick={playAll}
        className="flex flex-row flex-wrap bg-yellow-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        When
        <Icon name="flag" size={15} className="text-green-600 mx-2" />
        clicked
      </button>

      {PALETTE.map((group) => (
        <div key={group.id} className="w-full">
          <div className="font-bold mt-2">{group.title}</div>
          {group.types.map((type) => {
            const block = getPaletteBlock(type);
            if (!block) return null;
            return (
              <Block
                key={type}
                block={block}
                mode="palette"
                onDropAt={() => {}}
                onRemove={() => {}}
                onParamChange={() => {}}
                onPaletteAdd={(paletteType) => {
                  if (isPlaying) return;
                  addBlockAt(
                    paletteType,
                    null,
                    (selectedSprite.blocks || []).length
                  );
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
