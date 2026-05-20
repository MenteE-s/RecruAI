// src/components/layout/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-4 px-6 text-center text-sm text-slate-400">
      © {new Date().getFullYear()} RecruAI
    </footer>
  );
}
