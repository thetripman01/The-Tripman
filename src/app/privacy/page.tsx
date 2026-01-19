export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-4">
          This is a placeholder Privacy Policy page. Replace this content with
          your final policy before launch.
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-2">
          <li>
            We collect contact details you submit for booking and support
            purposes.
          </li>
          <li>
            Payment is processed securely via Stripe; we do not store card
            details.
          </li>
          <li>We use analytics (optional) to understand site usage.</li>
        </ul>
      </div>
    </main>
  );
}
