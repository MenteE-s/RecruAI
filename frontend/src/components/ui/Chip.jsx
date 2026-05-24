import { twMerge } from "tailwind-merge";

export default function Chip({
  children,
  className = "",
  variant = "secondary",
  size = "default",
}) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-primary",
  };
  
  const sizeClasses = {
    default: "h-9 px-3 py-2",
    sm: "h-8 px-2.5",
    lg: "h-10 px-4",
    icon: "h-10 w-10",
  };

  return (
    <span
      className={twMerge(
        baseClasses,
        variantClasses[variant] || variantClasses.secondary,
        sizeClasses[size] || sizeClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}