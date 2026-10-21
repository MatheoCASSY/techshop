import { ApiStatus } from './components/ApiStatus';

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold tracking-tight text-indigo-600">techshop</span>
          <ApiStatus />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Bienvenue sur techshop</h1>
        <p className="mt-3 text-gray-600">Le catalogue arrive bientôt.</p>
      </main>
    </div>
  );
}
