'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const navLinks = [
  { href: '/cast', label: 'CAST' },
  { href: '/schedule', label: 'SCHEDULE' },
  { href: '/system', label: 'SYSTEM' },
  { href: '/news', label: 'NEWS' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/recruit', label: 'RECRUIT' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Image
              src="https://xekcytahekbmohmkvojz.supabase.co/storage/v1/object/public/gallery-images/IMG_2507.JPG"
              alt="Reve"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 ml-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium tracking-widest text-text-secondary hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>


          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 ml-auto"
            aria-label="メニュー"
          >
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-all duration-300 ${
                isOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-all duration-300 ${
                isOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-all duration-300 ${
                isOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="px-4 pb-6 pt-2 border-t border-border bg-black">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 text-sm tracking-widest text-text-secondary hover:text-accent transition-colors border-b border-border last:border-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
