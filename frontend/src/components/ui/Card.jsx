// src/components/ui/Card.jsx
export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-secondary-200 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
