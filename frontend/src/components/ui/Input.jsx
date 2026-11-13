import { cn } from "../../lib/cn";

/**
 * Input — port of the Peerlist reference input pattern.
 * h-9, radius 8, border-line, focus ring on brand.
 */
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors",
        "placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-600/50",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        className
      )}
      {...props}
    />
  );
}

export default Input;
