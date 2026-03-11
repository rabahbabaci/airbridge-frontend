// AirBridge backend contract types.
// Keep field names + enum string values in sync with `airbridge-backend/src/app/schemas/*`.

export type UUID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // ISO-8601 datetime string (UTC)

// --- trips.py ---

export type TransportMode = "rideshare" | "driving" | "train" | "bus" | "other";
export type ConfidenceProfile = "safety" | "sweet" | "risk";
export type SecurityAccess =
  | "none"
  | "precheck"
  | "clear"
  | "clear_precheck"
  | "priority_lane";

export type ExtraTimeMinutes = 0 | 15 | 30;

export type DepartureTimeWindow =
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "late_night"
  | "not_sure";

export type TripInputMode = "flight_number" | "route_search";

export type TripPreferences = {
  transport_mode: TransportMode;
  confidence_profile: ConfidenceProfile;
  bag_count: number; // 0..3
  traveling_with_children: boolean;
  extra_time_minutes: ExtraTimeMinutes;
  has_boarding_pass: boolean;
  security_access: SecurityAccess;
};

export type TripPreferenceOverrides = Partial<TripPreferences>;

export type TripContext = {
  trip_id: UUID;
  input_mode: TripInputMode;
  departure_date: ISODate;
  home_address: string;
  created_at: ISODateTime;
  status: "validated";
  preferences: TripPreferences;

  // flight_number mode fields
  flight_number?: string | null;

  // route_search mode fields
  airline?: string | null;
  origin_airport?: string | null; // IATA (3 letters)
  destination_airport?: string | null; // IATA (3 letters)
  departure_time_window?: DepartureTimeWindow | null;
};

// --- recommendations.py ---

export type ConfidenceLevel = "high" | "medium" | "low";

export type SegmentDetail = {
  id: string;
  label: string;
  duration_minutes: number; // >= 0
  advice: string; // may be empty string
};

export type RecommendationResponse = {
  trip_id: string;
  leave_home_at: ISODateTime;
  confidence: ConfidenceLevel;
  confidence_score: number; // 0..1
  explanation: string;
  segments: SegmentDetail[];
  computed_at: ISODateTime;
};

// UI helpers (exact backend values).
export const AIRBRIDGE_ENUMS = {
  transportMode: ["rideshare", "driving", "train", "bus", "other"] as const,
  confidenceProfile: ["safety", "sweet", "risk"] as const,
  securityAccess: [
    "none",
    "precheck",
    "clear",
    "clear_precheck",
    "priority_lane",
  ] as const,
  extraTimeMinutes: [0, 15, 30] as const,
  departureTimeWindow: [
    "morning",
    "midday",
    "afternoon",
    "evening",
    "late_night",
    "not_sure",
  ] as const,
  confidenceLevel: ["high", "medium", "low"] as const,
  tripInputMode: ["flight_number", "route_search"] as const,
} as const;

