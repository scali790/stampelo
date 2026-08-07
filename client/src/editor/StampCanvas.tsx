import React, { useCallback } from "react";
import { useEditorStore } from "./store";
import { renderStampSvg } from "./svgUtils";

export function StampCanvas() {
  const { getActiveStamp, selectedElementId, setSelectedElement } = useEditorStore();
  const stamp = getActiveStamp();

  if (!stamp) return null;

  // Render at 500x500 display size, viewBox stays 250x250
  const displaySize = 500;
  const svgContent = renderStampSvg(stamp);
  const displaySvg = svgContent
    .replace('width="250" height="250"', `width="${displaySize}" height="${displaySize}"`);

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-0 p-8 overflow-auto"
      style={{
        background: "radial-gradient(circle at center, #e8edf5 0%, #d4dce8 100%)",
      }}
      onClick={() => setSelectedElement(null)}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* Checkered background to show transparency */}
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            opacity: 0.3,
          }}
        />
        {/* SVG Canvas */}
        <div
          className="relative shadow-2xl bg-white rounded-sm"
          style={{ width: displaySize, height: displaySize }}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />
      </div>
    </div>
  );
}
