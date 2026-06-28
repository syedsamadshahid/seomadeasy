"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

type Props = {
  name: string | null;
  jobTitle: string | null;
  timezone: string | null;
  email: string;
  plan: string;
};

const initial: ProfileState = { success: false, error: null };

export function ProfileForm({ name, jobTitle, timezone, email, plan }: Props) {
  const [state, action, isPending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="space-y-6">
      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-black border border-primary/20 flex-shrink-0">
          {(name ?? email).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-on-background">{name ?? email}</p>
          <p className="text-sm text-text-secondary capitalize">{plan} Plan</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={name ?? ""}
            maxLength={80}
            placeholder="Jane Smith"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider" htmlFor="email-display">
            Email
          </label>
          <input
            id="email-display"
            type="email"
            value={email}
            readOnly
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface-alt text-text-secondary cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider" htmlFor="jobTitle">
            Job Title
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            defaultValue={jobTitle ?? ""}
            maxLength={80}
            placeholder="SEO Manager"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider" htmlFor="timezone">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={timezone ?? ""}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors appearance-none"
          >
            <option value="">Select timezone…</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Profile saved successfully.
        </div>
      )}
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 font-medium">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
