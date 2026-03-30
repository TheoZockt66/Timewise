import CalendarView from './CalendarView';

export default function CalendarPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Mein Lernkalender</h1>
      <CalendarView />
    </main>
  );
}