export default function HomePage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AksabCare is Working!
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this, the app is functioning properly.
        </p>
        <div className="space-y-2">
          <a href="/patient" className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go to Patient Dashboard
          </a>
          <a href="/debug" className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Go to Debug Page
          </a>
        </div>
      </div>
    </div>
  );
}