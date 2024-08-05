import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage"; // Import your page components
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RecommendationsPage from "./pages/RecommendationsPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/recommendations" element={<RecommendationsPage/>}/>
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
