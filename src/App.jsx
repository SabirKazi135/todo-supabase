// src/App.jsx
import React, { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import TodoApp from './components/TodoApp';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // ✅ 1️⃣ Fetch current session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // ✅ 2️⃣ Verify if user actually exists (handles deleted accounts)
    async function verifyUser() {
      const { data, error } = await supabase.auth.getUser();

      // If user doesn't exist or token is invalid — clear session
      if (error || !data?.user) {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        setSession(null);
      }
    }

    verifyUser();

    // ✅ 3️⃣ Listen for auth state changes (login/logout/refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    // ✅ Cleanup listener on unmount
    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ 4️⃣ Loading state while checking session
  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // ✅ 5️⃣ Render either app or auth screen
  return session ? <TodoApp /> : <AuthForm onAuth={() => {}} />;
}
