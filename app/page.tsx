'use client'

import { useEffect, useState } from 'react'

interface Tag {
  id: number
  label: string
}

interface Note {
  id: number
  title: string
  content: string
  tags: Tag[]
  createdAt: string
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagLabel, setNewTagLabel] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)

  useEffect(() => {
    fetchNotes()
    fetchTags()
  }, [])

  const fetchNotes = async () => {
    const res = await fetch('/api/notes')
    const data = await res.json()
    setNotes(data)
  }

  const fetchTags = async () => {
    const res = await fetch('/api/tags')
    const data = await res.json()
    setTags(data)
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

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagLabel.trim()) return

    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTagLabel }),
    })
    setNewTagLabel('')
    fetchTags()
  }

  const handleAddTagToNote = async (noteId: number, tagId: number) => {
    await fetch(`/api/notes/${noteId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    fetchNotes()
  }

  const handleRemoveTagFromNote = async (noteId: number, tagId: number) => {
    await fetch(`/api/notes/${noteId}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    fetchNotes()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    const newNote = await res.json()

    // Add selected tags to note
    for (const tagId of selectedTags) {
      await handleAddTagToNote(newNote.id, tagId)
    }

    setTitle('')
    setContent('')
    setSelectedTags([])
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Brain App</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar tags */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 p-6 rounded-lg sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
              
              <form onSubmit={handleCreateTag} className="mb-4">
                <input
                  type="text"
                  placeholder="Nouveau tag..."
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  className="w-full mb-2 p-2 bg-slate-600 text-white text-sm rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  Ajouter
                </button>
              </form>

              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex justify-between items-center bg-slate-600 p-2 rounded">
                    <span className="text-white text-sm">{tag.label}</span>
                    <button
                      onClick={() => fetchTags()}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
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
              
              <div className="mb-4">
                <label className="text-white text-sm mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags(
                          selectedTags.includes(tag.id)
                            ? selectedTags.filter((id) => id !== tag.id)
                            : [...selectedTags, tag.id]
                        )
                      }
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

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
                  
                  {/* Tags sur la note */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleRemoveTagFromNote(note.id, tag.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {tag.label} ×
                      </button>
                    ))}
                  </div>

                  {/* Ajouter tags disponibles */}
                  {tags.length > note.tags.length && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {tags
                          .filter((tag) => !note.tags.find((t) => t.id === tag.id))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTagToNote(note.id, tag.id)}
                              className="bg-slate-600 hover:bg-slate-500 text-slate-300 px-2 py-1 rounded text-xs"
                            >
                              + {tag.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

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
      </div>
    </div>
  )
}