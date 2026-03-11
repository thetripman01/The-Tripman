import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-700 transition-colors duration-200"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
