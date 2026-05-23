'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type ExercicioSessao = {
  exercicio_id: number;
  nome: string;
  grupo_muscular: string;
  series: number;
  repeticoes: string;
  carga?: number;
  descanso?: number;
  video_url?: string;
  gif_url?: string;
  observacao?: string;
};

type Sessao = {
  id: string;
  nome: string;
  aluno?: string;
  data_treino: string;
  exercicios: ExercicioSessao[];
  observacoes?: string;
};

function VideoPlayer({ videoUrl, gifUrl, nome }: { videoUrl?: string; gifUrl?: string; nome: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'video' | 'gif' | 'none'>('video');
  const [videoError, setVideoError] = useState(false);

  const hasVideo = !!videoUrl;
  const hasGif = !!gifUrl;

  function handleVideoError() {
    setVideoError(true);
    if (hasGif) setMode('gif');
    else setMode('none');
  }

  if (!hasVideo && !hasGif) {
    return (
      <div className="w-full aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🏋️</div>
          <p className="text-gray-500 text-sm">{nome}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {mode === 'video' && !videoError && hasVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          controls
          autoPlay={false}
          loop
          playsInline
          onError={handleVideoError}
        />
      )}

      {(mode === 'gif' || (videoError && hasGif)) && (
        <img
          src={gifUrl}
          alt={nome}
          className="w-full h-full object-cover"
          onError={() => setMode('none')}
        />
      )}

      {mode === 'none' && (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="text-4xl mb-2">🏋️</div>
            <p className="text-gray-400 text-sm">Mídia não disponível</p>
            <p className="text-gray-600 text-xs mt-1">Configure em /exercicios-editor</p>
          </div>
        </div>
      )}

      {/* Toggle video/gif */}
      {hasVideo && hasGif && !videoError && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setMode('video')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              mode === 'video' ? 'bg-blue-600 text-white' : 'bg-black/50 text-gray-300'
            }`}
          >MP4</button>
          <button
            onClick={() => setMode('gif')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              mode === 'gif' ? 'bg-blue-600 text-white' : 'bg-black/50 text-gray-300'
            }`}
          >GIF</button>
        </div>
      )}
    </div>
  );
}

function TreinoContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exAtual, setExAtual] = useState(0);
  const [serieAtual, setSerieAtual] = useState(1);
  const [cronometro, setCronometro] = useState(0);
  const [cronAtivo, setCronAtivo] = useState(false);
  const cronRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) { setError('ID da sessão não informado'); setLoading(false); return; }
    fetch(`/api/treino?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.sessao) setSessao(data.sessao);
        else setError(data.error || 'Sessão não encontrada');
        setLoading(false);
      })
      .catch(() => { setError('Erro ao carregar sessão'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (cronAtivo) {
      cronRef.current = setInterval(() => setCronometro(prev => prev + 1), 1000);
    } else {
      if (cronRef.current) clearInterval(cronRef.current);
    }
    return () => { if (cronRef.current) clearInterval(cronRef.current); };
  }, [cronAtivo]);

  function formatCron(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400 mt-4">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (error || !sessao) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-red-400 text-lg">{error || 'Sessão não encontrada'}</p>
          <a href="/gerador" className="mt-4 inline-block text-blue-400 hover:text-blue-300">← Criar novo treino</a>
        </div>
      </div>
    );
  }

  const exercicios = Array.isArray(sessao.exercicios) ? sessao.exercicios : [];
  const ex = exercicios[exAtual];
  const totalEx = exercicios.length;
  const progresso = totalEx > 0 ? Math.round(((exAtual) / totalEx) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{sessao.nome}</h1>
            {sessao.aluno && <p className="text-gray-400 text-sm">{sessao.aluno}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* Cronômetro */}
            <div className="text-center">
              <div className={`text-xl font-mono font-bold ${cronAtivo ? 'text-green-400' : 'text-gray-400'}`}>
                {formatCron(cronometro)}
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setCronAtivo(!cronAtivo)}
                  className="text-xs px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition"
                >{cronAtivo ? '⏸' : '▶'}</button>
                <button
                  onClick={() => { setCronAtivo(false); setCronometro(0); }}
                  className="text-xs px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition"
                >↺</button>
              </div>
            </div>
          </div>
        </div>
        {/* Barra de progresso */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Exercício {exAtual + 1} de {totalEx}</span>
            <span>{progresso}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {ex ? (
          <div className="space-y-4">
            {/* Vídeo/GIF */}
            <VideoPlayer
              videoUrl={ex.video_url}
              gifUrl={ex.gif_url}
              nome={ex.nome}
            />

            {/* Info do exercício */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{ex.grupo_muscular}</div>
              <h2 className="text-xl font-bold text-white">{ex.nome}</h2>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{ex.series}</div>
                  <div className="text-xs text-gray-400">Séries</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{ex.repeticoes}</div>
                  <div className="text-xs text-gray-400">Repetições</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{ex.descanso || 60}s</div>
                  <div className="text-xs text-gray-400">Descanso</div>
                </div>
              </div>
              {ex.carga && (
                <div className="mt-3 text-center">
                  <span className="bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    💪 Carga: {ex.carga} kg
                  </span>
                </div>
              )}
              {ex.observacao && (
                <p className="mt-3 text-sm text-gray-400 bg-gray-800 rounded-lg p-3">📋 {ex.observacao}</p>
              )}
            </div>

            {/* Controle de séries */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-3">Série atual</div>
              <div className="flex gap-2">
                {Array.from({ length: ex.series }, (_, i) => i + 1).map(s => (
                  <button
                    key={s}
                    onClick={() => setSerieAtual(s)}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${
                      s < serieAtual
                        ? 'bg-green-700 text-white'
                        : s === serieAtual
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {s < serieAtual ? '✓' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegação */}
            <div className="flex gap-3">
              <button
                onClick={() => { setExAtual(prev => Math.max(0, prev - 1)); setSerieAtual(1); }}
                disabled={exAtual === 0}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
              >← Anterior</button>

              {exAtual < totalEx - 1 ? (
                <button
                  onClick={() => { setExAtual(prev => prev + 1); setSerieAtual(1); }}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-medium"
                >Próximo →</button>
              ) : (
                <button
                  onClick={() => { setCronAtivo(false); alert(`🎉 Treino "${sessao.nome}" concluído em ${formatCron(cronometro)}!`); }}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-bold"
                >✅ Concluir</button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-xl font-bold text-white">Treino concluído!</p>
            <a href="/gerador" className="mt-4 inline-block text-blue-400">Criar novo treino →</a>
          </div>
        )}

        {/* Lista lateral exercícios */}
        {totalEx > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Todos os exercícios</h3>
            <div className="space-y-2">
              {exercicios.map((e, i) => (
                <button
                  key={i}
                  onClick={() => { setExAtual(i); setSerieAtual(1); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                    i === exAtual
                      ? 'bg-blue-900/40 border border-blue-700/50'
                      : i < exAtual
                      ? 'bg-green-900/20 border border-green-800/30'
                      : 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{i < exAtual ? '✅' : i === exAtual ? '▶️' : `${i + 1}`}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{e.nome}</div>
                    <div className="text-xs text-gray-500">{e.series}x{e.repeticoes} · {e.grupo_muscular}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TreinoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    }>
      <TreinoContent />
    </Suspense>
  );
}
