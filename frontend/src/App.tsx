// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
// (Later you’ll add other pages like Dashboard, Register, etc.)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        {/* redirect the root to /auth for now */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        {/* catch-all: send back to /auth until more pages exist */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
