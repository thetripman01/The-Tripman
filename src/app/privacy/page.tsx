import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-medium mb-8 transition-colors duration-200"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8">Effective date: 2026-05-06</p>

        <section className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            This Privacy Policy explains how <strong>The Tripman</strong> (“we”,
            “us”) collects, uses, and shares information when you use our
            website and booking services.
          </p>
        </section>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Information we collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Booking details</strong>: name, email, phone (optional),
                pickup details (optional), notes (optional), date/time, and
                related communications.
              </li>
              <li>
                <strong>Payment information</strong>: payments are processed by{" "}
                <strong>Stripe</strong>. We do not store your full card number.
                Stripe may collect payment method details and device/transaction
                information.
              </li>
              <li>
                <strong>Audio, video & photos</strong>: rides may be recorded
                for content. See the “Content & recordings” section below for
                how this is used.
              </li>
              <li>
                <strong>Usage data</strong>: basic analytics events (if enabled)
                such as page views and interactions to improve the experience.
              </li>
              <li>
                <strong>Support messages</strong>: information you provide when
                contacting us (email/forms).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Content & recordings
            </h2>
            <p>
              Because The Tripman is a content-driven experience, audio, video,
              and photographs may be recorded during rides. Featuring your ride
              in a Tripman video is <strong>not guaranteed</strong> — it depends
              on the energy of the night and editorial choice. By booking, you
              grant The Tripman a perpetual, royalty-free license to use these
              recordings on our social channels, website, and promotional
              materials.
            </p>
            <p>
              If you do not want to be filmed, please tell us before the ride
              begins. You can also request that already-published content
              featuring you be reviewed by emailing us — we will consider such
              requests in good faith.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              How we use your information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and manage bookings.</li>
              <li>Send confirmations, updates, and support replies.</li>
              <li>Process payments and prevent fraud/abuse.</li>
              <li>Improve our website and services.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Cancellations & support requests
            </h2>
            <p>
              If you contact us to request a change or cancellation, we will use
              the information you provide to verify your booking and respond to
              your request. Online cancellations are currently disabled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Refunds</h2>
            <p>
              If a refund is ever issued, it will be processed back to the
              original payment method through Stripe. Refunds are not available
              at this time, except where required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              How we share information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service providers</strong> (for example, Stripe for
                payments; email providers for confirmations).
              </li>
              <li>
                <strong>Legal</strong>: if required to comply with law or
                protect rights, safety, and security.
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              We do not sell your personal information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Data retention
            </h2>
            <p>
              We retain booking and communication data for as long as needed to
              provide services, meet legal/accounting requirements, and resolve
              disputes. We may anonymize or delete data when it is no longer
              needed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Cookies & analytics
            </h2>
            <p>
              We may use cookies or similar technologies for basic site
              functionality and analytics (if enabled). You can control cookies
              through your browser settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Your choices
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Request access, correction, or deletion of your personal data,
                subject to applicable law.
              </li>
              <li>
                Opt out of marketing emails (if any are sent) using the
                unsubscribe link.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{" "}
              <a
                className="text-cyan-700 hover:underline"
                href="mailto:thetripman01@gmail.com"
              >
                thetripman01@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
