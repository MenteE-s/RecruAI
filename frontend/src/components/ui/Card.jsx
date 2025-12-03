// src/components/ui/Card.jsx
export default function Card({
  children,
  className = "",
  bgOpacity = "80",
  shadow = "md",
}) {
  return (
    <div
      className={`bg-white/${bgOpacity} ${
        bgOpacity === "80" ? "backdrop-blur-sm" : ""
      } rounded-2xl shadow-${shadow} border border-secondary-200 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
