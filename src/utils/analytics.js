import posthog from 'posthog-js';

export function track(event, properties = {}) {
    try {
        if (posthog.__loaded) {
            posthog.capture(event, properties);
        }
    } catch {
        // silently ignore
    }
}

export function identify(userId, traits = {}) {
    try {
        if (posthog.__loaded) {
            posthog.identify(userId, traits);
        }
    } catch {
        // silently ignore
    }
}

export function resetIdentity() {
    try {
        if (posthog.__loaded) {
            posthog.reset();
        }
    } catch {
        // silently ignore
    }
}
