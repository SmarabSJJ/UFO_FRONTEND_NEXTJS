import { redirect } from "next/navigation";

// Force dynamic rendering to ensure searchParams are always fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{
    seat?: string;
    error?: "no_seat" | "invalid_seat_format";
  }>;
}) {
  // Await searchParams in Next.js 16+
  const params = await searchParams;

  // Log for debugging - comprehensive logging
  console.log("Root page - full params object:", JSON.stringify(params));
  console.log("Root page - params keys:", Object.keys(params));
  console.log("Root page - seat parameter:", params.seat);
  console.log("Root page - seat parameter type:", typeof params.seat);
  console.log("Root page - seat parameter length:", params.seat?.length);
  console.log("Root page - error parameter:", params.error);

  // Validate seat pattern: must start with 0 or 1, followed by one or more digits
  // Examples: 01, 11, 012, 112, etc.
  const seatPattern = /^[01]\d+$/;

  // If seat parameter exists, validate and redirect
  if (params.seat && params.seat.trim() !== "") {
    const trimmedSeat = params.seat.trim();

    // Validate seat pattern
    if (!seatPattern.test(trimmedSeat)) {
      console.error("Root page - invalid seat format:", trimmedSeat);
      console.error(
        "Root page - seat must start with 0 or 1, followed by digits"
      );
      // Redirect to root with validation error
      redirect("/?error=invalid_seat_format");
    }

    // Use URLSearchParams to properly construct the query string
    const queryParams = new URLSearchParams({ seat: trimmedSeat });
    const redirectUrl = `/api/set-seat?${queryParams.toString()}`;
    console.log("Root page - seat value:", trimmedSeat);
    console.log("Root page - redirecting to set-seat with URL:", redirectUrl);
    console.log("Root page - redirect URL length:", redirectUrl.length);
    redirect(redirectUrl);
  } else {
    console.error("Seat parameter is missing or empty");
    console.error("Root page - params.seat:", params.seat);
  }

  // If no seat parameter, show message on root page
  const hasError = params.error === "no_seat";
  const hasInvalidFormat = params.error === "invalid_seat_format";
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
                hasError || hasInvalidFormat
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              } mb-4`}
            >
              ⚠️{" "}
              {hasError
                ? "Error: No seat information"
                : hasInvalidFormat
                ? "Error: Invalid seat format"
                : "Please scan QR code again"}
            </p>
            <p
              className={`text-base ${
                hasError || hasInvalidFormat
                  ? "text-red-700 dark:text-red-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {hasError
                ? "You must access the website with a seat parameter. Please scan the QR code to configure your seat."
                : hasInvalidFormat
                ? "The seat must start with 0 or 1 (for inside/outside), followed by digits (e.g., 01, 11, 012, 112). Please scan the QR code again."
                : "No seat information was found. Please scan the QR code to configure your seat."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
