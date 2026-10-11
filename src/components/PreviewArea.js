import React, { useEffect, useRef } from "react";
import { useScratch } from "../hooks/useScratch";
import Icon from "./Icon";
import Sprite from "./Sprite";
import CatSprite from "./CatSprite";

export default function PreviewArea() {
  const {
    sprites,
    selectedSpriteId,
    isPlaying,
    swapNotice,
    selectSprite,
    addSprite,
    removeSprite,
    playAll,
    stopAll,
    loadHeroDemo,
    setStageSize,
  } = useScratch();
  const stageEl = useRef(null);

  useEffect(() => {
    const node = stageEl.current;
    if (!node) return undefined;

    const updateSize = () => {
      setStageSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [setStageSize]);

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col p-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={playAll}
          disabled={isPlaying}
          className="flex items-center gap-1 bg-green-500 disabled:bg-green-300 text-white text-sm px-3 py-1 rounded"
        >
          <Icon name="flag" size={14} className="text-white" />
          Play
        </button>
        <button
          type="button"
          onClick={stopAll}
          className="bg-red-500 text-white text-sm px-3 py-1 rounded"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={loadHeroDemo}
          disabled={isPlaying}
          className="bg-pink-500 disabled:bg-pink-300 text-white text-sm px-3 py-1 rounded"
        >
          Hero demo
        </button>
        {swapNotice ? (
          <span className="text-xs text-pink-600 truncate">{swapNotice}</span>
        ) : (
          <span className="text-xs text-gray-500 truncate">
            Collide two sprites to swap their scripts
          </span>
        )}
      </div>

      <div
        ref={stageEl}
        data-speech={sprites
          .map((sprite) => (sprite.message ? sprite.message.text : ""))
          .filter(Boolean)
          .join(",")}
        className="relative flex-1 border border-gray-200 rounded bg-white overflow-hidden"
      >
        {sprites.map((sprite) => (
          <Sprite
            key={sprite.id}
            sprite={sprite}
            selected={sprite.id === selectedSpriteId}
            onSelect={selectSprite}
          />
        ))}
      </div>

      <div className="mt-2 border-t border-gray-200 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Sprites</div>
          <button
            type="button"
            onClick={addSprite}
            disabled={isPlaying}
            className="text-sm bg-blue-500 disabled:bg-blue-300 text-white px-2 py-1 rounded"
          >
            Add Sprite
          </button>
        </div>
        <div className="flex flex-row flex-wrap gap-2">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              className={`w-24 p-1 border rounded ${
                sprite.id === selectedSpriteId
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <button
                type="button"
                className="w-full"
                onClick={() => selectSprite(sprite.id)}
              >
                <div className="h-14 overflow-hidden flex items-center justify-center">
                  <div className="transform scale-50">
                    <CatSprite />
                  </div>
                </div>
                <div className="text-xs truncate">{sprite.name}</div>
              </button>
              {sprites.length > 1 && (
                <button
                  type="button"
                  disabled={isPlaying}
                  className="text-xs text-red-500"
                  onClick={() => removeSprite(sprite.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
