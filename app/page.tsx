"use client";

import { useState } from "react";

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

export default function Home() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

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

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    setEvents([...events, { id: crypto.randomUUID(), title: newEventTitle.trim(), date: selectedDate, color: selectedColor }]);
    setNewEventTitle("");
    setShowModal(false);
  };

  const deleteEvent = (id: string) => setEvents(events.filter((e) => e.id !== id));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          that thing<span className="text-blue-500">.</span>
        </h1>
        <span className="text-sm text-gray-500">your college life, organized</span>
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
      </main>

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
    </div>
  );
}
