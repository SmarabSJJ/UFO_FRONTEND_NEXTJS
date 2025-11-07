import { redirect } from "next/navigation";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ seat?: string }>;
}) {
  // Await searchParams in Next.js 16+
  const params = await searchParams;

  // If seat parameter exists, redirect to Route Handler to set cookie and redirect to /Home
  if (params.seat) {
    redirect(`/api/set-seat?seat=${params.seat}`);
  }

  // If no seat parameter, show message on root page
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Seat Not Configured
          </h1>

          <div className="rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-8">
            <p className="text-lg text-amber-800 dark:text-amber-200 mb-4">
              ⚠️ Please scan QR code again
            </p>
            <p className="text-base text-amber-700 dark:text-amber-300">
              No seat information was found. Please scan the QR code to
              configure your seat.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
