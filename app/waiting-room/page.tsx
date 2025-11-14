"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [sessionTime, setSessionTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decodedSeat, setDecodedSeat] = useState<string | null>(null);
  const [decodedRoom, setDecodedRoom] = useState<string | null>(null);

  // Decode token - required
  useEffect(() => {
    if (!token) {
      setError("No token provided. Please scan the QR code again.");
      return;
    }

    if (!decodedSeat) {
      const decodeToken = async () => {
        try {
          const response = await fetch(`/api/token/decode?token=${encodeURIComponent(token)}`);
          if (response.ok) {
            const data = await response.json();
            setDecodedSeat(data.seat);
            setDecodedRoom(data.room);
          } else {
            setError("Invalid token. Please scan the QR code again.");
          }
        } catch (err) {
          console.error("Error decoding token:", err);
          setError("Failed to decode token. Please scan the QR code again.");
        }
      };
      decodeToken();
    }
  }, [token, decodedSeat]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch session time and poll periodically
  useEffect(() => {
    if (!decodedSeat) return;

    const fetchSessionTime = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/session/time?seat=${encodeURIComponent(decodedSeat)}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch session time");
        }

        const data = await response.json();
        if (data.body && data.body.startTime) {
          setSessionTime(data.body.startTime);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching session time:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch session time");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchSessionTime();

    // Poll every 21 seconds (21000 milliseconds)
    console.log("Setting up polling interval: 21 seconds");
    const pollInterval = setInterval(() => {
      console.log("Polling session time (21 second interval)");
      fetchSessionTime();
    }, 21000);

    return () => clearInterval(pollInterval);
  }, [decodedSeat]);

  // Check if session time has passed and redirect
  useEffect(() => {
    if (sessionTime) {
      const startTime = new Date(sessionTime);
      const now = currentTime;

      if (now >= startTime) {
        // Session has started, redirect to session active - must use token
        if (token) {
          router.push(`/session-active?token=${encodeURIComponent(token)}`);
        } else {
          console.error("Waiting room: No token available for redirect");
        }
      }
    }
  }, [sessionTime, currentTime, router, token]);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!sessionTime) return null;

    const startTime = new Date(sessionTime);
    const now = currentTime;
    const diff = startTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { minutes, seconds };
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Waiting Room
          </h1>

          {error && (
            <div className="w-full max-w-md p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-400">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isLoading && !sessionTime && (
            <div className="w-full max-w-md p-8 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Loading session information...
              </p>
            </div>
          )}

          {sessionTime && !error && (
            <div className="w-full max-w-md p-8 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Session Start Time:
                  </p>
                  <p className="text-xl font-semibold text-black dark:text-zinc-50">
                    {new Date(sessionTime).toLocaleString()}
                  </p>
                </div>

                {timeRemaining ? (
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Time Remaining:
                    </p>
                    <p className="text-3xl font-bold text-[#0077b5] dark:text-[#005885]">
                      {String(timeRemaining.minutes).padStart(2, "0")}:
                      {String(timeRemaining.seconds).padStart(2, "0")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      Session is starting...
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Current Time: {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(decodedSeat || decodedRoom) && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 space-x-4">
              {decodedSeat && <span>Seat: {decodedSeat}</span>}
              {decodedRoom && <span>Room: {decodedRoom}</span>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
          <div className="flex flex-col items-center gap-8 text-center">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Waiting Room
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </main>
      </div>
    }>
      <WaitingRoomContent />
    </Suspense>
  );
}

