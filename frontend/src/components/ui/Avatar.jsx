import { cn } from "../../lib/cn";
import { initials } from "../../lib/format";

const palettes = [
  ["#E7F6EC", "#BFE3CF"],
  ["#EDEBFB", "#CEC7F2"],
  ["#FFF1E4", "#FFD3B4"],
  ["#E6F2FF", "#C3DCFA"],
  ["#F1F7E8", "#D8E9BC"],
  ["#FBEFF3", "#EDCAD9"],
  ["#E9F7F4", "#BFE7DB"],
  ["#F3F1EA", "#DAD3BF"],
];

const sizes = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-xs",
  xl: "h-12 w-12 text-sm",
  "2xl": "h-16 w-16 text-lg",
  "3xl": "h-24 w-24 text-2xl",
};

export function avatarGradient(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return palettes[hash % palettes.length];
}

export function Avatar({
  name,
  gradient,
  size = "lg",
  className,
  rounded = "full",
  ring = false,
}) {
  const [from, to] = gradient || avatarGradient(name);
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold text-[#334155]",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        sizes[size],
        ring && "ring-2 ring-surface",
        className
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="select-none tracking-tight">{initials(name)}</span>
    </span>
  );
}

export function AvatarStack({ people, size = "md", extra, className }) {
  const shown = people.slice(0, 4);
  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          gradient={person.gradient}
          size={size}
          ring
          className={index === 0 ? "" : "-ml-2"}
        />
      ))}
      {extra ? (
        <span
          className={cn(
            "-ml-2 inline-flex items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-600 ring-2 ring-surface",
            sizes[size]
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}