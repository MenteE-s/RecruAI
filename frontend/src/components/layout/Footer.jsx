// src/components/layout/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} RecruAI
    </footer>
  );
}
