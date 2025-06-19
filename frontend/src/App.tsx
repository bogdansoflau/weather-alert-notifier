import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import SignUpPage from "./components/SignUpPage";
import MainPage from "./components/MainPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/dashboard" element={<MainPage />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
