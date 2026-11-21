// Mascots.jsx - decorative stickers for the neo-brutalist theme.
// Pure SVG, no props needed. They are aria-hidden because they are only decoration.
export function Globe({ size = 120 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="44" fill="#4DB3FF" stroke="#111" strokeWidth="4"></circle><path d="M50 6V94M6 50H94M16 24Q50 38 84 24M16 76Q50 62 84 76M30 12Q10 50 30 88M70 12Q90 50 70 88" fill="none" stroke="#111" strokeWidth="2.5"></path><circle cx="50" cy="52" r="24" fill="#FF6FB5" stroke="#111" strokeWidth="3"></circle><circle cx="42" cy="47" r="3.5" fill="#111"></circle><circle cx="58" cy="47" r="3.5" fill="#111"></circle><path d="M38 56Q50 70 62 56Z" fill="#FFD23F" stroke="#111" strokeWidth="3"></path></svg>
  );
}

export function Sun({ size = 120 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false"><g stroke="#111" strokeWidth="5" strokeLinecap="round"><path d="M50 3V15M50 85V97M3 50H15M85 50H97M16 16L24 24M76 76L84 84M84 16L76 24M16 84L24 76"></path></g><circle cx="50" cy="50" r="27" fill="#FFD23F" stroke="#111" strokeWidth="4"></circle><circle cx="41" cy="46" r="4" fill="#111"></circle><circle cx="59" cy="46" r="4" fill="#111"></circle><path d="M39 57Q50 70 61 57" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round"></path></svg>
  );
}

export function Cat({ size = 120 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false"><path d="M16 42L20 6L46 24ZM84 42L80 6L54 24Z" fill="#fff" stroke="#111" strokeWidth="4" strokeLinejoin="round"></path><path d="M24 34L25 17L38 27ZM76 34L75 17L62 27Z" fill="#FF6FB5"></path><ellipse cx="50" cy="58" rx="40" ry="34" fill="#fff" stroke="#111" strokeWidth="4"></ellipse><path d="M26 44Q34 36 40 46M74 44Q66 36 60 46" fill="#9aa" opacity=".5"></path><path d="M53 26L43 44H52L47 58L61 38H52Z" fill="#FFD23F" stroke="#111" strokeWidth="3" strokeLinejoin="round"></path><circle cx="35" cy="58" r="6" fill="#111"></circle><circle cx="65" cy="58" r="6" fill="#111"></circle><circle cx="37" cy="56" r="2" fill="#fff"></circle><circle cx="67" cy="56" r="2" fill="#fff"></circle><circle cx="24" cy="70" r="6" fill="#FF6FB5"></circle><circle cx="76" cy="70" r="6" fill="#FF6FB5"></circle><path d="M42 70Q50 82 58 70Z" fill="#FF6FB5" stroke="#111" strokeWidth="3.5" strokeLinejoin="round"></path><path d="M4 60H16M4 72L16 67M96 60H84M96 72L84 67" stroke="#111" strokeWidth="3" strokeLinecap="round"></path></svg>
  );
}

export function Burst({ size = 110, label = 'GO!', fill = '#4DB3FF', ink = '#111' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <polygon points="98.0,50.0 85.1,58.0 93.2,70.8 78.1,72.4 79.9,87.5 65.6,82.4 60.7,96.8 50.0,86.0 39.3,96.8 34.4,82.4 20.1,87.5 21.9,72.4 6.8,70.8 14.9,58.0 2.0,50.0 14.9,42.0 6.8,29.2 21.9,27.6 20.1,12.5 34.4,17.6 39.3,3.2 50.0,14.0 60.7,3.2 65.6,17.6 79.9,12.5 78.1,27.6 93.2,29.2 85.1,42.0" fill={fill} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <text x="50" y="58" textAnchor="middle" fontFamily="Archivo Black" fontSize="24" fontStyle="italic" fill={ink}>{label}</text>
    </svg>
  );
}
