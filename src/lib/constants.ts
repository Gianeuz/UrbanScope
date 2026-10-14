/**
 * UrbanScope — domain constants.
 * These replace the PostgreSQL CHECK constraints from the reference schema.
 */

export const ROLES = ["client", "agent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_STATUSES = ["available", "reserved", "sold"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const INQUIRY_STATUSES = [
  "submitted",
  "requirements_submitted",
  "under_review",
  "for_resubmission",
  "approved",
  "completed",
  "cancelled",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const DOCUMENT_TYPES = ["government_id", "proof_of_income", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "not_uploaded",
  "submitted",
  "under_review",
  "verified",
  "rejected",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const MAX_DOCUMENT_MB = 5;
export const MAX_IMAGE_MB = 8;

export const LABELS: Record<string, string> = {
  // property status
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  // inquiry status
  submitted: "Submitted",
  requirements_submitted: "Requirements Submitted",
  under_review: "Under Review",
  for_resubmission: "For Resubmission",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
  // document
  government_id: "Government ID",
  proof_of_income: "Proof of Income",
  other: "Other Document",
  not_uploaded: "Not Uploaded",
  verified: "Verified",
  rejected: "Rejected",
  // roles
  client: "Client",
  agent: "Agent",
  admin: "Administrator",
};

export const label = (key: string) => LABELS[key] ?? key;

/** Default status-change descriptions written to inquiry_status_history. */
export const STATUS_DESCRIPTIONS: Record<InquiryStatus, string> = {
  submitted: "Inquiry received. Our agent will review it shortly.",
  requirements_submitted: "Client submitted the required documents.",
  under_review: "Your inquiry and documents are being reviewed by the agent.",
  for_resubmission: "Some documents need to be re-uploaded. Please check the remarks.",
  approved: "Your inquiry has been approved. The agent will contact you for next steps.",
  completed: "Transaction completed. Congratulations on your new property!",
  cancelled: "This inquiry has been cancelled.",
};

/** Service areas used by search filters and the chatbot. */
export const CITIES = [
  { value: "Las Piñas", label: "Las Piñas City" },
  { value: "Bacoor", label: "Bacoor, Cavite" },
  { value: "Imus", label: "Imus, Cavite" },
  { value: "Dasmariñas", label: "Dasmariñas, Cavite" },
  { value: "Naic", label: "Naic, Cavite" },
  { value: "General Trias", label: "General Trias, Cavite" },
] as const;

export const SITE = {
  name: "Mariam Lobren",
  tagline: "Real Estate Agent",
  brokerage: "CD Miranda Realty",
  platform: "UrbanScope",
  phone: "+63 917 000 0000",
  email: "gianticaya@gmail.com",
  address: "Las Piñas City, Metro Manila, Philippines",
} as const;
