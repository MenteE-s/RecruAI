import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export default function Card({
  children,
  className,
  opacity = 80,
  shadow = "md",
  rounded = "2xl",
  padding = "6",
  blur = true,
}) {
  const bgClass = `bg-white/${opacity}`;
  const shadowClass = `shadow-${shadow}`;
  const roundedClass = `rounded-${rounded}`;
  const paddingClass = `p-${padding}`;

  return (
    <div
      className={twMerge(
        clsx(
          bgClass,
          shadowClass,
          roundedClass,
          paddingClass,
          blur && opacity >= 50 && "backdrop-blur-sm",
          "border border-secondary-200",
          className
        )
      )}
    >
      {children}
    </div>
  );
}
