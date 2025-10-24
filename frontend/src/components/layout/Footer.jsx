// src/components/layout/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-white border-t border-secondary-200 py-4 px-6 text-center text-sm text-secondary-500">
      © {new Date().getFullYear()} MenteE
    </footer>
  );
}
