import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Generate mock data for inside circle (4 seats: 01-04)
    const insideSeats = Array.from({ length: 4 }, (_, i) => {
      const seatID = String(i + 1).padStart(2, "0");
      return {
        uniqueID: seatID,
        seatID: seatID,
        firstName: "Smaran",
        lastName: "Voora",
        linkedinURL: "https://www.linkedin.com/in/smaranvoora/",
        email: "smaranvoora@gmail.com",
      };
    });

    // Generate mock data for outside circle (4 seats: 11-14)
    const outsideSeats = Array.from({ length: 4 }, (_, i) => {
      const seatID = `1${i + 1}`;
      return {
        uniqueID: seatID,
        seatID: seatID,
        firstName: "Smaran",
        lastName: "Voora",
        linkedinURL: "https://www.linkedin.com/in/smaranvoora/",
        email: "smaranvoora@gmail.com",
      };
    });

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      header: {
        offset: offset,
        timestamp: timestamp,
      },
      data: {
        sections: {
          inside: {
            totalSeats: 4,
            seats: insideSeats,
          },
          outside: {
            totalSeats: 4,
            seats: outsideSeats,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in seating API:", error);
    return NextResponse.json(
      { error: "Failed to get seating data" },
      { status: 500 }
    );
  }
}

