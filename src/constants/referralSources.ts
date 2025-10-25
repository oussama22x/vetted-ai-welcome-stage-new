import * as z from "zod";

export const REFERRAL_SOURCES = [
  "linkedin",
  "instagram",
  "friend_colleague",
  "vfa_newsletter",
  "app_newsletter",
  "antler",
  "google_search",
  "other",
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const referralSourceEnum = z.enum(REFERRAL_SOURCES);

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  friend_colleague: "Friend/Colleague",
  vfa_newsletter: "VFA Newsletter",
  app_newsletter: "VettedAI Newsletter",
  antler: "Antler",
  google_search: "Google Search",
  other: "Other",
};

export const referralSourceOptions = REFERRAL_SOURCES.map((value) => ({
  value,
  label: REFERRAL_SOURCE_LABELS[value],
}));

export const isReferralSource = (value: string | null | undefined): value is ReferralSource =>
  value != null && REFERRAL_SOURCES.includes(value as ReferralSource);
