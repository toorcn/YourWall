import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl text-brand-900/60 mb-8">
          Oops! This page doesn't exist.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-medium hover:shadow-lg transition-all inline-block"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

