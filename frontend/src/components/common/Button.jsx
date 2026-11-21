// Button.jsx - one reusable button with 4 looks (variants) and 3 sizes.
// "enabled:hover:" means the hover colour only applies when the button is NOT disabled.
const VARIANTS = {
  primary: 'bg-indigo-600 text-white enabled:hover:bg-indigo-700 focus:ring-indigo-300',
  secondary: 'bg-white text-slate-700 border border-slate-300 enabled:hover:bg-slate-100 focus:ring-slate-300',
  danger: 'bg-red-600 text-white enabled:hover:bg-red-700 focus:ring-red-300',
  ghost: 'bg-transparent text-slate-700 enabled:hover:bg-slate-200 focus:ring-slate-300',
};

const SIZES = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus:outline-none focus:ring-2',
    // Disabled buttons look faded and show a "not allowed" cursor
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].join(' ');

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
