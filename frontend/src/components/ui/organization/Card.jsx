export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white/95 rounded-2xl shadow-lg border border-secondary-200 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
