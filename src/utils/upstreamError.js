import { toast } from "@/components/ui/use-toast";

/**
 * Check if a fetch response is a backend 503 "upstream unavailable" error
 * (AeroDataBox outage / rate limit) and show a user-facing toast.
 *
 * Returns true when the toast was shown so the caller can early-return.
 * Status 503 covers both UPSTREAM_UNAVAILABLE and UPSTREAM_RATE_LIMITED
 * — v1 does not distinguish them in the UI (same copy, no Retry-After
 * handling). 4xx errors (404 flight-not-found, validation, auth) are NOT
 * in scope here; caller handles them via its existing error branch.
 */
export function handleUpstreamError(response) {
    if (response.status === 503) {
        toast({
            title: "Flight data unavailable",
            description: "Having trouble reaching flight data. Try again in a moment.",
            variant: "destructive",
        });
        return true;
    }
    return false;
}
