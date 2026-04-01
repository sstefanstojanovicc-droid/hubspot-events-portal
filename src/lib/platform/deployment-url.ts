import "server-only";

/**
 * Canonical site URL for metadata and server-side absolute links.
 *
 * - **Vercel**: `VERCEL_URL` is set automatically (hostname only; HTTPS assumed).
 * - **Custom domain**: set `APP_URL` in Production (and Preview if needed), e.g. `https://app.example.com`.
 * - **Local dev**: returns `undefined`; relative URLs and localhost are fine.
 */
export function getDeploymentUrl(): URL | undefined {
  const app = process.env.APP_URL?.trim();
  if (app) {
    try {
      return new URL(app.endsWith("/") ? app : `${app}/`);
    } catch {
      return undefined;
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      const withProto = vercel.includes("://") ? vercel : `https://${vercel}`;
      return new URL(withProto.endsWith("/") ? withProto : `${withProto}/`);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
