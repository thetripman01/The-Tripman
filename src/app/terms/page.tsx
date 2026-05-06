import Link from "next/link";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-8">Effective date: 2026-05-06</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <p>
              These Terms of Service (“Terms”) govern your access to and use of
              The Tripman website and booking services (“Services”). By using
              the Services, you agree to these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Availability</strong>: bookings are subject to
                availability and confirmation.
              </li>
              <li>
                <strong>Accurate information</strong>: you agree to provide
                accurate booking details (contact info, date/time, and any
                pickup notes).
              </li>
              <li>
                <strong>Timing</strong>: you are responsible for being ready at
                the scheduled time.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Pricing & payment
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>The Tripman Experience</strong>: a flat rate of{" "}
                <strong>99 CAD</strong> for a 60-minute ride covering 1–4
                people.
              </li>
              <li>
                The flat rate covers the ride itself: pick-up, drop-off at the
                same location, music, and the on-board party.
              </li>
              <li>
                Taxes/fees (if any) will be shown during booking/checkout.
              </li>
              <li>
                Payments are processed securely through Stripe. We do not store
                your full card number.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Cancellation & refunds
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>No self-service cancellations</strong>: for launch,
                bookings cannot be cancelled or changed online. If you need to
                request a change or cancellation, you must contact The Tripman
                directly.
              </li>
              <li>
                <strong>No refunds</strong>: all sales are final and refunds are
                not available at this time, even if a booking is cancelled.
                Refunds may be issued only where required by law or at our sole
                discretion in exceptional circumstances.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Content, recording & video features
            </h2>
            <p>
              The Tripman experience is content-driven. We may record audio,
              video, and photos during rides for use across our social channels
              (Instagram, TikTok, YouTube, Facebook), our website, and other
              promotional materials.
            </p>
            <p>
              <strong>
                Being featured in a Tripman video is not guaranteed.
              </strong>{" "}
              The flat-rate price covers the ride itself only. Whether your ride
              is filmed, edited, posted, or featured depends on the energy of
              the night, technical conditions, and our editorial discretion —
              there is no obligation, deadline, or refund tied to whether or
              when content from your ride is published. By booking, you grant
              The Tripman a perpetual, royalty-free license to use any
              recordings or images captured during your ride for the purposes
              described above.
            </p>
            <p>
              If you do not want to be filmed, please tell us before the ride
              begins.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Prohibited use
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not misuse the site or attempt unauthorized access.</li>
              <li>Do not submit fraudulent bookings or payment attempts.</li>
              <li>
                Do not harass or endanger staff, drivers, or other guests.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Disclaimers & limitation of liability
            </h2>
            <p>
              The Services are provided “as is” and “as available.” To the
              maximum extent permitted by law, The Tripman is not liable for
              indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits, data, or goodwill.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              Services after an update means you accept the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p>
              Questions? Email{" "}
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
