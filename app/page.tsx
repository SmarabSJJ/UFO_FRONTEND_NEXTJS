import { redirect } from "next/navigation";
import { validateToken } from "@/lib/token-utils";

// Force dynamic rendering to ensure searchParams are always fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    error?: "no_token" | "invalid_token" | "token_lost_during_auth";
  }>;
}) {
  // Await searchParams in Next.js 16+
  const params = await searchParams;

  // Log for debugging
  console.log("Root page - full params object:", JSON.stringify(params));
  console.log("Root page - token parameter:", params.token);

  // Only accept token - no legacy seat/room support
  if (params.token && params.token.trim() !== "") {
    const token = params.token.trim();
    console.log("Root page - validating token:", token);

    // Validate token format (quick check before redirecting)
    // Full validation will happen in Home page
    const tokenData = validateToken(token);

    if (!tokenData) {
      console.error("Root page - invalid token");
      redirect("/?error=invalid_token");
    }

    // Keep token in URL - redirect directly to Home with token
    // Home page will decrypt it server-side, so users never see seat/room values
    const queryParams = new URLSearchParams();
    queryParams.set("token", token);
    const redirectUrl = `/Home?${queryParams.toString()}`;
    console.log(
      "Root page - redirecting to Home with token (seat/room hidden)"
    );
    redirect(redirectUrl);
  } else {
    console.error("Root page - no token parameter found");
  }

  // If no token parameter, show message on root page
  const hasError =
    params.error === "no_token" || params.error === "token_lost_during_auth";
  const hasInvalidToken = params.error === "invalid_token";
  const tokenLost = params.error === "token_lost_during_auth";
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Seat Not Configured
          </h1>

          <div
            className={`rounded-lg border-2 ${
              hasError
                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
            } p-8`}
          >
            <p
              className={`text-lg ${
                hasError || hasInvalidToken
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              } mb-4`}
            >
              ⚠️{" "}
              {hasError
                ? tokenLost
                  ? "Error: Token lost during authentication"
                  : "Error: No token found"
                : hasInvalidToken
                ? "Error: Invalid or tampered token"
                : "Please scan QR code again"}
            </p>
            <p
              className={`text-base ${
                hasError || hasInvalidToken
                  ? "text-red-700 dark:text-red-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {hasError
                ? tokenLost
                  ? "The token was lost during the LinkedIn authentication process. Please scan the QR code again to start over."
                  : "You must access the website with a valid token. Please scan the QR code to configure your seat."
                : hasInvalidToken
                ? "The token in the URL is invalid or has been tampered with. Please scan the QR code again. Do not modify the URL."
                : "No seat information was found. Please scan the QR code to configure your seat."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
