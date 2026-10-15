import React, { useRef, useState } from "react";
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

// Only one block may show a drop indicator at a time, even though each block
// tracks its own hint state.
let clearActiveHint = null;

function claimDropHint(setHint) {
  if (clearActiveHint && clearActiveHint !== setHint) clearActiveHint(null);
  clearActiveHint = setHint;
}

export function clearDropHint() {
  if (clearActiveHint) clearActiveHint(null);
  clearActiveHint = null;
}

function DropLine({ position }) {
  const placement = {
    before: "-top-1",
    after: "-bottom-1",
    inside: "top-0",
    end: "bottom-0",
  }[position];
  return (
    <div
      className={`absolute left-0 right-0 ${placement} h-1 rounded bg-blue-600 pointer-events-none z-10`}
    />
  );
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
      className="w-14 mx-1 px-1 py-0.5 rounded text-black text-sm"
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
      className="w-20 mx-1 px-1 py-0.5 rounded text-black text-sm"
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
  const children = block.children || [];
  const didDrag = useRef(false);
  const headerRef = useRef(null);
  const [hint, setHint] = useState(null);

  const handleDragStart = (event) => {
    event.stopPropagation();
    didDrag.current = true;
    if (isScript) {
      setDragData(event, { source: "script", blockId: block.id });
    } else {
      setDragData(event, { source: "palette", type: block.type });
    }
  };

  const showHint = (next) => {
    claimDropHint(setHint);
    if (next !== hint) setHint(next);
  };

  const resolveHint = (event) => {
    const rect = headerRef.current.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) return "before";
    if (isRepeat && event.clientY <= rect.bottom) return "inside";
    return "after";
  };

  const handleDragOver = (event) => {
    if (!isScript) return;
    event.preventDefault();
    event.stopPropagation();
    showHint(resolveHint(event));
  };

  const handleSlotDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    showHint(children.length === 0 ? "inside" : "end");
  };

  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setHint(null);
  };

  const dropAt = (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    clearDropHint();
    const payload = readDragData(event);
    if (!payload) return;
    if (target === "before") onDropAt(payload, parentId, index);
    else if (target === "after") onDropAt(payload, parentId, index + 1);
    else if (target === "inside") onDropAt(payload, block.id, 0);
    else onDropAt(payload, block.id, children.length);
  };

  const handleDrop = (event) => {
    if (!isScript) return;
    dropAt(event, resolveHint(event));
  };

  const handleSlotDrop = (event) => {
    dropAt(event, children.length === 0 ? "inside" : "end");
  };

  return (
    <div
      className={`w-full relative ${isScript ? "py-1" : "py-0.5"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {hint === "before" && <DropLine position="before" />}
      <div
        role={isScript ? undefined : "button"}
        aria-label={isScript ? undefined : `${block.type} block`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={clearDropHint}
        onClick={() => {
          if (didDrag.current) {
            didDrag.current = false;
            return;
          }
          if (!isScript && onPaletteAdd) onPaletteAdd(block.type);
        }}
        className={`${style.color} text-white text-sm rounded-md shadow-sm cursor-grab`}
      >
        <div
          ref={headerRef}
          className="flex flex-row items-center justify-between gap-2 px-3 py-2"
          style={{ minHeight: 44 }}
        >
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
          <>
            <div
              className="relative ml-4 mr-1 px-2 py-1 border-l-4 border-yellow-200 bg-white bg-opacity-25 rounded-r"
              style={{ minHeight: 52 }}
              onDragOver={handleSlotDragOver}
              onDrop={handleSlotDrop}
            >
              {(hint === "inside" || hint === "end") && <DropLine position={hint} />}
              {children.length === 0 ? (
                <div
                  className="text-xs text-yellow-50 py-3"
                  role="button"
                  aria-label="Repeat drop zone"
                >
                  Drop blocks here
                </div>
              ) : (
                children.map((child, childIndex) => (
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
            <div className="h-4 rounded-b-md" />
          </>
        )}
      </div>
      {hint === "after" && <DropLine position="after" />}
    </div>
  );
}
