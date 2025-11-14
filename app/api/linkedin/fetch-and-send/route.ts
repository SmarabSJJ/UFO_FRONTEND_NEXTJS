import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("linkedin_access_token")?.value;
  // Get token from URL parameter (passed from callback via state)
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!accessToken) {
    console.error("No access token found in cookies");
    const errorUrl = new URL("/Home", request.url);
    errorUrl.searchParams.set("error", "no_access_token");
    if (token) {
      errorUrl.searchParams.set("token", token);
    }
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Fetch LinkedIn user profile using OpenID Connect userinfo endpoint
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("LinkedIn API error:", errorText);
      console.error("Status:", profileResponse.status);
      const errorUrl = new URL("/Home", request.url);
      errorUrl.searchParams.set("error", "linkedin_api_error");
      errorUrl.searchParams.set("details", errorText.substring(0, 200));
      if (token) {
        errorUrl.searchParams.set("token", token);
      }
      return NextResponse.redirect(errorUrl);
    }

    const profileData = await profileResponse.json();

    // Log the entire JSON response from LinkedIn for debugging
    console.log("=== FULL LINKEDIN JSON RESPONSE ===");
    console.log(JSON.stringify(profileData, null, 2));
    console.log("=== END LINKEDIN RESPONSE ===");

    // Extract the data you need
    const firstName = profileData.given_name || profileData.name?.split(" ")[0] || "";
    const lastName = profileData.family_name || profileData.name?.split(" ").slice(1).join(" ") || "";
    const email = profileData.email || "";
    
    // Extract LinkedIn ID
    // The userinfo endpoint provides 'sub' which is the LinkedIn person URN
    // Format: urn:li:person:123456
    let lID = "";
    
    if (profileData.sub) {
      // Extract the person ID from the URN
      const urnMatch = profileData.sub.match(/urn:li:person:(\d+)/);
      if (urnMatch) {
        // For now, we'll use the person ID
        // To get the actual profile slug (like "JasonMAmaoa/"), you'd need additional API calls
        // with different permissions, or the user would need to provide it
        lID = urnMatch[1] + "/";
      } else {
        // Fallback: use the sub as-is
        lID = profileData.sub + "/";
      }
    }
    
    // If we have a profile URL in the response, extract the slug
    if (!lID && profileData.profile) {
      const profileMatch = profileData.profile.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (profileMatch) {
        lID = profileMatch[1] + "/";
      }
    }
    
    // Final fallback: construct from name if we have both
    if (!lID && firstName && lastName) {
      lID = (firstName + lastName.charAt(0)).replace(/\s+/g, "") + "/";
    }

    // Decode token to get seat and room for data storage
    let seatId = "not_set";
    let roomId = "100";
    if (token) {
      try {
        const { validateToken } = await import("@/lib/token-utils");
        const tokenData = validateToken(token);
        if (tokenData) {
          seatId = tokenData.seat;
          roomId = tokenData.room;
        }
      } catch (err) {
        console.error("Error decoding token in fetch-and-send:", err);
      }
    }

    // Prepare data to display
    const dataToSend = {
      firstName,
      lastName,
      email,
      lID,
      seatId,
      // Include full LinkedIn response for debugging
      fullLinkedInResponse: profileData,
    };

    // API posting is disabled for now - just display the data
    // Uncomment below if you want to send to your API later
    /*
    const yourApiUrl = process.env.YOUR_API_URL;
    if (yourApiUrl) {
      try {
        const apiResponse = await fetch(`${yourApiUrl}/update-seat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });

        if (!apiResponse.ok) {
          console.error("Your API error:", await apiResponse.text());
        }
      } catch (apiError) {
        console.error("Error calling your API:", apiError);
      }
    }
    */

    // Store LinkedIn data in cookies for display
    // Note: httpOnly: false allows client-side access, but since we're using
    // Server Components, the data is read server-side anyway
    // For additional security, consider using httpOnly: true and passing data via server-side props
    cookieStore.set("linkedin_data", JSON.stringify(dataToSend), {
      httpOnly: true, // Changed to true for better security - data is read server-side anyway
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Clear the access token from cookies
    cookieStore.delete("linkedin_access_token");

    // Redirect back to Home with success and token in URL
    const homeUrl = new URL("/Home", request.url);
    homeUrl.searchParams.set("linkedin", "connected");
    if (token) {
      homeUrl.searchParams.set("token", token);
    }
    return NextResponse.redirect(homeUrl);
  } catch (error) {
    console.error("Error fetching LinkedIn data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorUrl = new URL("/Home", request.url);
    errorUrl.searchParams.set("error", "fetch_error");
    errorUrl.searchParams.set("details", errorMessage);
    if (token) {
      errorUrl.searchParams.set("token", token);
    }
    return NextResponse.redirect(errorUrl);
  }
}

