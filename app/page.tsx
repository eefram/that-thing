"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Event = {
  id: string;
  title: string;
  date: string;
  color: string;
};

const COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-red-500", "bg-yellow-500", "bg-pink-500"];

type DeleteStep = "idle" | "confirm" | "code";

export default function Home() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
      setShowAuth(false);
    } else {
      setEvents([]);
    }
  }, [user]);

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*");
    if (data) setEvents(data);
  };

  const handleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: "https://that-thing-ephraimavram07-2790s-projects.vercel.app" } });
      if (error) setAuthError(error.message);
      else setAuthError("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowAccount(false);
  };

  // Step 1: user clicks "Delete Account" → show password confirmation
  const handleRequestDeleteCode = () => {
    setDeleteStep("code");
    setDeleteError("");
  };

  // Step 2: user enters password → verify, then delete account + data
  const handleConfirmDelete = async () => {
    if (!user?.email || !deletePassword.trim()) return;
    setDeleteLoading(true);
    setDeleteError("");
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: deletePassword });
    if (verifyError) {
      setDeleteError("Incorrect password. Please try again.");
      setDeleteLoading(false);
      return;
    }
    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleteLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setShowAccount(false);
    setDeleteStep("idle");
    setDeletePassword("");
    setDeleteLoading(false);
  };

  const closeAccount = () => {
    setShowAccount(false);
    setDeleteStep("idle");
    setDeletePassword("");
    setDeleteError("");
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const addEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    if (!user) { setShowAuth(true); setShowModal(false); return; }
    const newEvent = { title: newEventTitle.trim(), date: selectedDate, color: selectedColor, user_id: user.id };
    const { data, error } = await supabase.from("events").insert(newEvent).select().single();
    if (!error && data) setEvents([...events, data]);
    setNewEventTitle("");
    setShowModal(false);
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEvents(events.filter((e) => e.id !== id));
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          that thing<span className="text-blue-500">.</span>
        </h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button onClick={() => setShowAccount(true)} className="text-sm text-gray-400 hover:text-white transition">{user.email}</button>
              <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition">Sign out</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition">
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-800 transition text-xl">‹</button>
          <h2 className="text-xl font-semibold">{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-800 transition text-xl">›</button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = formatDate(currentYear, currentMonth, day);
            const dayEvents = events.filter((e) => e.date === dateStr);
            return (
              <div
                key={dateStr}
                onClick={() => { setSelectedDate(dateStr); setShowModal(true); }}
                className={`min-h-[80px] rounded-xl p-2 cursor-pointer transition border ${
                  isToday(day) ? "border-blue-500 bg-blue-950" : "border-gray-800 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <span className={`text-sm font-semibold ${isToday(day) ? "text-blue-400" : "text-gray-300"}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className={`${ev.color} text-white text-xs rounded px-1 py-0.5 truncate flex items-center justify-between group`}>
                      <span className="truncate">{ev.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!user && (
          <p className="text-center text-gray-600 text-sm mt-8">
            <button onClick={() => setShowAuth(true)} className="text-blue-500 hover:underline">Sign in</button> to save your events across devices.
          </p>
        )}
      </main>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-1">Add Event</h3>
            <p className="text-sm text-gray-400 mb-4">{selectedDate}</p>
            <input
              type="text"
              placeholder="Event title..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2 mb-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full ${c} ${selectedColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={addEvent} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-1">{authMode === "login" ? "Sign in" : "Create account"}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {authMode === "login" ? "Welcome back to that thing." : "Join that thing. and organize your college life."}
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-4"
            />
            {authError && <p className="text-sm text-red-400 mb-3">{authError}</p>}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowAuth(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleAuth} disabled={authLoading} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50">
                {authLoading ? "..." : authMode === "login" ? "Sign in" : "Sign up"}
              </button>
            </div>
            <p className="text-center text-sm text-gray-500">
              {authMode === "login" ? "No account? " : "Already have one? "}
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }} className="text-blue-400 hover:underline">
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            {deleteStep === "idle" && (
              <>
                <h3 className="text-lg font-semibold mb-1">Account</h3>
                <p className="text-sm text-gray-400 mb-6">{user?.email}</p>
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-sm text-gray-500 mb-3">Danger zone</p>
                  <button
                    onClick={() => setDeleteStep("confirm")}
                    className="w-full py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-950 text-sm transition"
                  >
                    Delete account
                  </button>
                </div>
                <button onClick={closeAccount} className="w-full mt-3 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition">Close</button>
              </>
            )}

            {deleteStep === "confirm" && (
              <>
                <h3 className="text-lg font-semibold mb-2">Delete account?</h3>
                <p className="text-sm text-gray-400 mb-6">
                  This will permanently delete your account and all your events. We&apos;ll send a confirmation code to <span className="text-white">{user?.email}</span>.
                </p>
                {deleteError && <p className="text-sm text-red-400 mb-3">{deleteError}</p>}
                <div className="flex gap-2">
                  <button onClick={closeAccount} className="flex-1 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition">Cancel</button>
                  <button
                    onClick={handleRequestDeleteCode}
                    disabled={deleteLoading}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
                  >
                    {deleteLoading ? "Sending..." : "Send code"}
                  </button>
                </div>
              </>
            )}

            {deleteStep === "code" && (
              <>
                <h3 className="text-lg font-semibold mb-2">Confirm with password</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Enter your password to permanently delete your account and all your data.
                </p>
                <input
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmDelete()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 mb-4"
                  autoFocus
                />
                {deleteError && <p className="text-sm text-red-400 mb-3">{deleteError}</p>}
                <div className="flex gap-2">
                  <button onClick={closeAccount} className="flex-1 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition">Cancel</button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading || !deletePassword}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
                  >
                    {deleteLoading ? "Deleting..." : "Delete forever"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
