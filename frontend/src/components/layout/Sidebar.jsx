// src/components/layout/Sidebar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

export default function Sidebar({ open, toggleSidebar, items = [] }) {
  // Separate settings from other items if it exists
  const topItems = items.filter((i) => i.name !== "Settings");
  const settingsItem = items.find((i) => i.name === "Settings");

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-white shadow"
      >
        <FiMenu className="h-6 w-6 text-secondary-700" />
      </button>

      {/* Sidebar - use flex-col so we can pin settings to the bottom */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-10 w-64 bg-white border-r border-secondary-200 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out h-full md:h-screen flex flex-col`}
        aria-label="Sidebar"
      >
        <div className="p-6 border-b border-secondary-200">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-accent-500 font-display">
            RecruAI
          </h1>
        </div>

        {/* main nav grows */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {topItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.link}
                  className="flex items-center space-x-3 px-4 py-3 text-secondary-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* pinned footer */}
        {settingsItem && (
          <div className="p-4 border-t border-secondary-200 mt-auto">
            <Link
              to={settingsItem.link}
              className="flex items-center space-x-3 px-4 py-3 text-secondary-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition"
            >
              <settingsItem.icon className="h-5 w-5" />
              <span>{settingsItem.name}</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
