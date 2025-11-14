"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5000";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing LinkedIn sign-in...");
  const status = searchParams.get("status");
  const error = searchParams.get("error");
  const tokenFromUrl = searchParams.get("token"); // Token passed from Flask

  useEffect(() => {
    const finishSignIn = async () => {
      // Debug: Log all URL parameters
      console.log("=== AUTH CALLBACK DEBUG ===");
      console.log("Full URL:", window.location.href);
      console.log("Status:", status);
      console.log("Error:", error);
      console.log("Token from URL:", tokenFromUrl);
      console.log("All search params:", Array.from(searchParams.entries()));
      
      // Priority 1: Token from URL (passed by Flask)
      // Priority 2: Token from cookie (backup)
      let token: string | null = tokenFromUrl;
      
      // If no token in URL, try to get from cookie
      if (!token) {
        try {
          const tokenResponse = await fetch("/api/get-pending-token", {
            credentials: "include",
            cache: "no-store",
          });
          if (tokenResponse.ok) {
            const data = await tokenResponse.json();
            token = data.token;
            console.log("Auth callback - token retrieved from cookie:", !!token);
          } else {
            console.error("Auth callback - failed to get token from cookie, status:", tokenResponse.status);
          }
        } catch (err) {
          console.error("Error fetching pending token from cookie:", err);
        }
      } else {
        console.log("Auth callback - token retrieved from URL (Flask)");
      }

      // If no token found, redirect to root with error
      if (!token) {
        console.error("Auth callback - no token found in URL or cookie, redirecting to root");
        setMessage("Token not found. Redirecting...");
        router.replace("/?error=token_lost_during_auth");
        return;
      }

      if (error) {
        setMessage("LinkedIn sign-in failed. Redirecting...");
        const errorUrl = `/Home?error=${encodeURIComponent(error)}&token=${encodeURIComponent(token)}`;
        router.replace(errorUrl);
        return;
      }

      if (status !== "success") {
        setMessage("LinkedIn sign-in cancelled. Redirecting...");
        const cancelUrl = `/Home?error=linkedin_cancelled&token=${encodeURIComponent(token)}`;
        router.replace(cancelUrl);
        return;
      }

      try {
        // Verify session with Flask backend
        const response = await fetch(`${BACKEND_URL}/auth/session`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.status}`);
        }

        // Redirect to Home with token from cookie
        const params = new URLSearchParams({ linkedin: "connected", token: token });
        router.replace(`/Home?${params.toString()}`);
      } catch (err) {
        console.error("Error completing LinkedIn sign-in:", err);
        setMessage("Unable to verify session. Redirecting...");
        const errorUrl = `/Home?error=session_fetch_failed&token=${encodeURIComponent(token)}`;
        router.replace(errorUrl);
      }
    };

    finishSignIn();
  }, [error, router, status, tokenFromUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-md flex-col items-center justify-center py-16 px-8 bg-white dark:bg-black text-center">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-4">
          LinkedIn Sign-In
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      </main>
    </div>
  );
}


