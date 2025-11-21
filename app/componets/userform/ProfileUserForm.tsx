// ProfileUserForm.tsx - For saving profile without joining session
"use client";

import { useState } from "react";
import BaseUserForm, { UserFormData, BaseUserFormProps } from "./BaseUserForm";

interface ProfileUserFormProps
  extends Omit<BaseUserFormProps, "onSubmit" | "storageKey"> {
  initialData: {
    firstName: string;
    lastName: string;
    email?: string;
    linkedinId?: string;
    profilePicture?: string;
  };
}

export default function ProfileUserForm({
  initialData,
}: ProfileUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (formData: UserFormData) => {
    
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Save locally (handled by BaseUserForm with localStorage)
      setSubmitStatus("success");
      setIsSubmitting(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSubmitStatus("error");
      setIsSubmitting(false);
    }
  };

  return (
    <BaseUserForm
      initialData={initialData}
      storageKey="userFormData"
      onSubmit={handleSubmit}
      submitButtonLabel="Save Profile"
      submitStatus={submitStatus}
      isSubmitting={isSubmitting}
    />
  );
}