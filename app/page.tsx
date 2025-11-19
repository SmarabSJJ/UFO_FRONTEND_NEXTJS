import { redirect } from "next/navigation";
import Link from "next/link";
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
      // Invalid token - redirect without error parameter
      redirect("/");
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
  }

  // If no token parameter, show welcome page
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center py-16 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center w-full">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-5xl font-bold text-black dark:text-zinc-50">
              Welcome to UFO APP
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#0077b5] to-transparent"></div>
          </div>

          <div className="w-full space-y-6">
            <div className="rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
              <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-6">
                To get started, choose one of the options below:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-6 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Scan the QR code on your assigned seat at the event to configure your profile automatically.
                  </p>
                </div>

                <div className="p-6 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <div className="text-4xl mb-3">✏️</div>
                  <h3 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
                    Update Profile
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <Link 
                      href="/profile" 
                      className="text-[#0077b5] hover:text-[#005885] dark:text-[#0077b5] dark:hover:text-[#0099cc] font-medium underline"
                    >
                      Click here
                    </Link> to update your user information before the event.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">⚠️</div>
                <div className="text-left">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Important Notice
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    <strong>Please use the same device</strong> to provide your information that you will be using during the UFO event. Your information is stored locally on your device for a seamless experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
