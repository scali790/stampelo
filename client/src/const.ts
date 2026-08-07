export { ONE_YEAR_MS } from "@shared/const";

/**
 * Redirect to the Auth.js sign-in page.
 * Call from an event handler or useEffect — never during render.
 */
export const startLogin = (callbackUrl?: string) => {
  const url = new URL("/api/auth/signin", window.location.origin);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  window.location.href = url.toString();
};
