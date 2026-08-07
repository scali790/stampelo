/**
 * Regression test: Account component must not violate React Rules of Hooks.
 * Specifically: useState hooks must be called unconditionally before any
 * conditional return (loading spinner, unauthenticated view, etc.)
 *
 * This test verifies the hook call count is identical across loading=true
 * and loading=false renders by inspecting the source file directly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Account component — React hook-order compliance", () => {
  const src = readFileSync(
    resolve(__dirname, "../client/src/pages/Account.tsx"),
    "utf-8"
  );

  it("all useState calls appear before any conditional return", () => {
    const lines = src.split("\n");
    const useStateLines: number[] = [];
    const conditionalReturnLines: number[] = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // Detect useState calls (hook declarations)
      if (/const \[.*\] = useState/.test(trimmed)) {
        useStateLines.push(i + 1);
      }
      // Detect conditional returns (if (...) { return ... } patterns)
      // Only count early returns that are inside the component body
      if (/^\s*if \(loading\)/.test(line) || /^\s*if \(!isAuthenticated\)/.test(line)) {
        conditionalReturnLines.push(i + 1);
      }
    });

    expect(useStateLines.length).toBeGreaterThan(0);
    expect(conditionalReturnLines.length).toBeGreaterThan(0);

    const lastUseState = Math.max(...useStateLines);
    const firstConditionalReturn = Math.min(...conditionalReturnLines);

    expect(lastUseState).toBeLessThan(firstConditionalReturn);
  });

  it("no useState calls appear after loading conditional return", () => {
    const lines = src.split("\n");
    let loadingReturnLine = -1;
    let useStateAfterLoading = 0;

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*if \(loading\)/.test(lines[i])) {
        loadingReturnLine = i + 1;
      }
      if (loadingReturnLine > 0 && /const \[.*\] = useState/.test(lines[i].trim())) {
        useStateAfterLoading++;
      }
    }

    expect(useStateAfterLoading).toBe(0);
  });

  it("tRPC query hooks appear before conditional returns", () => {
    const lines = src.split("\n");
    const trpcHookLines: number[] = [];
    const conditionalReturnLines: number[] = [];

    lines.forEach((line, i) => {
      if (/trpc\.\w+\.\w+\.useQuery|trpc\.\w+\.\w+\.useMutation/.test(line)) {
        trpcHookLines.push(i + 1);
      }
      if (/^\s*if \(loading\)/.test(line) || /^\s*if \(!isAuthenticated\)/.test(line)) {
        conditionalReturnLines.push(i + 1);
      }
    });

    if (trpcHookLines.length > 0 && conditionalReturnLines.length > 0) {
      const lastTrpcHook = Math.max(...trpcHookLines);
      const firstConditionalReturn = Math.min(...conditionalReturnLines);
      expect(lastTrpcHook).toBeLessThan(firstConditionalReturn);
    }
  });
});
