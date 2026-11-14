import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('safalpath-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('safalpath-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      className="flex items-center gap-2 px-3 py-2 rounded-xl border theme-card hover:scale-105 transition-all cursor-pointer shadow-sm"
    >
      {dark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-semibold">Dark</span>
        </>
      )}
    </button>
  );
}