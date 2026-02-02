import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

/**
 * The proxy function handles session refreshing. 
 * We must ensure manifest.json and sw.js are excluded via the matcher
 * so they are served as static files, not intercepted.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - card: public business cards
     * - manifest.json: PWA manifest (REQUIRED FOR PWA)
     * - sw.js: Service Worker (REQUIRED FOR PWA)
     * - _next/static: static files
     * - _next/image: image optimization
     * - favicon.ico: favicon
     * - images: .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!card|manifest\\.json|sw\\.js|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};