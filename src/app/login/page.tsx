'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else if (data.session) {
      setIsSuccess(true);
      // Memberikan jeda 1 detik agar animasi sukses terlihat sebelum pindah halaman
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-200 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-500 hover:scale-[1.01]">
        
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-20 h-20 object-contain mb-3 drop-shadow-sm" />
          <h2 className="font-bold text-lg text-gray-800">Arsip Nasional</h2>
          <p className="text-xs text-gray-500 mb-5">Republik Indonesia</p>
          
          <div className="w-full border-b border-gray-100 mb-5"></div>
          
          <h1 className="text-2xl font-bold text-gray-900">Login Petugas</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem Informasi 
            Sistem Tamu & Registrasi Kunjungan (Sitaris)</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm mb-6 animate-pulse">
            {errorMsg === 'Invalid login credentials' ? 'Email atau Password salah!' : errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="admin@anri.go.id"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full font-bold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 ease-in-out transform ${
              isSuccess 
                ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg shadow-green-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memeriksa...
              </>
            ) : isSuccess ? (
              <>
                <svg className="h-6 w-6 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                Login Berhasil!
              </>
            ) : (
              'Masuk ke Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}