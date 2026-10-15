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

function findLocation(blocks, id, parentId = null) {
  const list = blocks || [];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return { parentId, index: i };
    if (list[i].type === BLOCK_TYPES.REPEAT) {
      const found = findLocation(list[i].children, id, list[i].id);
      if (found) return found;
    }
  }
  return null;
}

export function moveBlock(blocks, blockId, parentId, index) {
  const targetParent = parentId == null ? null : parentId;
  if (blockId === targetParent) return blocks;
  const origin = findLocation(blocks, blockId);
  if (!origin) return blocks;
  const { tree, extracted } = extractBlock(blocks, blockId);
  if (targetParent && containsId(extracted, targetParent)) return blocks;
  // Removing the block first shifts later siblings up by one.
  const adjustedIndex =
    origin.parentId === targetParent && origin.index < index ? index - 1 : index;
  return insertBlock(tree, targetParent, adjustedIndex, extracted);
}
