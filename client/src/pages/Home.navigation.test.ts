import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('home navigation interactions', () => {
  it('keeps mobile menu controls accessible and dismissible', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.tsx'), 'utf8');
    expect(source).toContain('aria-label="Toggle navigation menu"');
    expect(source).toContain('href="/"');
    expect(source).toContain('Home');
    expect(source).toContain('aria-expanded={mobileMenuOpen}');
    expect(source).toContain('aria-controls="mobile-navigation"');
    expect(source).toContain('id="mobile-navigation"');
    expect(source).toContain('className="hidden lg:flex items-center');
    expect(source).toContain('<div className="lg:hidden">');
    expect(source).toContain('<nav ref={menuRef}');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("document.addEventListener('mousedown', handleOutsideClick)");
    expect(source).toContain('pointer-events-none max-h-0');
    expect(source).toContain('onClick={() => setMobileMenuOpen(false)}');
    expect(source).toContain('aria-label="Close navigation menu"');
    expect(source).toContain('fixed inset-0 z-40');
    expect(source).toContain('backdrop-blur-[2px]');
    expect(source).toContain('pointer-events-auto opacity-100');
    expect(source).toContain('pointer-events-none opacity-0');
  });
});
