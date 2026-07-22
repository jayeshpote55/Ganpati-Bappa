import React from "react";
import { FaOm } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-maroon-700 text-orange-100 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-xl font-display font-bold text-white mb-2">
          <span>🐘</span> Ganesh Mitra Mandal Platform
        </div>
        <p className="text-sm text-orange-200">Ganpati Bappa Morya! Mangal Murti Morya! 🙏</p>
        <p className="text-xs text-orange-300 mt-4">
          © {new Date().getFullYear()} — Built with devotion for every Bappa Mandal.
        </p>
      </div>
    </footer>
  );
}
