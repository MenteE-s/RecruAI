export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white/90 rounded-2xl shadow-md border border-secondary-200 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
