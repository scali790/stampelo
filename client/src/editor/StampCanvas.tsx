import { useEditorStore } from "./store";
import { renderStampSvg } from "./svgUtils";
import { useIsMobile } from "@/hooks/useMobile";

export function StampCanvas() {
  const { getActiveStamp, selectedElementId, setSelectedElement } = useEditorStore();
  const stamp = getActiveStamp();
  const isMobile = useIsMobile();

  if (!stamp) return null;

  // Render at 500x500 on desktop, 300x300 on mobile
  const displaySize = isMobile ? 300 : 500;
  const svgContent = renderStampSvg(stamp);
  // Use regex to match any width/height values so the replacement is robust
  const displaySvg = svgContent
    .replace(/(<svg[^>]*)\s+width="\d+"\s+height="\d+"/, `$1 width="${displaySize}" height="${displaySize}"`);

  return (
    <div
     className="flex-1 flex items-center justify-center min-h-0 overflow-auto"
     style={{ padding: isMobile ? "16px" : "32px", background: "radial-gradient(circle at center, #e8edf5 0%, #d4dce8 100%)" }}
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
