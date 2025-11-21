// SessionUserForm.tsx - For joining a session with seat and room
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BaseUserForm, { UserFormData } from "./BaseUserForm";

interface SessionUserFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email?: string;
    linkedinId?: string;
    seatId?: string;
    profilePicture?: string;
  };
  seat: string;
  room: string;
  token: string;
}

export default function SessionUserForm({
  initialData,
  seat,
  room,
  token,
}: SessionUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "error">("idle");
  const [seatData, setSeatData] = useState({ 
    seat: seat || "", 
    room: room || "100" 
  });

  useEffect(() => {
    setSeatData({ 
      seat: seat || "", 
      room: room || "100" 
    });
  }, [seat, room]);

  const handleBaseSubmit = async (formData: UserFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      let linkedInURL = formData.linkedinUrl.trim();
      if (linkedInURL && !linkedInURL.startsWith("http")) {
        if (linkedInURL.includes("linkedin.com")) {
          linkedInURL = `https://${linkedInURL}`;
        } else {
          linkedInURL = `https://www.linkedin.com/in/${linkedInURL}`;
        }
      }

      const response = await fetch("/api/session/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatID: seatData.seat,
          roomID: seatData.room,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          linkedInURL: linkedInURL || "",
          photo: formData.profilePicture || "",
        }),
      });

      if (response.ok) {
        if (token) {
          router.push(`/waiting-room?token=${encodeURIComponent(token)}`);
        } else {
          console.error("SessionUserForm: No token available for redirect");
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
    <BaseUserForm
      initialData={initialData}
      storageKey="userFormData"
      onSubmit={handleBaseSubmit}
      submitButtonLabel="Enter Session"
      submitStatus={submitStatus}
      isSubmitting={isSubmitting}
    >
      {/* Additional fields for session */}
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
            value={seatData.seat}
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
            value={seatData.room}
            readOnly
            disabled
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Room cannot be changed
          </p>
        </div>
      </div>
    </BaseUserForm>
  );
}