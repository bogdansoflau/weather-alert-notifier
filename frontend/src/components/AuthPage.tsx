import React, { useState } from "react";
import type { FormEvent } from "react";
import { FaUser, FaLock } from "react-icons/fa";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: call POST /api/auth/login
    console.log("Logging in", { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/texture-fluid.svg')] opacity-20"></div>

      <div className="relative z-10 bg-gray-900 bg-opacity-80 rounded-2xl p-10 shadow-2xl backdrop-blur-lg max-w-sm w-full">
        <h1 className="text-4xl font-extrabold text-white mb-6 text-center">
          Welcome, <span className="text-cyan-400">{"{developers}"}</span>
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center border border-gray-700 rounded-lg p-3 bg-gray-800">
            <FaUser className="text-gray-400 mr-3" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-500"
            />
          </div>

          <div className="flex items-center border border-gray-700 rounded-lg p-3 bg-gray-800">
            <FaLock className="text-gray-400 mr-3" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-magenta-500 to-purple-500 hover:from-magenta-600 hover:to-purple-600 transition"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don’t have an account?{" "}
          <a href="/register" className="text-purple-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
