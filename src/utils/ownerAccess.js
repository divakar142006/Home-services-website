const fallbackOwnerEmails = ["sai@gmail.com"];

const configuredOwnerEmails = (import.meta.env.VITE_OWNER_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const ownerEmails =
  configuredOwnerEmails.length > 0 ? configuredOwnerEmails : fallbackOwnerEmails;

export const isOwnerEmail = (email = "") =>
  ownerEmails.includes(String(email).trim().toLowerCase());
