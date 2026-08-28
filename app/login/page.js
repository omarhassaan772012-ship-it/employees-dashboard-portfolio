'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import Link from 'next/link';
import "./page.css";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dir-rtl">
      <div className="w-full max-w-md p-8 bg-white shadow-lg">
        <h2 className="text-2xl font-bold text-center text-black mb-6">
          Login to Dashboard
        </h2>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border  focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-black text-white font-medium"
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {state?.error && (
          <p className="mt-4 text-center text-red-600">{state.error}</p>
        )}

        <Link href="/register" className="block text-center mt-4 text-blue-600 hover:underline">
          Change Password
        </Link>
      </div>
    </main>
  );
}