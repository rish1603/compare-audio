export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl w-full">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-4">
          Hello, World!
        </h1>
        <p className="text-lg text-gray-700 text-center mb-6">
          Welcome to your Next.js application with Tailwind CSS
        </p>
        <div className="flex justify-center">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Deploy with Vercel
          </a>
        </div>
      </div>
    </main>
  )
} 