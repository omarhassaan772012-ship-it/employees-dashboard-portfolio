"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_SECURITY_API_URL?.replace("/login", "/password") ||
  "https://employees-dashboard-back-end-portfo.vercel.app/api/security/password";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ email: "", currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password");
      }

      setMessage("Password changed successfully.");
      setForm({ email: "", currentPassword: "", newPassword: "" });
    } catch (requestError) {
      setError(requestError.message || "Unable to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white shadow-lg">
        <h1 className="text-2xl font-bold text-center text-black mb-6">
          Change Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
            className="w-full px-4 py-2 border focus:ring-2 outline-none"
          />
          <input
            type="password"
            placeholder="Current password"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            required
            className="w-full px-4 py-2 border outline-none"
          />
          <input
            type="password"
            placeholder="New password"
            minLength={4}
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
            className="w-full px-4 py-2 border outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white font-medium disabled:opacity-60"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        <Link href="/login" className="block text-center mt-4 text-blue-600 hover:underline">
          Back to Login
        </Link>
      </div>
    </main>
  );
}
