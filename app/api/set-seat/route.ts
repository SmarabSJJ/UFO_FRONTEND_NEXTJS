import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seatRaw = searchParams.get("seat");
    const room = searchParams.get("room");

    // Explicitly convert to string to handle any type coercion issues
    // This ensures seat is always a string, even if Next.js parsed it as a number
    const seat = seatRaw ? String(seatRaw) : null;

    // Log for debugging
    console.log("set-seat route called");
    console.log("Raw seat parameter:", seatRaw);
    console.log("Raw seat parameter (after string conversion):", seat);
    console.log("Raw room parameter:", room);
    console.log("Raw seat parameter (JSON):", JSON.stringify(seat));
    console.log("Seat parameter type:", typeof seat);
    console.log("All search params:", Object.fromEntries(searchParams.entries()));

    if (seat && seat.trim() !== "") {
      const trimmedSeat = seat.trim();
      
      // Validate seat pattern: must start with 0 or 1, followed by one or more digits
      // Examples: 01, 11, 012, 112, etc.
      const seatPattern = /^[01]\d+$/;
      
      if (!seatPattern.test(trimmedSeat)) {
        console.error("set-seat route - invalid seat format:", trimmedSeat);
        console.error("set-seat route - seat must start with 0 or 1, followed by digits");
        // Redirect to root with validation error
        const baseUrl = new URL(request.url);
        const rootUrl = new URL("/", `${baseUrl.protocol}//${baseUrl.host}`);
        rootUrl.searchParams.set("error", "invalid_seat_format");
        return NextResponse.redirect(rootUrl);
      }
      
      // Get room parameter, default to "100" if not specified
      const roomValue = room && room.trim() !== "" 
        ? room.trim() 
        : "100";
      
      // Redirect to Home page with seat and room in URL parameters
      const baseUrl = new URL(request.url);
      const homeUrl = new URL("/Home", `${baseUrl.protocol}//${baseUrl.host}`);
      // Explicitly ensure both values are strings to prevent any type coercion issues
      homeUrl.searchParams.set("seat", String(trimmedSeat));
      homeUrl.searchParams.set("room", String(roomValue));
      
      console.log("set-seat route - seat value:", trimmedSeat);
      console.log("set-seat route - seat value (stringified):", String(trimmedSeat));
      console.log("set-seat route - room value:", roomValue);
      console.log("set-seat route - redirecting to:", homeUrl.toString());
      
      return NextResponse.redirect(homeUrl);
    } else {
      console.error("No seat parameter found in set-seat route or seat is empty");
      console.error("set-seat route - seat value:", seat);
      console.error("set-seat route - seat type:", typeof seat);
      // Redirect to root with error
      const baseUrl = new URL(request.url);
      const rootUrl = new URL("/", `${baseUrl.protocol}//${baseUrl.host}`);
      rootUrl.searchParams.set("error", "no_seat");
      return NextResponse.redirect(rootUrl);
    }
  } catch (error) {
    console.error("Error in set-seat route:", error);
    const baseUrl = new URL(request.url);
    const rootUrl = new URL("/", `${baseUrl.protocol}//${baseUrl.host}`);
    rootUrl.searchParams.set("error", "set_seat_error");
    return NextResponse.redirect(rootUrl);
  }
}

