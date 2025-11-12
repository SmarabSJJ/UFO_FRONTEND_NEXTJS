"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import UFOSeating from "./UFOSeating";

interface Seat {
  uniqueID: string;
  seatID: string;
  firstName: string;
  lastName: string;
  linkedinURL: string;
  email: string;
}

interface SeatingData {
  header: {
    offset: number;
    timestamp: string;
  };
  data: {
    sections: {
      inside: {
        totalSeats: number;
        seats: Seat[];
      };
      outside: {
        totalSeats: number;
        seats: Seat[];
      };
    };
  };
}

function SessionActiveContent() {
  const searchParams = useSearchParams();
  const seat = searchParams.get("seat");
  const [seatingData, setSeatingData] = useState<SeatingData | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const offsetRef = useRef(0);

  const fetchSeatingData = useCallback(async (currentOffset: number) => {
    try {
      const response = await fetch(`/api/session/seating?offset=${currentOffset}`);
      if (!response.ok) {
        throw new Error("Failed to fetch seating data");
      }
      const data: SeatingData = await response.json();
      setSeatingData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching seating data:", error);
      setLoading(false);
    }
  }, []);

  // Increase offset every 30 seconds
  useEffect(() => {
    const offsetInterval = setInterval(() => {
      setOffset((prev) => {
        const newOffset = (prev + 1) % 4; // Cycle through 0-3 for 4 seats
        offsetRef.current = newOffset;
        return newOffset;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(offsetInterval);
  }, []);

  // Fetch data every 10 seconds with current offset
  useEffect(() => {
    fetchSeatingData(offsetRef.current);
    const interval = setInterval(() => {
      fetchSeatingData(offsetRef.current);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchSeatingData]);

  // Update ref when offset changes
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);


  if (loading && !seatingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading seating data...</div>
      </div>
    );
  }

  if (!seatingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-lg text-red-600 dark:text-red-400">Failed to load seating data</div>
      </div>
    );
  }

  const insideSeats = seatingData.data.sections.inside.seats;
  const outsideSeats = seatingData.data.sections.outside.seats;
  const currentOffset = seatingData.header.offset;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center justify-center py-8 px-4 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-4">
            Session Active
          </h1>

          {seat && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Your Seat: {seat} | Offset: {currentOffset}
            </div>
          )}

          {/* UFO Seating Display */}
          <UFOSeating
            insideSeats={insideSeats}
            outsideSeats={outsideSeats}
            offset={currentOffset}
          />

          {/* Legend */}
          <div className="flex gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 dark:bg-green-700 rounded"></div>
              <span className="text-zinc-700 dark:text-zinc-300">Inside Circle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 dark:bg-blue-700 rounded"></div>
              <span className="text-zinc-700 dark:text-zinc-300">Outside Circle</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SessionActivePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
          <div className="flex flex-col items-center gap-8 text-center">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Session Active
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </main>
      </div>
    }>
      <SessionActiveContent />
    </Suspense>
  );
}

