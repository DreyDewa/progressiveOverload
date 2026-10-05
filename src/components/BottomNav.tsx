'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home' },
  { href: '/progress', label: 'Progress' },
  { href: '/settings', label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/workout/')) return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-14 flex items-center justify-center text-sm ${active ? 'text-lime-400' : 'text-zinc-400'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
