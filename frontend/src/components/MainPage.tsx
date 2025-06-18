import React from "react";
import { useLocation } from "react-router-dom";

type LocationState = {
  user: { id: string; name: string; email: string };
};

export default function MainPage() {
  const { state } = useLocation();
  const user = (state as LocationState)?.user;

  if (!user) {
    return <div className="p-10 text-center">No user data found.</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Hello, {user.name}!</h2>
        <p className="text-xl text-gray-700">{user.email}</p>
      </div>
    </div>
  );
}
