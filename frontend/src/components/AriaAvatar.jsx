import { useId } from 'react';

export default function AriaAvatar({ size = 84, speaking = false, className = '' }) {
  const id = useId().replace(/:/g, '');
  return <div className={`aria-svg-avatar ${speaking ? 'speaking' : ''} ${className}`} role="img" aria-label="Aria, your friendly AI interview coach" style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0df"/><stop offset="1" stopColor="#dcecdf"/></linearGradient>
        <linearGradient id={`${id}-hair-fill`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#57372f"/><stop offset="1" stopColor="#2d2929"/></linearGradient>
        <linearGradient id={`${id}-top-fill`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#75a987"/><stop offset="1" stopColor="#315d45"/></linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill={`url(#${id}-bg)`}/>
      <path d="M17 117c3-23 18-35 43-35s40 12 43 35" fill={`url(#${id}-top-fill)`}/>
      <path d="M48 77h24v19H48z" fill="#e9a77e"/>
      <path d="M31 56c-4-30 7-45 29-45 24 0 34 17 29 48l-5 25c-3 14-13 23-25 23S36 98 33 83z" fill={`url(#${id}-hair-fill)`}/>
      <path d="M38 45c0-20 9-30 23-30 16 0 25 12 24 31l-2 27c-1 14-11 24-23 24S38 86 38 72z" fill="#f4c09a"/>
      <path d="M34 51c-2-24 7-40 27-40 17 0 27 10 28 31-7-2-13-7-17-15-8 10-21 16-38 16z" fill={`url(#${id}-hair-fill)`}/>
      <path d="M36 35c0 21 3 37 8 48-10-2-15-12-16-27-1-16 1-27 8-35zM85 30c8 9 10 22 8 38-1 10-5 17-12 20 6-16 5-40 4-58z" fill={`url(#${id}-hair-fill)`}/>
      <path d="M47 59c3-3 7-3 10 0M65 59c3-3 7-3 10 0" fill="none" stroke="#523b35" strokeWidth="2" strokeLinecap="round"/>
      <ellipse className="aria-svg-eye" cx="52" cy="64" rx="2.4" ry="3.2" fill="#382d2a"/><ellipse className="aria-svg-eye" cx="69" cy="64" rx="2.4" ry="3.2" fill="#382d2a"/>
      <path d="M60 64l-2 9 4 1" fill="none" stroke="#d28d6d" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M53 80c4 5 11 5 15 0" fill="none" stroke="#a95751" strokeWidth="2" strokeLinecap="round" className="aria-svg-mouth"/>
      <circle cx="42" cy="73" r="4" fill="#e98b82" opacity=".3"/><circle cx="78" cy="73" r="4" fill="#e98b82" opacity=".3"/>
      <path d="M38 76c-3 3-3 7 0 9 3-2 4-5 2-8M82 76c3 3 3 7 0 9-3-2-4-5-2-8" fill="none" stroke="#e2b95e" strokeWidth="2"/>
      <path d="M49 91c7 5 15 5 22 0l7 4-3 15H45l-3-15z" fill="#f3f0e7" opacity=".92"/>
      <circle cx="95" cy="26" r="3" fill="#f0a65f"/><path d="M95 18v16M87 26h16" stroke="#fff" strokeWidth="1.5" opacity=".8"/>
    </svg>
    <span className="aria-avatar-halo"/>
  </div>;
}
