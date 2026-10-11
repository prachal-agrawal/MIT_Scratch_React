import {
  BLOCK_TYPES,
  LIMITS,
  clampNumber,
  cloneBlocks,
  sanitizeText,
} from "../constants/blocks";
import { clampPosition, findNewCollisions } from "./collision";

const STEP_MS = 300;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function expandRepeat(block) {
  const times = clampNumber(block.times, LIMITS.times);
  const expanded = [];
  for (let i = 0; i < times; i += 1) {
    expanded.push(...cloneBlocks(block.children || []));
  }
  return expanded;
}

async function applyPrimitive(block, spriteId, api) {
  const sprite = api.getSprite(spriteId);
  if (!sprite) return;

  switch (block.type) {
    case BLOCK_TYPES.MOVE: {
      const steps = clampNumber(block.steps, LIMITS.steps);
      const radians = (sprite.rotation * Math.PI) / 180;
      const next = clampPosition(
        sprite.x + steps * Math.cos(radians),
        sprite.y + steps * Math.sin(radians),
        api.getStage().width,
        api.getStage().height
      );
      api.patchSprite(spriteId, next);
      await wait(STEP_MS, api.signal);
      break;
    }
    case BLOCK_TYPES.TURN_LEFT: {
      const degrees = clampNumber(block.degrees, LIMITS.degrees);
      api.patchSprite(spriteId, { rotation: sprite.rotation - degrees });
      await wait(STEP_MS, api.signal);
      break;
    }
    case BLOCK_TYPES.TURN_RIGHT: {
      const degrees = clampNumber(block.degrees, LIMITS.degrees);
      api.patchSprite(spriteId, { rotation: sprite.rotation + degrees });
      await wait(STEP_MS, api.signal);
      break;
    }
    case BLOCK_TYPES.GOTO: {
      const next = clampPosition(
        clampNumber(block.x, LIMITS.coord),
        clampNumber(block.y, LIMITS.coord),
        api.getStage().width,
        api.getStage().height
      );
      api.patchSprite(spriteId, next);
      await wait(STEP_MS, api.signal);
      break;
    }
    case BLOCK_TYPES.SAY: {
      api.patchSprite(spriteId, {
        message: { type: "say", text: sanitizeText(block.text) },
      });
      await wait(clampNumber(block.seconds, LIMITS.seconds) * 1000, api.signal);
      api.patchSprite(spriteId, { message: null });
      break;
    }
    case BLOCK_TYPES.THINK: {
      api.patchSprite(spriteId, {
        message: { type: "think", text: sanitizeText(block.text) },
      });
      await wait(clampNumber(block.seconds, LIMITS.seconds) * 1000, api.signal);
      api.patchSprite(spriteId, { message: null });
      break;
    }
    default:
      break;
  }
}

function applyCollisions(api) {
  const { current, fresh } = findNewCollisions(
    api.getSprites(),
    api.runtime.overlapping
  );
  api.runtime.overlapping = current;
  fresh.forEach(([idA, idB]) => {
    api.swapRuntimeQueues(idA, idB);
    api.swapSpriteBlocks(idA, idB);
  });
}

async function runSpriteQueue(spriteId, api) {
  while (!api.signal.aborted) {
    const queue = api.runtime.queues[spriteId];
    if (!queue || queue.length === 0) break;
    const block = queue.shift();
    if (block.type === BLOCK_TYPES.REPEAT) {
      queue.unshift(...expandRepeat(block));
      continue;
    }
    await applyPrimitive(block, spriteId, api);
    applyCollisions(api);
  }
}

export async function runAllScripts(api) {
  const sprites = api.getSprites();
  sprites.forEach((sprite) => {
    api.runtime.queues[sprite.id] = cloneBlocks(sprite.blocks);
  });
  api.runtime.overlapping = findNewCollisions(sprites, new Set()).current;

  await Promise.all(
    sprites.map((sprite) =>
      runSpriteQueue(sprite.id, api).catch((error) => {
        if (error && error.name === "AbortError") return;
        throw error;
      })
    )
  );
}
