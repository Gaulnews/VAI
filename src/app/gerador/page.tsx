'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ExercicioGerado = {
  exercicio_id: number;
  nome: string;
  grupo_muscular: string;
  series: number;
  repeticoes: string;
  descanso: number;
  video_url?: string;
  gif_url?: string;
};

const GRUPOS_DISPONIVEIS = [
  'Peito', 'Costas', 'Ombro', 'Core', 'Bíceps', 'Tríceps',
  'Quadríceps', 'Isquiotibiais', 'Glúteo'
];

export default function GeradorPage() {
  const router = useRouter();
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [totalEx, setTotalEx] = useState(6);
  const [series, setSeries] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [descanso, setDescanso] = useState(60);
  const [nomeAluno, setNomeAluno] = useState('');
  const [nomeTreino, setNomeTreino] = useState('');
  const [exerciciosGerados, setExerciciosGerados] = useState<ExercicioGerado[]>([]);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar banco ao carregar
  useEffect(() => {
    fetch('/api/init').catch(() => {});
  }, []);

  function toggleGrupo(g: string) {
    setGruposSelecionados(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  async function gerar() {
    setGerando(true);
    setError(null);
    try {
      const res = await fetch('/api/gerador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupos_musculares: gruposSelecionados,
          total_exercicios: totalEx,
          series_padrao: series,
          repeticoes_padrao: reps,
          descanso_padrao: descanso,
        }),
      });
      const data = await res.json();
      if (data.exercicios) {
        setExerciciosGerados(data.exercicios);
        if (!nomeTreino) {
          const grupos = gruposSelecionados.length > 0 ? gruposSelecionados.join(' + ') : 'Full Body';
          setNomeTreino(`Treino ${grupos} - ${new Date().toLocaleDateString('pt-BR')}`);
        }
      } else {
        setError(data.error || 'Erro ao gerar treino');
      }
    } catch (e) {
      setError('Erro de conexão');
    }
    setGerando(false);
  }

  async function salvarESessao() {
    if (exerciciosGerados.length === 0) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/treino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeTreino || 'Treino sem nome',
          aluno: nomeAluno || undefined,
          exercicios: exerciciosGerados,
        }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/treino?id=${data.id}`);
      } else {
        setError(data.error || 'Erro ao salvar sessão');
      }
    } catch {
      setError('Erro ao salvar');
    }
    setSalvando(false);
  }

  function removerExercicio(idx: number) {
    setExerciciosGerados(prev => prev.filter((_, i) => i !== idx));
  }

  function moverExercicio(idx: number, dir: -1 | 1) {
    const novo = [...exerciciosGerados];
    const alvo = idx + dir;
    if (alvo < 0 || alvo >= novo.length) return;
    [novo[idx], novo[alvo]] = [novo[alvo], novo[idx]];
    setExerciciosGerados(novo);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">⚡ Gerador de Treinos</h1>
            <p className="text-gray-400 text-sm">Crie sessões personalizadas em segundos</p>
          </div>
          <a href="/exercicios-editor" className="text-sm text-blue-400 hover:text-blue-300">🎬 Editor de mídias</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de configuração */}
        <div className="space-y-5">
          {/* Grupos musculares */}
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Grupos Musculares</h2>
            <div className="flex flex-wrap gap-2">
              {GRUPOS_DISPONIVEIS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGrupo(g)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    gruposSelecionados.includes(g)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {gruposSelecionados.length === 0 ? 'Nenhum selecionado = Full Body aleatório' : `${gruposSelecionados.length} grupo(s) selecionado(s)`}
            </p>
          </div>

          {/* Parâmetros */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-white">Parâmetros</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nº de exercícios</label>
                <input
                  type="number" min={1} max={20} value={totalEx}
                  onChange={e => setTotalEx(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Séries</label>
                <input
                  type="number" min={1} max={6} value={series}
                  onChange={e => setSeries(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Repetições</label>
                <input
                  value={reps} onChange={e => setReps(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="ex: 8-12"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Descanso (s)</label>
                <input
                  type="number" min={10} max={300} value={descanso}
                  onChange={e => setDescanso(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dados da sessão */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Dados da Sessão</h2>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do treino</label>
              <input
                value={nomeTreino} onChange={e => setNomeTreino(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: Treino A - Peito/Costas"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do aluno (opcional)</label>
              <input
                value={nomeAluno} onChange={e => setNomeAluno(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Nome do aluno"
              />
            </div>
          </div>

          <button
            onClick={gerar}
            disabled={gerando}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl font-bold text-lg transition"
          >
            {gerando ? '⏳ Gerando...' : '⚡ Gerar Treino'}
          </button>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm">{error}</div>
          )}
        </div>

        {/* Lista de exercícios gerados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {exerciciosGerados.length > 0 ? `${exerciciosGerados.length} exercícios gerados` : 'Exercícios'}
            </h2>
            {exerciciosGerados.length > 0 && (
              <button
                onClick={salvarESessao}
                disabled={salvando}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-lg text-sm font-medium transition"
              >
                {salvando ? 'Salvando...' : '▶ Iniciar Treino'}
              </button>
            )}
          </div>

          {exerciciosGerados.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-gray-500">Configure e clique em "Gerar Treino"</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {exerciciosGerados.map((ex, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Preview miniatura */}
                    <div className="w-20 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      {ex.video_url && !ex.video_url.startsWith('/api/') ? (
                        <video
                          src={ex.video_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : ex.gif_url && !ex.gif_url.startsWith('/api/') ? (
                        <img src={ex.gif_url} alt={ex.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏋️</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">{ex.grupo_muscular}</div>
                      <div className="text-sm font-medium text-white truncate">{ex.nome}</div>
                      <div className="text-xs text-gray-400 mt-1">{ex.series}x{ex.repeticoes} · {ex.descanso}s descanso</div>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => moverExercicio(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-20">↑</button>
                      <button onClick={() => moverExercicio(i, 1)} disabled={i === exerciciosGerados.length - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-20">↓</button>
                      <button onClick={() => removerExercicio(i)} className="text-red-500 hover:text-red-400">×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {exerciciosGerados.length > 0 && (
            <button
              onClick={salvarESessao}
              disabled={salvando}
              className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-xl font-bold text-lg transition"
            >
              {salvando ? '⏳ Salvando...' : '▶ Iniciar Sessão de Treino'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
