// pages/admin/login.js
import React, { useState } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Use the admin credentials from your seed script
  const ADMIN_EMAIL = "admin@example.com"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // This calls your working API endpoint /api/auth/login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Successful login, redirect to admin dashboard
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError('A network error occurred. Try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - Nandan Traders</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">
            Admin Login
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Sign in to manage the wholesale platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-center font-medium text-red-600 bg-red-50 dark:bg-red-900/50 p-3 rounded-lg">
                {error}
              </p>
            )}
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ADMIN_EMAIL}
                className="mt-1 w-full p-3 border dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="mt-1 w-full p-3 border dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 py-3"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}