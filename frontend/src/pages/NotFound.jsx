import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-32 text-center">
      <p className="font-serif text-6xl text-gold mb-4">404</p>
      <h1 className="font-serif text-2xl mb-2">This page doesn't exist</h1>
      <p className="text-ink-light mb-8">
        The link might be broken, or the page may have moved.
      </p>
      <Link
        to="/"
        className="inline-block bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-light transition-colors"
      >
        Back to job listings
      </Link>
    </div>
  );
}
