import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage"; // Import your page components

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;