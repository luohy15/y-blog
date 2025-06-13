'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: 'About', href: '/', active: pathname === '/' },
    { name: 'Writing', href: '/writing', active: pathname === '/writing' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-border bg-background backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-8">
        {/* Avatar */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(76, 154, 231)' }}>
            <span className="text-white font-semibold text-sm">Y</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                item.active 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
