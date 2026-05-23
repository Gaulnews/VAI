'use client';
import { useState, useEffect } from 'react';

type Exercicio = {
  id: number;
  nome: string;
  nome_personalizado: string;
  grupo_muscular: string;
  video_url: string;
  gif_url: string;
  slug: string;
};

type MediaStatus = 'loading' | 'ok' | 'missing';

export default function ExerciciosEditorPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editando, setEditando] = useState<Record<number, Exercicio>>({});
  const [mediaStatus, setMediaStatus] = useState<Record<string, MediaStatus>>({});
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [iniciado, setIniciado] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/init');
      const data = await res.json();
      if (data.ok) setIniciado(true);
      await loadExercicios();
    }
    init();
  }, []);

  async function loadExercicios() {
    setLoading(true);
    const res = await fetch('/api/exercicios');
    const data = await res.json();
    setExercicios(data.exercicios || []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function salvar(ex: Exercicio) {
    setSaving(ex.id);
    const editado = editando[ex.id] || ex;
    const res = await fetch('/api/exercicios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: ex.id,
        nome_personalizado: editado.nome_personalizado,
        video_url: editado.video_url,
        gif_url: editado.gif_url,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      showToast(`✅ "${editado.nome_personalizado}" salvo com sucesso!`);
      await loadExercicios();
      const novo = { ...editando };
      delete novo[ex.id];
      setEditando(novo);
    }
    setSaving(null);
  }

  function update(id: number, field: keyof Exercicio, value: string) {
    setEditando(prev => ({
      ...prev,
      [id]: { ...(prev[id] || exercicios.find(e => e.id === id)!), [field]: value },
    }));
  }

  async function testarMidia(slug: string) {
    setMediaStatus(prev => ({ ...prev, [slug]: 'loading' }));
    try {
      const res = await fetch(`/api/media/video/${slug}.mp4`, { method: 'HEAD' });
      setMediaStatus(prev => ({ ...prev, [slug]: res.ok ? 'ok' : 'missing' }));
    } catch {
      setMediaStatus(prev => ({ ...prev, [slug]: 'missing' }));
    }
  }

  const grupos = ['Todos', ...Array.from(new Set(exercicios.map(e => e.grupo_muscular))).sort()];
  const filtrados = filtroGrupo === 'Todos' ? exercicios : exercicios.filter(e => e.grupo_muscular === filtroGrupo);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎬 Editor de Exercícios</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie nomes personalizados e URLs de mídia</p>
        </div>
        <div className="flex items-center gap-3">
          {iniciado && <span className="text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full">✓ Banco ativo</span>}
          <a href="/gerador" className="text-sm text-blue-400 hover:text-blue-300 transition">→ Gerador</a>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Filtros */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm">Grupo:</span>
          {grupos.map(g => (
            <button
              key={g}
              onClick={() => setFiltroGrupo(g)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filtroGrupo === g
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            <span className="ml-3 text-gray-400">Carregando exercícios...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(ex => {
              const ed = editando[ex.id] || ex;
              const status = mediaStatus[ex.slug];
              const alterado = editando[ex.id] !== undefined;

              return (
                <div
                  key={ex.id}
                  className={`bg-gray-900 border rounded-xl p-4 transition ${
                    alterado ? 'border-blue-600/50' : 'border-gray-800'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Info */}
                    <div className="md:col-span-3">
                      <div className="text-xs text-gray-500 mb-1">{ex.grupo_muscular}</div>
                      <div className="text-sm font-medium text-gray-200">{ex.nome}</div>
                      <div className="text-xs text-gray-500 mt-1">slug: {ex.slug}</div>
                    </div>

                    {/* Nome personalizado */}
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-400 mb-1 block">Nome personalizado</label>
                      <input
                        value={ed.nome_personalizado || ''}
                        onChange={e => update(ex.id, 'nome_personalizado', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="Nome exibido ao aluno"
                      />
                    </div>

                    {/* Video URL */}
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-400 mb-1 block">URL Vídeo MP4 / Drive ID</label>
                      <input
                        value={ed.video_url || ''}
                        onChange={e => update(ex.id, 'video_url', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                        placeholder="https://... ou ID do Google Drive"
                      />
                    </div>

                    {/* Ações */}
                    <div className="md:col-span-3 flex items-center gap-2">
                      {/* Status mídia */}
                      <button
                        onClick={() => testarMidia(ex.slug)}
                        title="Testar mídia"
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-lg"
                      >
                        {status === 'loading' ? '⏳' : status === 'ok' ? '✅' : status === 'missing' ? '❌' : '🔍'}
                      </button>

                      {/* Preview */}
                      {ex.video_url && !ex.video_url.startsWith('/api/') && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-lg"
                          title="Abrir vídeo"
                        >▶️</a>
                      )}

                      {/* Salvar */}
                      <button
                        onClick={() => salvar(ex)}
                        disabled={saving === ex.id || !alterado}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                          alterado
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {saving === ex.id ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
