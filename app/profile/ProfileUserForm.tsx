"use client";

import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../Home/useLocalStorage";

interface ProfileUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
  profilePicture: string;
}

interface ProfileUserFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email?: string;
    linkedinId?: string;
    profilePicture?: string;
  };
}

export default function ProfileUserForm({ initialData }: ProfileUserFormProps) {
  const [
    savedUserData,
    setSavedUserData,
    isLoadingStorage,
    clearSavedUserData,
  ] = useLocalStorage<{
    firstName: string;
    lastName: string;
    email: string;
    linkedinUrl: string;
    profilePicture: string;
  }>("profileFormData", {
    firstName: "",
    lastName: "",
    email: "",
    linkedinUrl: "",
    profilePicture: "",
  });

  const [formData, setFormData] = useState<ProfileUserFormData>({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    linkedinUrl: "",
    profilePicture: initialData.profilePicture || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isLoadingStorage && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (savedUserData && (savedUserData.firstName || savedUserData.email)) {
        // Prioritize saved data
        // If savedUserData has a profilePicture (non-empty), use it
        // Otherwise, fall back to initialData for profile picture if available
        setFormData((prev) => ({
          ...prev,
          firstName: savedUserData.firstName || initialData.firstName || "",
          lastName: savedUserData.lastName || initialData.lastName || "",
          email: savedUserData.email || initialData.email || "",
          linkedinUrl: savedUserData.linkedinUrl || "",
          profilePicture:
            savedUserData.profilePicture &&
            savedUserData.profilePicture.trim() !== ""
              ? savedUserData.profilePicture
              : initialData.profilePicture || prev.profilePicture || "",
        }));
      } else if (
        initialData.profilePicture ||
        initialData.firstName ||
        initialData.email
      ) {
        // No saved data, use initialData (LinkedIn data) - only on initial load
        setFormData((prev) => ({
          ...prev,
          firstName: initialData.firstName || prev.firstName,
          lastName: initialData.lastName || prev.lastName,
          email: initialData.email || prev.email,
          profilePicture:
            initialData.profilePicture || prev.profilePicture || "",
        }));
      }
    }
  }, [isLoadingStorage, savedUserData, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSavedUserData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          profilePicture: base64String,
        }));
        setSavedUserData((prev) => ({
          ...prev,
          profilePicture: base64String,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (photoUrlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: photoUrlInput.trim(),
      }));
      setSavedUserData((prev) => ({
        ...prev,
        profilePicture: photoUrlInput.trim(),
      }));
      setPhotoUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
    setSavedUserData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
    setPhotoUrlInput("");
  };

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all saved information from this device? This cannot be undone."
      )
    ) {
      clearSavedUserData();

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        linkedinUrl: "",
        profilePicture: "",
      });
      setPhotoUrlInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Save locally first
      setSavedUserData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        linkedinUrl: formData.linkedinUrl,
        profilePicture: formData.profilePicture,
      });

      // Call Flask backend to save profile
      const response = await fetch("/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          linkedInURL: linkedInURL || "",
          photo: formData.profilePicture || "",
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setIsSubmitting(false);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitStatus("idle");
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save profile:", errorData);
        setSubmitStatus("error");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setSubmitStatus("error");
      setIsSubmitting(false);
    }
  };

  if (isLoadingStorage) {
    return (
      <div className="space-y-4">
        <div className="text-center text-zinc-600 dark:text-zinc-400">
          Loading your information...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(savedUserData.firstName || savedUserData.email) && (
        <div className="flex items-start justify-between gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <span className="flex-1">
            ✓ Your information is saved on this device
          </span>
          <button
            type="button"
            onClick={handleClearData}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium underline whitespace-nowrap"
          >
            Clear Data
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Profile Picture Upload Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Profile Picture
          </label>

          {/* Preview */}
          {formData.profilePicture && (
            <div className="flex flex-col items-center gap-3 mb-3">
              <img
                src={formData.profilePicture}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Remove Photo
              </button>
            </div>
          )}

          {/* Upload Options */}
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg text-center text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                📁 Upload from Device
              </div>
            </label>

            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                🔗 Use Image URL
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-[#0077b5] hover:bg-[#005885] text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setPhotoUrlInput("");
                  }}
                  className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Upload an image from your device or provide a URL (max 5MB)
          </p>
        </div>

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
      </div>

      {submitStatus === "success" && (
        <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-700 dark:text-green-400 text-sm">
          ✓ Profile saved successfully!
        </div>
      )}

      {submitStatus === "error" && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-400 text-sm">
          Error saving profile. Please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-[#0077b5] hover:bg-[#005885] disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Your information is stored locally on this device
        </p>
        {(savedUserData.firstName || savedUserData.email) && (
          <button
            type="button"
            onClick={handleClearData}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 font-medium underline whitespace-nowrap"
          >
            Delete Saved Data
          </button>
        )}
      </div>
    </form>
  );
}
