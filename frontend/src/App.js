import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import your pages
import MenteELanding from './pages/MenteELanding';
import RecruAILanding from './pages/RecruAILanding';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* MenteE Company Routes */}
          <Route path="/" element={<MenteELanding />} />
          
          {/* RecruAI Product Routes */}
          <Route path="/recruai" element={<RecruAILanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Redirect any other routes to home */}
          <Route path="*" element={<MenteELanding />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
