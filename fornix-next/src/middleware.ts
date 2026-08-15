import {getToken} from "next-auth/jwt";
import {NextRequest, NextResponse} from "next/server";

export async function middleware(req: NextRequest) {
    const session = await getToken({
        req,
        secureCookie: process.env.NEXTAUTH_URL?.startsWith("https"),
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

    if (session) {
        // User is signed in
        if (req.nextUrl.pathname === "/") {
            // Redirect signed-in users to /dashboard
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        // Allow access to dashboard routes for authenticated users
        return NextResponse.next();
    } else {
        // User not signed in
        if (isDashboardRoute) {
            // Redirect unauthenticated users trying to access dashboard to sign in
            const signInUrl = new URL("/auth/signin", req.url);
            signInUrl.searchParams.set("callbackUrl", req.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    // Allow access to other pages
    return NextResponse.next()
}

export const config = {
    // matcher: ["/", "/auth", "/profile-setup"],
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}