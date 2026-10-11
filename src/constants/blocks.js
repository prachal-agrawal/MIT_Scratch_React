export const BLOCK_TYPES = {
  MOVE: "move",
  TURN_LEFT: "turnLeft",
  TURN_RIGHT: "turnRight",
  GOTO: "goto",
  SAY: "say",
  THINK: "think",
  REPEAT: "repeat",
};

export const ALLOWED_BLOCK_TYPES = new Set(Object.values(BLOCK_TYPES));

export const LIMITS = {
  steps: { min: -500, max: 500, fallback: 10 },
  degrees: { min: -360, max: 360, fallback: 15 },
  coord: { min: -1000, max: 1000, fallback: 0 },
  seconds: { min: 0.1, max: 10, fallback: 2 },
  times: { min: 1, max: 100, fallback: 10 },
  textMax: 80,
};

export const PALETTE = [
  {
    id: "motion",
    title: "Motion",
    types: [
      BLOCK_TYPES.MOVE,
      BLOCK_TYPES.TURN_LEFT,
      BLOCK_TYPES.TURN_RIGHT,
      BLOCK_TYPES.GOTO,
    ],
  },
  {
    id: "looks",
    title: "Looks",
    types: [BLOCK_TYPES.SAY, BLOCK_TYPES.THINK],
  },
  {
    id: "controls",
    title: "Controls",
    types: [BLOCK_TYPES.REPEAT],
  },
];

const BLOCK_STYLE = {
  [BLOCK_TYPES.MOVE]: { category: "motion", color: "bg-blue-500" },
  [BLOCK_TYPES.TURN_LEFT]: { category: "motion", color: "bg-blue-500" },
  [BLOCK_TYPES.TURN_RIGHT]: { category: "motion", color: "bg-blue-500" },
  [BLOCK_TYPES.GOTO]: { category: "motion", color: "bg-blue-500" },
  [BLOCK_TYPES.SAY]: { category: "looks", color: "bg-purple-500" },
  [BLOCK_TYPES.THINK]: { category: "looks", color: "bg-purple-500" },
  [BLOCK_TYPES.REPEAT]: { category: "controls", color: "bg-yellow-500" },
};

export function getBlockStyle(type) {
  return BLOCK_STYLE[type] || { category: "motion", color: "bg-gray-500" };
}

export function clampNumber(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F<>]/g, "")
    .slice(0, LIMITS.textMax);
}

let blockSeq = 0;
let spriteSeq = 0;

export function nextBlockId() {
  blockSeq += 1;
  return `block-${blockSeq}`;
}

export function nextSpriteId() {
  spriteSeq += 1;
  return `sprite-${spriteSeq}`;
}

function blockDefaults(type) {
  switch (type) {
    case BLOCK_TYPES.MOVE:
      return { type, steps: 10 };
    case BLOCK_TYPES.TURN_LEFT:
      return { type, degrees: 15 };
    case BLOCK_TYPES.TURN_RIGHT:
      return { type, degrees: 15 };
    case BLOCK_TYPES.GOTO:
      return { type, x: 0, y: 0 };
    case BLOCK_TYPES.SAY:
      return { type, text: "Hello!", seconds: 2 };
    case BLOCK_TYPES.THINK:
      return { type, text: "Hmm...", seconds: 2 };
    case BLOCK_TYPES.REPEAT:
      return { type, times: 10, children: [] };
    default:
      return null;
  }
}

export function getPaletteBlock(type) {
  const defaults = blockDefaults(type);
  if (!defaults) return null;
  return { ...defaults, id: `palette-${type}` };
}

export function createBlock(type) {
  if (!ALLOWED_BLOCK_TYPES.has(type)) return null;
  const defaults = blockDefaults(type);
  if (!defaults) return null;
  return { ...defaults, id: nextBlockId() };
}

export function createSprite(name, x, y) {
  return {
    id: nextSpriteId(),
    name,
    x,
    y,
    rotation: 0,
    blocks: [],
    message: null,
    highlight: false,
  };
}

export function createRepeatMoveScript(steps, times = 20) {
  const repeat = createBlock(BLOCK_TYPES.REPEAT);
  const move = createBlock(BLOCK_TYPES.MOVE);
  if (!repeat || !move) return [];
  move.steps = clampNumber(steps, LIMITS.steps);
  repeat.times = clampNumber(times, LIMITS.times);
  repeat.children = [move];
  return [repeat];
}

export function cloneBlocks(blocks) {
  return (blocks || []).map((block) => {
    if (block.type === BLOCK_TYPES.REPEAT) {
      return { ...block, children: cloneBlocks(block.children) };
    }
    return { ...block };
  });
}
