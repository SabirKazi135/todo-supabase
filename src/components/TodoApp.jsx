import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { signOut } from '../lib/auth';
import ThemeToggle from './ThemeToggle';
import {
  Check,
  Trash2,
  LogOut,
  Plus,
  Pencil,
  X,
  Save,
  Calendar,
  SortDesc,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TodoApp() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // ✅ Fetch user & initial todos
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchTodos(user.id);
      }
    })();
  }, []);

  // ✅ Subscribe to realtime changes
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

    return () => supabase.removeChannel(channel);
  }, [user]);

  // ✅ Fetch todos
  async function fetchTodos(uid) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', uid)
      .order('id', { ascending: true });

    if (!error) {
      setTasks(data);
      applyFilterAndSort(data, filter, sortBy);
    }
  }

  // ✅ Add task
  async function addTodo(e) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          task: newTask,
          user_id: user.id,
          priority,
          due_date: dueDate || null,
        },
      ])
      .select('*')
      .single();

    if (!error && data) {
      setTasks((prev) => [...prev, data]);
      setNewTask('');
      setPriority('low');
      setDueDate('');
    }
  }

  // ✅ Toggle done
  async function toggleDone(todo) {
    const { data, error } = await supabase
      .from('todos')
      .update({ is_done: !todo.is_done })
      .eq('id', todo.id)
      .select('*')
      .single();

    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === todo.id ? data : t)));
    }
  }

  // ✅ Delete task
  async function deleteTodo(id) {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ✅ Save edit
  async function saveEdit(id) {
    if (!editText.trim()) return;
    const { data, error } = await supabase
      .from('todos')
      .update({ task: editText })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditingId(null);
      setEditText('');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  // ✅ Filtering + Sorting logic
  function applyFilterAndSort(all, filterType, sortType) {
    let filtered = all;
    if (filterType === 'active') filtered = all.filter((t) => !t.is_done);
    else if (filterType === 'completed')
      filtered = all.filter((t) => t.is_done);

    const order = { high: 3, medium: 2, low: 1 };
    const sorted = [...filtered].sort((a, b) => {
      switch (sortType) {
        case 'oldest':
          return a.id - b.id;
        case 'due':
          return (a.due_date || '').localeCompare(b.due_date || '');
        case 'priority':
          return (order[b.priority] || 0) - (order[a.priority] || 0);
        case 'name':
          return a.task.localeCompare(b.task);
        default:
          return b.id - a.id;
      }
    });

    setFilteredTasks(sorted);
  }

  useEffect(() => {
    applyFilterAndSort(tasks, filter, sortBy);
  }, [tasks, filter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-500 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-lg p-5 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold dark:text-white sm:text-3xl">
            📝 My Tasks
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut size={16} />{' '}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Add task */}
        <form
          onSubmit={addTodo}
          className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            className="flex-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-400 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-gray-300 bg-gray-100 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="low">Low 🔹</option>
            <option value="medium">Medium 🟡</option>
            <option value="high">High 🔴</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-gray-100 px-2 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-gray-100 hover:bg-blue-700">
            <Plus size={15} /> <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {/* Filter + Sort */}
        <div className="mb-4 flex flex-wrap justify-between gap-3">
          <div className="flex gap-2">
            {['all', 'active', 'completed'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                  filter === type
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SortDesc size={16} className="text-gray-700 dark:text-gray-300" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="due">Due Date</option>
              <option value="priority">Priority</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <ul className="space-y-2">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-center text-lg text-gray-500 dark:text-gray-400"
              >
                No tasks found — add one or change filter.
              </motion.p>
            ) : (
              filteredTasks.map((todo) => (
                <motion.li
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col justify-between gap-2 rounded-md border bg-gray-200 p-3 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center"
                >
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
                      <div className="flex flex-col">
                        <span
                          className={`text-lg ${
                            todo.is_done
                              ? 'text-gray-500 line-through dark:text-gray-400'
                              : 'text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {todo.task}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {todo.priority && (
                            <span
                              className={`rounded px-2 py-0.5 text-white ${
                                {
                                  low: 'bg-green-500',
                                  medium: 'bg-amber-500',
                                  high: 'bg-red-500',
                                }[todo.priority]
                              }`}
                            >
                              {todo.priority}
                            </span>
                          )}
                          {todo.due_date && (
                            <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Calendar size={12} /> {todo.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
