import AudioCompare from '@/components/AudioCompare';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-4">
          Compare Audio
        </h1>
        <p className="text-lg text-gray-700 text-center mb-6">
          Click on the buttons below to switch between different audio versions
        </p>
        
        <AudioCompare />
      </div>
    </main>
  )
} 