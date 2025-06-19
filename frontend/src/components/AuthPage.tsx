import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "../types";
import { FaUser, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data } = await axios.post<{
        token: string;
        user: User;
      }>("http://localhost:3001/api/auth/login", {
        email,
        password,
      });
      setError(null);
      localStorage.setItem("token", data.token);
      navigate("/dashboard", { state: { user: data.user } });
    } catch (err: unknown) {
      const message =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        (typeof err === "object" &&
          err !== null &&
          // @ts-expect-error – runtime check is enough
          err.response?.data?.message) ||
        (err instanceof Error && err.message) ||
        // 4. Fallback
        "Login failed. Please try again.";

      setError(message);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-r from-blue-900 via-purple-600 to-pink-500
        bg-[length:400%_400%] animate-gradient-x
        relative overflow-hidden
      "
    >
      <div className="relative z-10 bg-gray-900 bg-opacity-80 rounded-2xl p-10 shadow-2xl backdrop-blur-lg max-w-sm w-full">
        <h1 className="text-4xl font-extrabold text-white mb-6 text-center">
          🌦️ Welcome to Weather Alerts
        </h1>

        {error && <div className="mb-4 text-center text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center border border-white rounded-lg p-3 bg-transparent">
            <FaUser className="text-white mr-3" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center border border-white rounded-lg p-3 bg-transparent">
            <FaLock className="text-white mr-3" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            className="
              w-full py-3 rounded-lg font-semibold text-white
              border border-white hover:border-purple-500 transition
            "
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-purple-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
