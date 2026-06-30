'use client'

import { useEffect, useState } from 'react'

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    const res = await fetch('/api/notes')
    const data = await res.json()
    setNotes(data)
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!query.trim()) {
      fetchNotes()
      return
    }

    const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setNotes(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    setTitle('')
    setContent('')
    setSearchQuery('')
    fetchNotes()
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (searchQuery.trim()) {
      handleSearch({ target: { value: searchQuery } } as any)
    } else {
      fetchNotes()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Brain App</h1>

        {/* Recherche */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher notes..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-3 bg-slate-700 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Formulaire création */}
        <form onSubmit={handleCreate} className="mb-8 bg-slate-700 p-6 rounded-lg">
          <input
            type="text"
            placeholder="Titre..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-4 p-3 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Contenu..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full mb-4 p-3 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 h-32"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer note'}
          </button>
        </form>

        {/* Liste notes */}
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-slate-700 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-2">{note.title}</h2>
              <p className="text-slate-300 mb-4">{note.content}</p>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            Aucune note. Crée la première !
          </div>
        )}
      </div>
    </div>
  )
}