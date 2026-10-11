import React, { useRef } from "react";
import { BLOCK_TYPES, getBlockStyle } from "../constants/blocks";
import Icon from "./Icon";

const DRAG_TYPE = "application/x-scratch-block";

export function setDragData(event, payload) {
  const serialized = JSON.stringify(payload);
  event.dataTransfer.setData(DRAG_TYPE, serialized);
  event.dataTransfer.setData("text/plain", serialized);
  event.dataTransfer.effectAllowed = payload.source === "palette" ? "copy" : "move";
}

export function readDragData(event) {
  const raw =
    event.dataTransfer.getData(DRAG_TYPE) ||
    event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.source !== "palette" && parsed.source !== "script")) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function NumberField({ disabled, value, onChange }) {
  return (
    <input
      type="number"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      draggable={false}
      className="w-12 mx-1 px-1 rounded text-black text-xs"
    />
  );
}

function TextField({ disabled, value, onChange }) {
  return (
    <input
      type="text"
      disabled={disabled}
      value={value}
      maxLength={80}
      onChange={(event) => onChange(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      draggable={false}
      className="w-20 mx-1 px-1 rounded text-black text-xs"
    />
  );
}

function BlockLabel({ block, editable, onParamChange }) {
  const disabled = !editable;

  switch (block.type) {
    case BLOCK_TYPES.MOVE:
      return (
        <span className="flex items-center flex-wrap">
          Move
          <NumberField
            disabled={disabled}
            value={block.steps}
            onChange={(value) => onParamChange("steps", value)}
          />
          steps
        </span>
      );
    case BLOCK_TYPES.TURN_LEFT:
      return (
        <span className="flex items-center flex-wrap">
          Turn
          <Icon name="undo" size={15} className="text-white mx-1" />
          <NumberField
            disabled={disabled}
            value={block.degrees}
            onChange={(value) => onParamChange("degrees", value)}
          />
          degrees
        </span>
      );
    case BLOCK_TYPES.TURN_RIGHT:
      return (
        <span className="flex items-center flex-wrap">
          Turn
          <Icon name="redo" size={15} className="text-white mx-1" />
          <NumberField
            disabled={disabled}
            value={block.degrees}
            onChange={(value) => onParamChange("degrees", value)}
          />
          degrees
        </span>
      );
    case BLOCK_TYPES.GOTO:
      return (
        <span className="flex items-center flex-wrap">
          Go to x:
          <NumberField
            disabled={disabled}
            value={block.x}
            onChange={(value) => onParamChange("x", value)}
          />
          y:
          <NumberField
            disabled={disabled}
            value={block.y}
            onChange={(value) => onParamChange("y", value)}
          />
        </span>
      );
    case BLOCK_TYPES.SAY:
      return (
        <span className="flex items-center flex-wrap">
          Say
          <TextField
            disabled={disabled}
            value={block.text}
            onChange={(value) => onParamChange("text", value)}
          />
          for
          <NumberField
            disabled={disabled}
            value={block.seconds}
            onChange={(value) => onParamChange("seconds", value)}
          />
          seconds
        </span>
      );
    case BLOCK_TYPES.THINK:
      return (
        <span className="flex items-center flex-wrap">
          Think
          <TextField
            disabled={disabled}
            value={block.text}
            onChange={(value) => onParamChange("text", value)}
          />
          for
          <NumberField
            disabled={disabled}
            value={block.seconds}
            onChange={(value) => onParamChange("seconds", value)}
          />
          seconds
        </span>
      );
    case BLOCK_TYPES.REPEAT:
      return (
        <span className="flex items-center flex-wrap">
          Repeat
          <NumberField
            disabled={disabled}
            value={block.times}
            onChange={(value) => onParamChange("times", value)}
          />
        </span>
      );
    default:
      return <span>{block.type}</span>;
  }
}

export default function Block({
  block,
  mode = "script",
  parentId = null,
  index = 0,
  onDropAt,
  onRemove,
  onParamChange,
  onPaletteAdd,
}) {
  const style = getBlockStyle(block.type);
  const isScript = mode === "script";
  const isRepeat = block.type === BLOCK_TYPES.REPEAT;
  const didDrag = useRef(false);

  const handleDragStart = (event) => {
    didDrag.current = true;
    if (isScript) {
      setDragData(event, { source: "script", blockId: block.id });
    } else {
      setDragData(event, { source: "palette", type: block.type });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropBefore = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDragData(event);
    if (!payload) return;
    onDropAt(payload, parentId, index);
  };

  const handleDropInside = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDragData(event);
    if (!payload) return;
    onDropAt(payload, block.id, (block.children || []).length);
  };

  return (
    <div className="w-full" onDragOver={handleDragOver} onDrop={handleDropBefore}>
      <div
        role={isScript ? undefined : "button"}
        aria-label={isScript ? undefined : `${block.type} block`}
        draggable
        onDragStart={handleDragStart}
        onClick={() => {
          if (didDrag.current) {
            didDrag.current = false;
            return;
          }
          if (!isScript && onPaletteAdd) onPaletteAdd(block.type);
        }}
        className={`${style.color} text-white px-2 py-1 my-1 text-sm rounded cursor-grab relative`}
      >
        <div className="flex flex-row items-center justify-between gap-2">
          <BlockLabel
            block={block}
            editable={isScript}
            onParamChange={(field, value) => onParamChange(block.id, field, value)}
          />
          {isScript && (
            <button
              type="button"
              aria-label="Remove block"
              className="text-white text-xs px-1"
              onClick={() => onRemove(block.id)}
            >
              x
            </button>
          )}
        </div>
        {isRepeat && isScript && (
          <div
            className="ml-4 mt-1 mb-1 pl-2 border-l-4 border-yellow-200 min-h-[36px] bg-yellow-400 bg-opacity-30 rounded-r"
            onDragOver={handleDragOver}
            onDrop={handleDropInside}
          >
            {(block.children || []).length === 0 ? (
              <div className="text-xs text-yellow-100 py-2" role="button" aria-label="Repeat drop zone">
                Drop blocks here
              </div>
            ) : (
              (block.children || []).map((child, childIndex) => (
                <Block
                  key={child.id}
                  block={child}
                  mode="script"
                  parentId={block.id}
                  index={childIndex}
                  onDropAt={onDropAt}
                  onRemove={onRemove}
                  onParamChange={onParamChange}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
