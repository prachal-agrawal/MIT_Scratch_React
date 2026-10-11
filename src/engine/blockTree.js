import { BLOCK_TYPES } from "../constants/blocks";

export function updateBlockById(blocks, id, patch) {
  return (blocks || []).map((block) => {
    if (block.id === id) {
      return { ...block, ...patch };
    }
    if (block.type === BLOCK_TYPES.REPEAT) {
      return {
        ...block,
        children: updateBlockById(block.children, id, patch),
      };
    }
    return block;
  });
}

export function removeBlockById(blocks, id) {
  const result = [];
  (blocks || []).forEach((block) => {
    if (block.id === id) return;
    if (block.type === BLOCK_TYPES.REPEAT) {
      result.push({
        ...block,
        children: removeBlockById(block.children, id),
      });
      return;
    }
    result.push(block);
  });
  return result;
}

function containsId(block, id) {
  if (!block) return false;
  if (block.id === id) return true;
  if (block.type === BLOCK_TYPES.REPEAT) {
    return (block.children || []).some((child) => containsId(child, id));
  }
  return false;
}

function extractBlock(blocks, id) {
  let extracted = null;

  function strip(list) {
    const next = [];
    (list || []).forEach((block) => {
      if (block.id === id) {
        extracted = block;
        return;
      }
      if (block.type === BLOCK_TYPES.REPEAT) {
        next.push({ ...block, children: strip(block.children) });
        return;
      }
      next.push(block);
    });
    return next;
  }

  return { tree: strip(blocks), extracted };
}

function insertBlock(blocks, parentId, index, block) {
  const safeIndex = Math.max(0, index);
  if (parentId == null) {
    const next = [...(blocks || [])];
    next.splice(Math.min(safeIndex, next.length), 0, block);
    return next;
  }

  return (blocks || []).map((item) => {
    if (item.id === parentId && item.type === BLOCK_TYPES.REPEAT) {
      const children = [...(item.children || [])];
      children.splice(Math.min(safeIndex, children.length), 0, block);
      return { ...item, children };
    }
    if (item.type === BLOCK_TYPES.REPEAT) {
      return {
        ...item,
        children: insertBlock(item.children, parentId, index, block),
      };
    }
    return item;
  });
}

export function insertNewBlock(blocks, parentId, index, block) {
  return insertBlock(blocks, parentId, index, block);
}

export function moveBlock(blocks, blockId, parentId, index) {
  if (blockId === parentId) return blocks;
  const { tree, extracted } = extractBlock(blocks, blockId);
  if (!extracted) return blocks;
  if (parentId && containsId(extracted, parentId)) return blocks;
  return insertBlock(tree, parentId, index, extracted);
}
