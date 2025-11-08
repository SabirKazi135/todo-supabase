// src/components/AuthForm.jsx
import React, { useState } from 'react';
import { signUp, signIn } from '../lib/auth';

export default function AuthForm({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isLogin) {
        await signIn(email, password);
        setMessage('✅ Logged in!');
        onAuth();
      } else {
        await signUp(email, password);
        setMessage('✅ Signed up! Check your email for verification.');
      }
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">{isLogin ? 'Login' : 'Sign Up'}</h1>

      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-2">
        <input
          className="rounded p-2 text-black"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <input
            className="w-full rounded p-2 pr-10 text-black"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-800"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 py-2 hover:bg-blue-700"
        >
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <button
        className="text-sm text-gray-400 hover:text-gray-300"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'Create an account' : 'Already have an account? Log in'}
      </button>

      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}
