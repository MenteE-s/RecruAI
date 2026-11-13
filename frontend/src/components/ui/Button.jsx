import { cn } from "../../lib/cn";
import { Link } from "react-router-dom";

const variants = {
  primary:
    "bg-brand text-white border border-brand shadow-s5 hover:bg-brand/90 active:bg-brand/80 disabled:bg-brand/60",
  secondary:
    "bg-surface text-ink border border-line hover:bg-gray-50 dark:hover:bg-gray-25 active:bg-gray-100 disabled:text-gray-500",
  dark: "bg-gray-900 text-white border border-gray-900 hover:bg-gray-800 active:bg-gray-900 dark:bg-gray-900 dark:text-gray-0 dark:hover:bg-gray-800",
  ghost: "bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-25 hover:text-ink",
  quiet: "bg-gray-50 dark:bg-gray-25 text-ink border border-line hover:bg-gray-100",
  danger: "bg-transparent text-[#DC2626] hover:bg-[#DC2626]/10",
};

const sizes = {
  sm: "h-8 px-3 text-[13px] font-semibold rounded-xl gap-1.5",
  md: "h-9 px-4 text-sm font-semibold rounded-xl gap-1.5",
  lg: "h-10 px-5 text-sm font-semibold rounded-xl gap-2",
  none: "",
};

function buttonClass(variant = "secondary", size = "md", className) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
    "focus-visible:ring-offset-0",
    "disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function IconButton({ label, children, className, active, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-500",
        "transition-[color,background-color,transform] duration-150 hover:bg-gray-50 hover:text-ink active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-100 dark:focus-visible:ring-gray-600/50",
        active && "bg-gray-50 text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}