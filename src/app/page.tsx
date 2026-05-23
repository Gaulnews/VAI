import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-6 py-12 text-center">
        <div className="text-6xl mb-6">💪</div>
        <h1 className="text-3xl font-bold text-white mb-2">GS Fitness</h1>
        <p className="text-gray-400 mb-8">Painel do Treinador</p>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/gerador" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 px-6 font-medium transition flex items-center justify-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <div className="font-bold">Gerador de Treinos</div>
              <div className="text-sm text-blue-200">Crie sessões personalizadas</div>
            </div>
          </Link>
          <Link href="/exercicios-editor" className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl py-4 px-6 font-medium transition flex items-center justify-center gap-3">
            <span className="text-2xl">🎬</span>
            <div className="text-left">
              <div className="font-bold">Editor de Exercícios</div>
              <div className="text-sm text-gray-400">Gerenciar mídias e nomes</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
