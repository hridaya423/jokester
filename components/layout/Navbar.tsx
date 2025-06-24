'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-black border-b border-gray-800 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/"
          className="w-24 font-bold">
          <img src="/logo.png" />
        </Link>

      </div>
    </nav>
  );
}