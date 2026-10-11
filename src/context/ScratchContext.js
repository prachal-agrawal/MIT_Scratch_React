import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ALLOWED_BLOCK_TYPES,
  LIMITS,
  clampNumber,
  cloneBlocks,
  createBlock,
  createRepeatMoveScript,
  createSprite,
  sanitizeText,
} from "../constants/blocks";
import { SPRITE_WIDTH } from "../engine/collision";
import {
  insertNewBlock,
  moveBlock,
  removeBlockById,
  updateBlockById,
} from "../engine/blockTree";
import { runAllScripts } from "../engine/runScript";

const ScratchContext = createContext(null);

const MAX_SPRITES = 8;

function patchSpriteList(sprites, id, patch) {
  return sprites.map((sprite) => {
    if (sprite.id !== id) return sprite;
    return typeof patch === "function" ? patch(sprite) : { ...sprite, ...patch };
  });
}

export function ScratchProvider({ children }) {
  const [sprites, setSprites] = useState(() => [
    createSprite("Sprite 1", 40, 80),
  ]);
  const [selectedSpriteId, setSelectedSpriteId] = useState(
    () => sprites[0].id
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 360, height: 320 });
  const [swapNotice, setSwapNotice] = useState("");

  const spritesRef = useRef(sprites);
  const stageRef = useRef(stageSize);
  const abortRef = useRef(null);
  const runtimeRef = useRef({ queues: {}, overlapping: new Set() });

  spritesRef.current = sprites;
  stageRef.current = stageSize;

  const selectedSprite =
    sprites.find((sprite) => sprite.id === selectedSpriteId) || sprites[0];

  const patchSprite = useCallback((id, patch) => {
    spritesRef.current = patchSpriteList(spritesRef.current, id, patch);
    setSprites(spritesRef.current);
  }, []);

  const selectSprite = useCallback((id) => {
    setSelectedSpriteId(id);
  }, []);

  const addSprite = useCallback(() => {
    setSprites((current) => {
      if (current.length >= MAX_SPRITES) return current;
      const sprite = createSprite(
        `Sprite ${current.length + 1}`,
        40 + current.length * 140,
        80
      );
      spritesRef.current = [...current, sprite];
      setSelectedSpriteId(sprite.id);
      return spritesRef.current;
    });
  }, []);

  const removeSprite = useCallback((id) => {
    setSprites((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((sprite) => sprite.id !== id);
      spritesRef.current = next;
      setSelectedSpriteId((selected) =>
        selected === id ? next[0].id : selected
      );
      return next;
    });
  }, []);

  const updateSelectedBlocks = useCallback((updater) => {
    setSprites((current) => {
      const next = current.map((sprite) => {
        if (sprite.id !== selectedSpriteId) return sprite;
        return { ...sprite, blocks: updater(sprite.blocks || []) };
      });
      spritesRef.current = next;
      return next;
    });
  }, [selectedSpriteId]);

  const addBlockAt = useCallback(
    (type, parentId, index) => {
      if (!ALLOWED_BLOCK_TYPES.has(type) || isPlaying) return;
      const block = createBlock(type);
      if (!block) return;
      updateSelectedBlocks((blocks) =>
        insertNewBlock(blocks, parentId, index, block)
      );
    },
    [isPlaying, updateSelectedBlocks]
  );

  const moveBlockTo = useCallback(
    (blockId, parentId, index) => {
      if (isPlaying) return;
      updateSelectedBlocks((blocks) =>
        moveBlock(blocks, blockId, parentId, index)
      );
    },
    [isPlaying, updateSelectedBlocks]
  );

  const removeBlock = useCallback(
    (blockId) => {
      if (isPlaying) return;
      updateSelectedBlocks((blocks) => removeBlockById(blocks, blockId));
    },
    [isPlaying, updateSelectedBlocks]
  );

  const updateBlockParams = useCallback(
    (blockId, field, rawValue) => {
      if (isPlaying) return;
      updateSelectedBlocks((blocks) => {
        const patch = {};
        if (field === "text") {
          patch.text = sanitizeText(rawValue);
        } else if (field === "steps") {
          patch.steps = clampNumber(rawValue, LIMITS.steps);
        } else if (field === "degrees") {
          patch.degrees = clampNumber(rawValue, LIMITS.degrees);
        } else if (field === "x") {
          patch.x = clampNumber(rawValue, LIMITS.coord);
        } else if (field === "y") {
          patch.y = clampNumber(rawValue, LIMITS.coord);
        } else if (field === "seconds") {
          patch.seconds = clampNumber(rawValue, LIMITS.seconds);
        } else if (field === "times") {
          patch.times = clampNumber(rawValue, LIMITS.times);
        } else {
          return blocks;
        }
        return updateBlockById(blocks, blockId, patch);
      });
    },
    [isPlaying, updateSelectedBlocks]
  );

  const loadHeroDemo = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsPlaying(false);
    const stageWidth = stageRef.current.width || 360;
    const left = 16;
    const right = Math.max(left + 130, stageWidth - SPRITE_WIDTH - 16);
    const spriteA = createSprite("Sprite 1", left, 80);
    const spriteB = createSprite("Sprite 2", right, 80);
    spriteA.blocks = createRepeatMoveScript(10, 20);
    spriteB.blocks = createRepeatMoveScript(-10, 20);
    spritesRef.current = [spriteA, spriteB];
    setSprites(spritesRef.current);
    setSelectedSpriteId(spriteA.id);
    setSwapNotice("Hero demo: Play to collide and swap Move 10 ↔ Move -10");
  }, []);

  const swapSpriteBlocks = useCallback((idA, idB) => {
    const current = spritesRef.current;
    const spriteA = current.find((sprite) => sprite.id === idA);
    const spriteB = current.find((sprite) => sprite.id === idB);
    if (!spriteA || !spriteB) return;
    const blocksA = cloneBlocks(spriteA.blocks);
    const blocksB = cloneBlocks(spriteB.blocks);
    spritesRef.current = current.map((sprite) => {
      if (sprite.id === idA) {
        return { ...sprite, blocks: blocksB, highlight: true };
      }
      if (sprite.id === idB) {
        return { ...sprite, blocks: blocksA, highlight: true };
      }
      return sprite;
    });
    setSprites(spritesRef.current);
    setSwapNotice(
      `${spriteA.name} now has ${spriteB.name}'s animation (scripts swapped on collide)`
    );
    window.setTimeout(() => {
      spritesRef.current = spritesRef.current.map((sprite) => ({
        ...sprite,
        highlight: false,
      }));
      setSprites(spritesRef.current);
    }, 1400);
  }, []);

  const stopAll = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsPlaying(false);
    spritesRef.current = spritesRef.current.map((sprite) => ({
      ...sprite,
      message: null,
    }));
    setSprites(spritesRef.current);
  }, []);

  const playAll = useCallback(async () => {
    stopAll();
    const controller = new AbortController();
    abortRef.current = controller;
    runtimeRef.current = { queues: {}, overlapping: new Set() };
    setSwapNotice("");
    setIsPlaying(true);

    const api = {
      signal: controller.signal,
      runtime: runtimeRef.current,
      getSprites: () => spritesRef.current,
      getSprite: (id) => spritesRef.current.find((sprite) => sprite.id === id),
      getStage: () => stageRef.current,
      patchSprite,
      swapSpriteBlocks,
      swapRuntimeQueues: (idA, idB) => {
        const queues = runtimeRef.current.queues;
        const temp = queues[idA];
        queues[idA] = queues[idB];
        queues[idB] = temp;
      },
    };

    try {
      await runAllScripts(api);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsPlaying(false);
        spritesRef.current = spritesRef.current.map((sprite) => ({
          ...sprite,
          message: null,
        }));
        setSprites(spritesRef.current);
      }
    }
  }, [patchSprite, stopAll, swapSpriteBlocks]);

  const value = useMemo(
    () => ({
      sprites,
      selectedSprite,
      selectedSpriteId,
      isPlaying,
      stageSize,
      swapNotice,
      selectSprite,
      addSprite,
      removeSprite,
      addBlockAt,
      moveBlockTo,
      removeBlock,
      updateBlockParams,
      playAll,
      stopAll,
      loadHeroDemo,
      setStageSize,
    }),
    [
      sprites,
      selectedSprite,
      selectedSpriteId,
      isPlaying,
      stageSize,
      swapNotice,
      selectSprite,
      addSprite,
      removeSprite,
      addBlockAt,
      moveBlockTo,
      removeBlock,
      updateBlockParams,
      playAll,
      stopAll,
      loadHeroDemo,
    ]
  );

  return (
    <ScratchContext.Provider value={value}>{children}</ScratchContext.Provider>
  );
}

export function useScratch() {
  const context = useContext(ScratchContext);
  if (!context) {
    throw new Error("useScratch must be used inside ScratchProvider");
  }
  return context;
}
