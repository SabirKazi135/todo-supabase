// src/components/TodoApp.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { signOut } from '../lib/auth';
import ThemeToggle from './ThemeToggle';
import { Check, Trash2, LogOut, Plus, Pencil, X, Save } from 'lucide-react';

export default function TodoApp() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Fetch user and todos once on load
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchTodos(user.id);
      }
    })();
  }, []);

  // ✅ Realtime updates (sync between devices)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('todos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchTodos(user.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ Fetch all todos for user
  async function fetchTodos(uid) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', uid)
      .order('id', { ascending: true });

    if (!error) setTasks(data);
  }

  // ✅ Add task instantly
  async function addTodo(e) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const { data, error } = await supabase
      .from('todos')
      .insert([{ task: newTask, user_id: user.id }])
      .select('*')
      .single();

    if (!error && data) {
      setTasks((prev) => [...prev, data]);
      setNewTask('');
    }
  }

  // ✅ Toggle done state
  async function toggleDone(todo) {
    const { data, error } = await supabase
      .from('todos')
      .update({ is_done: !todo.is_done })
      .eq('id', todo.id)
      .select()
      .single();

    if (!error && data) {
      setTasks((t) => t.map((item) => (item.id === todo.id ? data : item)));
    }
  }

  // ✅ Delete task
  async function deleteTodo(id) {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTasks((t) => t.filter((item) => item.id !== id));
  }

  // ✅ Save edited task
  async function saveEdit(id) {
    if (!editText.trim()) return;

    const { data, error } = await supabase
      .from('todos')
      .update({ task: editText })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      setTasks((t) => t.map((item) => (item.id === id ? data : item)));
      setEditingId(null);
      setEditText('');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 transition-colors duration-500 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-lg p-5 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
            📝 My Tasks
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Add new task */}
        <form onSubmit={addTodo} className="mb-5 flex gap-2">
          <input
            className="flex-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-400 transition focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-gray-100 transition hover:bg-blue-700">
            <Plus size={15} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {/* Task list */}
        <ul className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
              No tasks yet — add one to get started.
            </p>
          ) : (
            tasks.map((todo) => (
              <li
                key={todo.id}
                className="flex flex-col justify-between gap-2 rounded-md border bg-gray-200 p-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center"
              >
                {/* Task text + toggle */}
                <div className="flex flex-1 items-center gap-3">
                  <button
                    onClick={() => toggleDone(todo)}
                    className={`rounded-full border p-1.5 transition ${
                      todo.is_done
                        ? 'border-green-600 bg-green-500 text-white'
                        : 'border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Check size={10} />
                  </button>

                  {editingId === todo.id ? (
                    <input
                      className="flex-1 border-b border-gray-400 bg-transparent px-1 text-base outline-none dark:border-gray-600"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  ) : (
                    <span
                      className={`flex-1 text-lg ${
                        todo.is_done
                          ? 'text-gray-500 line-through dark:text-gray-400'
                          : 'text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {todo.task}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-1">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="flex items-center gap-1 rounded-md bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                      >
                        <Save size={13} /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-md bg-gray-400 px-2 py-1 text-xs text-white hover:bg-gray-500"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(todo.id);
                          setEditText(todo.task);
                        }}
                        className="flex items-center gap-1 rounded-md bg-amber-400 px-2 py-1 text-xs text-gray-900 hover:bg-amber-500"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
