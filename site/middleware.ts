/**
 * Vercel Routing Middleware: agents that ask for Markdown get the page as Markdown.
 * A vercel.json rewrite can't do this, because the static index.html matches first.
 */
export const config = { matcher: "/" };

export default function middleware(request: Request) {
  if (!request.headers.get("accept")?.includes("text/markdown")) return;
  return new Response(null, { headers: { "x-middleware-rewrite": new URL("/index.md", request.url).href } });
}
