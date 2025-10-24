// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Public Pages
import RecruAILanding from "./pages/RecruAILanding";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import ProtectedRoute from "./components/ProtectedRoute";
// Dashboard Page (new)
import DashboardSwitcher from "./pages/DashboardSwitcher";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RecruAILanding />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardSwitcher />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
