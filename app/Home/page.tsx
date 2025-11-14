import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserForm from "./UserForm";
import { validateToken } from "@/lib/token-utils";

// Force dynamic rendering to ensure searchParams are always fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5000";
const SESSION_COOKIE_NAME = "auth_session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    linkedin?: string;
    error?: string;
    details?: string;
  }>;
}) {
  const params = await searchParams;
  // Log for debugging
  console.log("Home page - token parameter:", params.token);

  // Only accept token - no legacy seat/room support
  if (!params.token || params.token.trim() === "") {
    console.error("Home page accessed without token - redirecting to root");
    redirect("/?error=no_token");
  }

  const token = params.token.trim();
  console.log("Home page - decrypting token:", token);

  // Decrypt token to get seat and room
  const tokenData = validateToken(token);

  if (!tokenData) {
    console.error("Home page - invalid token");
    redirect("/?error=invalid_token");
  }

  const seatValue = tokenData.seat;
  const roomValue = tokenData.room;
  console.log("Home page - token decrypted - seat:", seatValue, "room:", roomValue);

  // Validate seat pattern
  const seatPattern = /^[01]\d+$/;
  if (!seatPattern.test(seatValue.trim())) {
    console.error("Home page - invalid seat format from token:", seatValue);
    redirect("/?error=invalid_token");
  }
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const linkedinConnected = params.linkedin === "connected";
  const error = params.error;
  const errorDetails = params.details;

  let sessionUser: {
    firstName?: string;
    lastName?: string;
    email?: string;
    linkedinId?: string;
    seat?: string;
  } | null = null;

  if (sessionCookie) {
    try {
      const sessionResponse = await fetch(`${BACKEND_URL}/auth/session`, {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}`,
        },
        cache: "no-store",
      });

      if (sessionResponse.ok) {
        sessionUser = await sessionResponse.json();
      } else {
        console.error(
          "Failed to fetch session data from backend.",
          sessionResponse.status
        );
      }
    } catch (sessionError) {
      console.error("Error fetching session from backend:", sessionError);
    }
  }

  const linkedinData = sessionUser
    ? {
        firstName: sessionUser.firstName || "",
        lastName: sessionUser.lastName || "",
        email: sessionUser.email || "",
        linkedinId: sessionUser.linkedinId || "",
        seatId: sessionUser.seat || seatValue,
      }
    : null;

  const linkedinIsConnected = linkedinConnected || Boolean(linkedinData);

  // Use API route to store token in cookie and redirect to Flask
  // This ensures cookie is set server-side before redirect
  const linkedinAuthUrl = `/api/linkedin/auth-start?token=${encodeURIComponent(params.token!)}`;

  // Create seat object with the information (only from URL param)
  const seatInfo = {
    seat: seatValue,
    room: roomValue,
    timestamp: new Date().toISOString(),
    status: "active",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Welcome Home
          </h1>

          <div className="rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              Your Seat Information:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Seat</p>
                  <p className="text-3xl font-semibold text-black dark:text-zinc-50">
                    {seatInfo.seat}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Room</p>
                  <p className="text-3xl font-semibold text-black dark:text-zinc-50">
                    {seatInfo.room}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Status: {seatInfo.status}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Stored at: {new Date(seatInfo.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* LinkedIn Connection Section */}
          <div className="w-full max-w-md rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              LinkedIn Connection
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-400 text-sm">
                <p className="font-semibold mb-1">Error: {error}</p>
                {errorDetails && (
                  <p className="text-xs mt-1 opacity-75">
                    Details: {errorDetails}
                  </p>
                )}
                {error === "linkedin_not_configured" && (
                  <p className="text-xs mt-2">
                    Please configure LINKEDIN_CLIENT_ID in your .env.local file
                  </p>
                )}
                {error === "token_exchange_failed" && (
                  <p className="text-xs mt-2">
                    Check your LinkedIn Client ID and Client Secret in
                    .env.local. Also verify the redirect URI matches exactly in
                    your LinkedIn app settings.
                  </p>
                )}
                {error === "linkedin_api_error" && (
                  <p className="text-xs mt-2">
                    Make sure you've enabled "Sign In with LinkedIn using OpenID
                    Connect" in your LinkedIn app products.
                  </p>
                )}
                {error === "invalid_scope_error" && (
                  <p className="text-xs mt-2">
                    Scope error - make sure "Sign In with LinkedIn using OpenID
                    Connect" is enabled in your LinkedIn app's Products section.
                  </p>
                )}
                {error === "openid_insufficient_scope_error" && (
                  <p className="text-xs mt-2">
                    Insufficient scope - make sure "Sign In with LinkedIn using
                    OpenID Connect" product is fully enabled and approved in
                    your LinkedIn app. You may need to wait for approval if you
                    just enabled it.
                  </p>
                )}
                {error === "fetch_error" && (
                  <p className="text-xs mt-2">
                    An error occurred while fetching LinkedIn data. Check the
                    server logs for more details.
                  </p>
                )}
              </div>
            )}

            {linkedinIsConnected && !error && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-700 dark:text-green-400 text-sm">
                Successfully connected to LinkedIn!
              </div>
            )}

            {linkedinData ? (
              <div className="mb-4">
                <UserForm
                  initialData={{
                    firstName: linkedinData.firstName || "",
                    lastName: linkedinData.lastName || "",
                    email: linkedinData.email || "",
                    linkedinId: linkedinData.linkedinId || "",
                    seatId: linkedinData.seatId || "",
                  }}
                  seat={seatValue}
                  room={roomValue}
                  token={params.token || undefined}
                />
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Connect your LinkedIn account to update your information.
              </p>
            )}

            <div className="flex gap-3">
              <a
                href={linkedinAuthUrl}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0077b5] hover:bg-[#005885] text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                {linkedinData ? "Reconnect LinkedIn" : "Connect with LinkedIn"}
              </a>
              {linkedinData && (
                <Link
                  href={`/api/clear-cookies?token=${encodeURIComponent(params.token!)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-semibold rounded-lg transition-colors duration-200 text-sm"
                >
                  Clear Cookies
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
