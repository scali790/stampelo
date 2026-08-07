import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("icon.list", () => {
  it("returns built-in icons when no filter is applied", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const icons = await caller.icon.list({});
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]).toHaveProperty("id");
    expect(icons[0]).toHaveProperty("name");
    expect(icons[0]).toHaveProperty("path");
  });

  it("filters icons by category", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const icons = await caller.icon.list({ category: "Medical" });
    expect(icons.every((i) => i.category === "Medical")).toBe(true);
  });

  it("filters icons by search term", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const icons = await caller.icon.list({ search: "star" });
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe("icon.categories", () => {
  it("returns a list of unique categories", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const cats = await caller.icon.categories();
    expect(cats.length).toBeGreaterThan(0);
    // All unique
    expect(new Set(cats).size).toBe(cats.length);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("test@example.com");
  });
});
