import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
  { href: '/cast', label: 'CAST' },
  { href: '/schedule', label: 'SCHEDULE' },
  { href: '/system', label: 'SYSTEM' },
  { href: '/news', label: 'NEWS' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/recruit', label: 'RECRUIT' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-20 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <Link href="/">
            <Image
              src="https://xekcytahekbmohmkvojz.supabase.co/storage/v1/object/public/gallery-images/IMG_2507.JPG"
              alt="Reve"
              width={200}
              height={68}
              className="h-16 w-auto object-contain"
              unoptimized
            />
          </Link>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs tracking-widest text-text-muted hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {/* Copyright */}
          <p className="text-xs text-text-muted tracking-wider">
            &copy; {year} Reve. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
