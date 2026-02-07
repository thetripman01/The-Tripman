export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-8">
          Effective date: {new Date().getFullYear()}-01-01
        </p>

        <div className="space-y-10 text-gray-700">
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
                Pricing may vary by package and group size. Taxes/fees (if any)
                will be shown during booking/checkout.
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
              Content and posting
            </h2>
            <p>
              The Tripman experience is content-driven. We may record or create
              content during rides. Posting is not guaranteed unless explicitly
              included in the package description (for example, “Experience +”).
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
                className="text-green-700 hover:underline"
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
