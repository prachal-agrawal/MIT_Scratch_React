export const SPRITE_WIDTH = 95;
export const SPRITE_HEIGHT = 100;

export function aabbOverlap(a, b) {
  return (
    a.x < b.x + SPRITE_WIDTH &&
    a.x + SPRITE_WIDTH > b.x &&
    a.y < b.y + SPRITE_HEIGHT &&
    a.y + SPRITE_HEIGHT > b.y
  );
}

export function pairKey(idA, idB) {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

export function findNewCollisions(sprites, previousKeys) {
  const current = new Set();
  const fresh = [];

  for (let i = 0; i < sprites.length; i += 1) {
    for (let j = i + 1; j < sprites.length; j += 1) {
      if (!aabbOverlap(sprites[i], sprites[j])) continue;
      const key = pairKey(sprites[i].id, sprites[j].id);
      current.add(key);
      if (!previousKeys.has(key)) {
        fresh.push([sprites[i].id, sprites[j].id]);
      }
    }
  }

  return { current, fresh };
}

export function clampPosition(x, y, stageWidth, stageHeight) {
  const maxX = Math.max(0, stageWidth - SPRITE_WIDTH);
  const maxY = Math.max(0, stageHeight - SPRITE_HEIGHT);
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
  };
}
