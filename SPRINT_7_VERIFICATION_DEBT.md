# Sprint 7 Verification Debt

Deferred integration tests. Drain at C7.5 checkpoint. Delete this file when all tests pass.

---

## Task 2 — C7.3 visibilitychange + appStateChange listener

### Web tests (browser)

1. **Tab away and back.** Switch to another tab, wait ~3s, switch back. Confirm exactly one `GET /v1/subscriptions/status` in backend terminal.

2. **Debounce guard.** Tab away and back rapidly (within 2s). Confirm only one request fires, not multiple.

3. **Logged out.** Log out, tab away and back. Confirm NO `/v1/subscriptions/status` request.

4. **Error resilience.** While logged in, stop the backend. Tab away and back. Confirm no crash — console shows `refreshSubscriptionStatus failed:` but app continues working.

5. **Stripe portal return (web).** Open Manage Subscription (Stripe portal opens in new tab). Close it / return to app tab. Confirm `GET /v1/subscriptions/status` fires.

### Native tests (on-device via TestFlight or Xcode)

6. **Stripe portal return (native).** On iOS, open Manage Subscription (Stripe portal opens via `Browser.open`). Close the browser / return to app. Confirm `GET /v1/subscriptions/status` fires. Same debounce behavior.

7. **App background/foreground.** Swipe home, wait, return to app. Confirm one refresh fires.

---

## Task 3 — F7.1 unified Trips page

1. **Status pill rendering across all six backend statuses.** Seed trips with each status value: `draft`, `created`, `active`, `en_route`, `at_airport`, `at_gate`. Confirm correct pill label and styling for each. Note: completed trips use `trip_status = "complete"` (no "d") and appear in History tab, not Active.

2. **Draft card tap → Engine edit flow pre-fill.** Draft cards are non-interactive in Task 3. After Task 4 lands, re-verify: tapping a draft opens Engine edit flow pre-filled with flight number, date, address, preferences per brief §4.11.

3. **History row richness.** Verify history rows display `airline`, `origin_iata → destination_iata` route, and `±Xmin` accuracy badge when those fields are populated in the backend response.

4. **Pull-to-refresh on touch device.** On Active tab, pull down from top. Confirm spinner appears, `GET /v1/trips/active-list` fires again, data refreshes.

5. **Free-tier history cap.** Non-Pro user with 6+ completed trips. Confirm: only 5 rows shown + "See all X trips with Pro" button opening paywall modal.

6. **Pro load more.** Pro user with 11+ completed trips. Confirm: "Load more" button visible, clicking fires `GET /v1/trips/history?limit=10&offset=10`.
