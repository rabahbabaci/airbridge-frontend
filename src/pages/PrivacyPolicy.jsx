import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SHARING_ROWS = [
    { provider: 'Supabase', purpose: 'Database and authentication', data: 'All account and trip data' },
    { provider: 'Railway', purpose: 'Backend hosting', data: 'All server-side data processing' },
    { provider: 'Apple / Google', purpose: 'Sign-in authentication', data: 'Email address (via Apple/Google Sign In tokens)' },
    { provider: 'Firebase Cloud Messaging (Google)', purpose: 'Push notification delivery', data: 'Device token and notification content' },
    { provider: 'Apple Push Notification Service', purpose: 'Push notification delivery (iOS)', data: 'Device token and notification content' },
    { provider: 'AeroDataBox', purpose: 'Flight information lookups', data: 'Flight number and departure date' },
    { provider: 'Google Maps Platform', purpose: 'Geocoding, directions, places', data: 'Departure address, destination airport coordinates' },
    { provider: 'TSAWaitTimes.com', purpose: 'TSA security wait time estimates', data: 'Airport IATA code' },
    { provider: 'Twilio', purpose: 'SMS delivery (if you opt in)', data: 'Phone number, SMS content' },
    { provider: 'Stripe', purpose: 'Subscription billing', data: 'Email address, subscription status. Payment card details are handled directly by Stripe and never touch our servers.' },
    { provider: 'Sentry', purpose: 'Error monitoring', data: 'Crash diagnostics, device type, non-personal technical data' },
    { provider: 'PostHog', purpose: 'Product analytics', data: 'Anonymous and pseudonymous usage events' },
];

function PrivacyLink({ href, children }) {
    return (
        <a
            href={href}
            className="text-primary underline underline-offset-2 hover:no-underline"
        >
            {children}
        </a>
    );
}

function H2({ children }) {
    return <h2 className="text-xl font-bold text-foreground mt-10 mb-3">{children}</h2>;
}

function H3({ children }) {
    return <h3 className="text-base font-bold text-foreground mt-6 mb-2">{children}</h3>;
}

function P({ children }) {
    return <p className="text-foreground leading-relaxed mb-4">{children}</p>;
}

function UL({ children }) {
    return <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed mb-4">{children}</ul>;
}

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-[720px] mx-auto px-5 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mt-2">Last updated: April 18, 2026</p>

                <div className="mt-8">
                    <P>
                        AirBridge (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a mobile application and website
                        operated by Rabah Babaci (&ldquo;AirBridge&rdquo;), designed to help US domestic air travelers calculate
                        a personalized &ldquo;leave by&rdquo; time for their flights. This Privacy Policy explains what
                        information we collect, how we use it, who we share it with, and the choices you have.
                    </P>
                    <P>
                        If you have any questions about this policy, contact us at{' '}
                        <PrivacyLink href="mailto:privacy@airbridge.live">privacy@airbridge.live</PrivacyLink>.
                    </P>

                    <H2>1. Information We Collect</H2>

                    <H3>1.1 Information you provide directly</H3>
                    <UL>
                        <li>
                            <strong>Account information:</strong> Your name and email address, provided automatically via Apple
                            Sign In or Google Sign In when you create an account. If you use Apple Sign In with &ldquo;Hide My
                            Email,&rdquo; we receive only the Apple-generated private relay address.
                        </li>
                        <li>
                            <strong>Home address or departure address:</strong> The starting point you enter for each trip,
                            used to calculate drive time to the airport.
                        </li>
                        <li>
                            <strong>Flight details:</strong> Flight number, airline, departure date, and related travel
                            information you enter or that we retrieve based on your input.
                        </li>
                        <li>
                            <strong>Preferences:</strong> Transport mode (drive, rideshare, public transit), security access
                            type (TSA PreCheck or standard), whether you&rsquo;re traveling with children or checking bags, and
                            preferred rideshare and navigation apps.
                        </li>
                        <li>
                            <strong>Phone number (optional):</strong> Collected only if you enable SMS notifications. Used
                            exclusively to send SMS alerts related to your tracked trips.
                        </li>
                        <li>
                            <strong>Feedback:</strong> Optional post-trip feedback you provide, including actual TSA wait
                            times, arrival-at-gate time, and comments.
                        </li>
                    </UL>

                    <H3>1.2 Information collected automatically</H3>
                    <UL>
                        <li>
                            <strong>Device and push notification tokens:</strong> When you install the app and grant
                            notification permission, we receive a device token from Apple Push Notification Service (APNs) or
                            Firebase Cloud Messaging (FCM). This is used solely to deliver push notifications to your device.
                        </li>
                        <li>
                            <strong>Usage and interaction data:</strong> We log when you tap certain actions within the app
                            (such as opening a rideshare link or dismissing a notification) to track trip state and improve the
                            product.
                        </li>
                        <li>
                            <strong>Technical data:</strong> IP address, device model, operating system version, app version,
                            and crash diagnostics.
                        </li>
                    </UL>

                    <H3>1.3 Information collected from third parties</H3>
                    <UL>
                        <li>
                            <strong>Flight information:</strong> Retrieved from AeroDataBox based on the flight number and
                            date you enter.
                        </li>
                        <li>
                            <strong>Traffic and route data:</strong> Retrieved from Google Maps based on your departure
                            address and the destination airport.
                        </li>
                        <li>
                            <strong>TSA wait time estimates:</strong> Retrieved from TSAWaitTimes.com based on the airport
                            you&rsquo;re traveling through.
                        </li>
                    </UL>

                    <H2>2. How We Use Your Information</H2>
                    <P>We use your information to:</P>
                    <UL>
                        <li>Calculate a personalized &ldquo;leave by&rdquo; time for your flight.</li>
                        <li>
                            Monitor tracked trips and send notifications when your leave-by time changes materially, your
                            flight status changes, or it&rsquo;s time to leave.
                        </li>
                        <li>Display your trip history and accuracy statistics.</li>
                        <li>Improve our recommendation accuracy by analyzing aggregated, de-identified trip data.</li>
                        <li>Process your subscription payments and manage your subscription status.</li>
                        <li>Respond to your feedback and support requests.</li>
                        <li>Detect and prevent fraud, abuse, and security threats.</li>
                        <li>Comply with legal obligations.</li>
                    </UL>
                    <P>
                        We do not use your information for targeted advertising. We do not sell your personal information to
                        third parties.
                    </P>

                    <H2>3. Who We Share Your Information With</H2>
                    <P>We share information only with the service providers necessary to operate AirBridge:</P>

                    <div className="hidden md:block overflow-x-auto mb-4">
                        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                            <thead className="bg-accent/40">
                                <tr>
                                    <th className="text-left font-bold text-foreground px-4 py-3 border-b border-border">
                                        Service Provider
                                    </th>
                                    <th className="text-left font-bold text-foreground px-4 py-3 border-b border-border">
                                        Purpose
                                    </th>
                                    <th className="text-left font-bold text-foreground px-4 py-3 border-b border-border">
                                        Data Shared
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {SHARING_ROWS.map((row, idx) => (
                                    <tr key={row.provider} className={idx % 2 === 0 ? 'bg-background' : 'bg-accent/20'}>
                                        <td className="px-4 py-3 border-b border-border align-top font-medium text-foreground">
                                            {row.provider}
                                        </td>
                                        <td className="px-4 py-3 border-b border-border align-top text-foreground">
                                            {row.purpose}
                                        </td>
                                        <td className="px-4 py-3 border-b border-border align-top text-foreground">
                                            {row.data}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-3 mb-4">
                        {SHARING_ROWS.map((row) => (
                            <div
                                key={row.provider}
                                className="border border-border rounded-lg p-4 bg-background"
                            >
                                <div className="font-bold text-foreground">{row.provider}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium text-foreground">Purpose:</span> {row.purpose}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium text-foreground">Data Shared:</span> {row.data}
                                </div>
                            </div>
                        ))}
                    </div>

                    <P>
                        We may also disclose information when legally required (court order, subpoena, law enforcement
                        request) or to protect our rights, property, or the safety of users and the public.
                    </P>

                    <H2>4. Your Rights and Choices</H2>

                    <H3>4.1 Access, correction, and deletion</H3>
                    <UL>
                        <li>
                            <strong>Access and correction:</strong> Most of your information is visible and editable directly
                            in the app (home address, phone number, notification preferences, trip history).
                        </li>
                        <li>
                            <strong>Account deletion:</strong> Go to Settings → Delete Account. This permanently deletes your
                            account and associated trips, feedback, device tokens, and subscription records. Some data may
                            persist briefly in backups for up to 30 days.
                        </li>
                        <li>
                            <strong>Data export:</strong> Email{' '}
                            <PrivacyLink href="mailto:privacy@airbridge.live?subject=Data%20Export%20Request">
                                privacy@airbridge.live
                            </PrivacyLink>{' '}
                            with the subject &ldquo;Data Export Request&rdquo; and we will send you a copy of your data within
                            30 days.
                        </li>
                    </UL>

                    <H3>4.2 Notification preferences</H3>
                    <UL>
                        <li>
                            <strong>Push notifications:</strong> Enable or disable in iOS/Android Settings → AirBridge →
                            Notifications, or via the app&rsquo;s Settings screen.
                        </li>
                        <li>
                            <strong>SMS:</strong> If you enable SMS, you can disable it anytime from the app&rsquo;s Settings
                            screen, or by replying STOP to any AirBridge SMS. Reply HELP to any SMS for assistance.
                        </li>
                    </UL>

                    <H3>4.3 California residents (CCPA / CPRA)</H3>
                    <P>California residents have the right to:</P>
                    <UL>
                        <li>Know what personal information we collect and how we use it (described above).</li>
                        <li>
                            Delete personal information we hold about you (use in-app account deletion or email{' '}
                            <PrivacyLink href="mailto:privacy@airbridge.live">privacy@airbridge.live</PrivacyLink>).
                        </li>
                        <li>Correct inaccurate personal information.</li>
                        <li>
                            Opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information (we do not sell
                            or share personal information for advertising).
                        </li>
                        <li>Non-discrimination for exercising these rights.</li>
                    </UL>
                    <P>
                        To exercise these rights, email{' '}
                        <PrivacyLink href="mailto:privacy@airbridge.live">privacy@airbridge.live</PrivacyLink>.
                    </P>

                    <H2>5. Children&rsquo;s Privacy</H2>
                    <P>
                        AirBridge is not directed at children under 13, and we do not knowingly collect information from
                        children under 13. If we learn that we have collected such information, we will delete it promptly.
                    </P>

                    <H2>6. Data Security</H2>
                    <P>
                        We use industry-standard security practices, including encryption in transit (TLS), encryption at
                        rest (Supabase-managed), row-level security on database tables, and secure authentication tokens. No
                        system is perfectly secure; we make reasonable efforts to protect your data but cannot guarantee
                        absolute security.
                    </P>

                    <H2>7. Data Retention</H2>
                    <UL>
                        <li>
                            <strong>Active account data:</strong> Retained as long as your account is active.
                        </li>
                        <li>
                            <strong>Deleted accounts:</strong> Removed from active systems within 24 hours, purged from
                            backups within 30 days.
                        </li>
                        <li>
                            <strong>Anonymized trip data:</strong> Retained indefinitely for product improvement; cannot be
                            linked back to you.
                        </li>
                        <li>
                            <strong>Billing records:</strong> Retained for 7 years for tax and legal compliance, per
                            Stripe&rsquo;s retention policies.
                        </li>
                    </UL>

                    <H2>8. International Users</H2>
                    <P>
                        AirBridge is operated from the United States and is currently intended for US domestic air travel. If
                        you access AirBridge from outside the United States, your information will be transferred to and
                        processed in the United States.
                    </P>

                    <H2>9. Changes to This Policy</H2>
                    <P>
                        We may update this policy from time to time. We will update the &ldquo;Last updated&rdquo; date at the
                        top and, for material changes, notify you via email or in-app notice. Continued use of AirBridge
                        after changes constitutes acceptance of the updated policy.
                    </P>

                    <H2>10. Contact</H2>
                    <P>Questions, requests, or complaints:</P>
                    <UL>
                        <li>
                            Email:{' '}
                            <PrivacyLink href="mailto:privacy@airbridge.live">privacy@airbridge.live</PrivacyLink>
                        </li>
                        <li>Operator: Rabah Babaci</li>
                        <li>
                            Website:{' '}
                            <PrivacyLink href="https://airbridge.live">https://airbridge.live</PrivacyLink>
                        </li>
                    </UL>
                </div>
            </div>
        </div>
    );
}
