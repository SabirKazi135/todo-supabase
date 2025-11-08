// src/App.jsx
import React, { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import TodoApp from './components/TodoApp';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading state

  useEffect(() => {
    // Fetch current session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to auth events (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return session ? <TodoApp /> : <AuthForm onAuth={() => {}} />;
}
