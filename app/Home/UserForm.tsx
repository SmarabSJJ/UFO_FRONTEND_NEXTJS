"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
  seat: string;
  room: string;
}

interface UserFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email?: string;
    linkedinId?: string;
    seatId?: string;
  };
  seat: string;
  room: string;
  token: string; // Required token to keep in URL
}

export default function UserForm({ initialData, seat, room, token }: UserFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    linkedinUrl: "", // Always start blank
    seat: seat || initialData.seatId || "",
    room: room || "100",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "error">("idle");

  // Update form data when initialData changes (but keep linkedinUrl blank)
  useEffect(() => {
    setFormData({
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      email: initialData.email || "",
      linkedinUrl: "", // Always keep blank, don't pre-fill from lID
      seat: seat || initialData.seatId || "",
      room: room || "100",
    });
  }, [initialData, seat, room]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset submit status when user makes changes
    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Format LinkedIn URL - ensure it's a full URL
      let linkedInURL = formData.linkedinUrl.trim();
      if (linkedInURL && !linkedInURL.startsWith("http")) {
        // If it's just a username or partial URL, construct full URL
        if (linkedInURL.includes("linkedin.com")) {
          linkedInURL = `https://${linkedInURL}`;
        } else {
          linkedInURL = `https://www.linkedin.com/in/${linkedInURL}`;
        }
      }

      // POST to session API
      const response = await fetch("/api/session/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatID: formData.seat,
          roomID: formData.room,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          linkedInURL: linkedInURL || "",
          photo: "", // Photo will be empty for now
        }),
      });

      if (response.ok) {
        // Redirect to waiting room - must use token
        if (token) {
          router.push(`/waiting-room?token=${encodeURIComponent(token)}`);
        } else {
          // Should not happen if token is required, but handle gracefully
          console.error("UserForm: No token available for redirect");
          setSubmitStatus("error");
          setIsSubmitting(false);
        }
      } else {
        setSubmitStatus("error");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error entering session:", error);
      setSubmitStatus("error");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="linkedinUrl"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            LinkedIn User / Website
          </label>
          <input
            type="text"
            id="linkedinUrl"
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
            placeholder="e.g., johndoe or linkedin.com/in/johndoe"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="seat"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Seat
            </label>
            <input
              type="text"
              id="seat"
              name="seat"
              value={formData.seat}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Seat cannot be changed
            </p>
          </div>
          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Room
            </label>
            <input
              type="text"
              id="room"
              name="room"
              value={formData.room}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Room cannot be changed
            </p>
          </div>
        </div>
      </div>

      {submitStatus === "error" && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-400 text-sm">
          Error entering session. Please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-[#0077b5] hover:bg-[#005885] disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
      >
        {isSubmitting ? "Entering Session..." : "Enter Session"}
      </button>
    </form>
  );
}

