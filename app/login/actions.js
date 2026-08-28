'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const API_URL =
  process.env.NEXT_PUBLIC_SECURITY_API_URL || "https://employees-dashboard-back-end-portfo.vercel.app/api/security/login";

export async function loginAction(previousState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (response.ok) {
      const cookieStore = await cookies();
      cookieStore.set('dashboard_session_v2', 'authenticated', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60,
        path: '/',
      });
      redirect('/staff-dashboard');
    }

    if (response.status === 401) {
      return { error: 'بيانات الدخول غير صحيحة' };
    }

    throw new Error(`Login request failed with status ${response.status}`);
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Login error:', error);
  }

  return { error: 'تعذر الاتصال بالخادم، حاول مرة أخرى' };
}