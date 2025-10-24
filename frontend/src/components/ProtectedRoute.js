// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";

// 🔥 Replace this with your actual auth logic later (e.g., check token)
const isAuthenticated = () => {
  return localStorage.getItem("isAuthenticated") === "true";
};

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}
