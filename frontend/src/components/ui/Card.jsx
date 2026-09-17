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
          "bg-white",
          `shadow-${shadow}`,
          `rounded-${rounded}`,
          `p-${padding}`,
          "border border-gray-200",
          className
        )
      )}
    >
      {children}
    </div>
  );
}
