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
  // Map props to actual Tailwind classes
  const getBgClass = () => {
    switch (opacity) {
      case 0: return "bg-white/0";
      case 10: return "bg-white/10";
      case 20: return "bg-white/20";
      case 30: return "bg-white/30";
      case 40: return "bg-white/40";
      case 50: return "bg-white/50";
      case 60: return "bg-white/60";
      case 70: return "bg-white/70";
      case 80: return "bg-white/80";
      case 90: return "bg-white/90";
      case 100: return "bg-white";
      default: return "bg-white/80";
    }
  };

  const getShadowClass = () => {
    switch (shadow) {
      case "sm": return "shadow-sm";
      case "md": return "shadow-md";
      case "lg": return "shadow-lg";
      case "xl": return "shadow-xl";
      case "2xl": return "shadow-2xl";
      default: return "shadow-md";
    }
  };

  const getRoundedClass = () => {
    switch (rounded) {
      case "none": return "rounded-none";
      case "sm": return "rounded-sm";
      case "md": return "rounded-md";
      case "lg": return "rounded-lg";
      case "xl": return "rounded-xl";
      case "2xl": return "rounded-2xl";
      case "3xl": return "rounded-3xl";
      case "full": return "rounded-full";
      default: return "rounded-2xl";
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case "0": return "p-0";
      case "1": return "p-1";
      case "2": return "p-2";
      case "3": return "p-3";
      case "4": return "p-4";
      case "5": return "p-5";
      case "6": return "p-6";
      case "8": return "p-8";
      case "10": return "p-10";
      case "12": return "p-12";
      default: return "p-6";
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          getBgClass(),
          getShadowClass(),
          getRoundedClass(),
          getPaddingClass(),
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