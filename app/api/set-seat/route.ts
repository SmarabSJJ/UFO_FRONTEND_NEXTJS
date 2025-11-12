import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seat = searchParams.get("seat");

    // Log for debugging
    console.log("set-seat route called");
    console.log("Raw seat parameter:", seat);
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
      
      // Redirect to Home page with seat in URL parameter
      const baseUrl = new URL(request.url);
      const homeUrl = new URL("/Home", `${baseUrl.protocol}//${baseUrl.host}`);
      homeUrl.searchParams.set("seat", trimmedSeat);
      
      console.log("set-seat route - seat value:", trimmedSeat);
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

