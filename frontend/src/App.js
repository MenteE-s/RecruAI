import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// RecruAI Product Pages
import RecruAILanding from "./pages/RecruAILanding";

function App() {
  return (
    <Router>
      <Routes>
        {/* MenteE Company Landing */}
        <Route path="/" element={<RecruAILanding />} />
      </Routes>
    </Router>
  );
}

export default App;
