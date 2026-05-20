import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export default function Card({
  children,
  className,
  shadow = "md",
  rounded = "2xl",
  padding = "6",
}) {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-slate-800",
          `shadow-${shadow}`,
          `rounded-${rounded}`,
          `p-${padding}`,
          "border border-slate-700",
          className
        )
      )}
    >
      {children}
    </div>
  );
}
