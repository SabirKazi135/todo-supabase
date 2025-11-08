import React, { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import TodoApp from './components/TodoApp';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return session ? <TodoApp /> : <AuthForm onAuth={() => {}} />;
}
