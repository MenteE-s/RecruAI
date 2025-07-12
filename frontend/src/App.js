import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// MenteE Company Pages
import MenteELanding from './pages/MenteELanding';

// RecruAI Product Pages  
import RecruAILanding from './pages/RecruAILanding';

function App() {
  return (
    <Router>
      <Routes>
        {/* MenteE Company Landing */}
        <Route path="/" element={<MenteELanding />} />
        
        {/* RecruAI Product Landing */}
        <Route path="/recruai" element={<RecruAILanding />} />
      </Routes>
    </Router>
  );
}

export default App;
