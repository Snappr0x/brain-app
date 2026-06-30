'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tag {
  id: number
  label: string
}

interface NoteLink {
  id: number
  fromId: number
  toId: number
  from?: Note
  to?: Note
}

interface Note {
  id: number
  title: string
  content: string
  tags: Tag[]
  linksFrom: NoteLink[]
  linksTo: NoteLink[]
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
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null)
  const [linkingFromId, setLinkingFromId] = useState<number | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(true)

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

  const handleAddLink = async (fromId: number, toId: number) => {
    await fetch(`/api/notes/${fromId}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId }),
    })
    setLinkingFromId(null)
    fetchNotes()
  }

  const handleRemoveLink = async (fromId: number, toId: number) => {
    await fetch(`/api/notes/${fromId}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId }),
    })
    fetchNotes()
  }

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId: number) => {
    await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    })
    setEditingNoteId(null)
    fetchNotes()
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditTitle('')
    setEditContent('')
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

  const getLinkedNotes = (note: Note) => {
    const linked = new Set<number>()
    note.linksFrom.forEach((link) => linked.add(link.toId))
    note.linksTo.forEach((link) => linked.add(link.fromId))
    return Array.from(linked)
  }

  return (
    <div style={{ backgroundColor: '#0B162C' }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">Brain App</h1>
            <p style={{ color: '#3B556D' }} className="text-sm">Digital second brain</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ 
                backgroundColor: '#1C2942',
                borderColor: '#3B556D',
                color: '#5FC2BA'
              }}
              className="px-4 py-2 rounded-lg border text-lg hover:opacity-80 transition"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <Link 
              href="/graph"
              style={{ backgroundColor: '#5FC2BA' }}
              className="px-6 py-2 rounded-lg text-black font-medium hover:opacity-90 transition"
            >
              Graphe
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Tags */}
          <div className="lg:col-span-1">
            <div style={{ backgroundColor: '#1C2942', borderColor: '#3B556D' }} className="p-6 rounded-xl border sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6">Tags</h2>
              
              <form onSubmit={handleCreateTag} className="mb-6">
                <input
                  type="text"
                  placeholder="Nouveau tag"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }}
                  className="w-full mb-3 p-3 rounded-lg border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-400 transition"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: '#5FC2BA' }}
                  className="w-full text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition text-sm"
                >
                  Ajouter
                </button>
              </form>

              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }} className="flex justify-between items-center p-3 rounded-lg border group">
                    <span className="text-white text-sm">{tag.label}</span>
                    <button
                      onClick={() => fetchTags()}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Search */}
            <div className="mb-8">
              <input
                type="text"
                placeholder="Rechercher notes..."
                value={searchQuery}
                onChange={handleSearch}
                style={{ backgroundColor: '#1C2942', borderColor: '#3B556D' }}
                className="w-full p-4 rounded-xl border text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition"
              />
            </div>

            {/* Create Form */}
            <form onSubmit={handleCreate} style={{ backgroundColor: '#1C2942', borderColor: '#3B556D' }} className="mb-8 p-8 rounded-xl border">
              <input
                type="text"
                placeholder="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }}
                className="w-full mb-4 p-4 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition"
              />
              <textarea
                placeholder="Contenu"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }}
                className="w-full mb-4 p-4 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition h-32"
              />
              
              <div className="mb-6">
                <label className="text-white text-sm mb-3 block font-medium">Tags</label>
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
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? '#5FC2BA' : '#0B162C',
                        borderColor: '#3B556D',
                        color: selectedTags.includes(tag.id) ? '#000' : '#5FC2BA'
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium border transition"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#5FC2BA' }}
                className="text-black px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer note'}
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} style={{ backgroundColor: '#1C2942', borderColor: '#3B556D' }} className="p-6 rounded-xl border">
                  {editingNoteId === note.id ? (
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }}
                        className="w-full mb-4 p-4 rounded-lg border text-white text-xl font-bold focus:outline-none focus:border-teal-400 transition"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }}
                        className="w-full mb-4 p-4 rounded-lg border text-white focus:outline-none focus:border-teal-400 transition h-32"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          style={{ backgroundColor: '#5FC2BA' }}
                          className="text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{ backgroundColor: '#0B162C', borderColor: '#3B556D', color: '#FFFFFF' }}
                          className="px-4 py-2 rounded-lg border font-medium hover:opacity-80 transition"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-white flex-1">{note.title}</h2>
                        <button
                          onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                          style={{ color: '#5FC2BA' }}
                          className="text-lg hover:opacity-80 transition"
                        >
                          {expandedNoteId === note.id ? '▼' : '▶'}
                        </button>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{note.content}</p>
                      
                      {/* Tags */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {note.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleRemoveTagFromNote(note.id, tag.id)}
                            style={{ backgroundColor: '#5FC2BA' }}
                            className="text-black px-3 py-1 rounded-lg text-sm hover:opacity-80 transition"
                          >
                            {tag.label} ✕
                          </button>
                        ))}
                      </div>

                      {/* Add tags */}
                      {tags.length > note.tags.length && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {tags
                              .filter((tag) => !note.tags.find((t) => t.id === tag.id))
                              .map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => handleAddTagToNote(note.id, tag.id)}
                                  style={{ backgroundColor: '#0B162C', borderColor: '#3B556D', color: '#5FC2BA' }}
                                  className="px-2 py-1 rounded-lg text-xs border hover:opacity-80 transition"
                                >
                                  + {tag.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Links */}
                      {expandedNoteId === note.id && (
                        <div style={{ borderColor: '#3B556D' }} className="mt-6 pt-6 border-t">
                          <h3 className="text-white font-bold mb-4">Liens</h3>
                          
                          {getLinkedNotes(note).length > 0 && (
                            <div className="mb-4">
                              <p style={{ color: '#3B556D' }} className="text-sm mb-3">Connecté à :</p>
                              <div className="space-y-2">
                                {getLinkedNotes(note).map((linkedId) => {
                                  const linkedNote = notes.find((n) => n.id === linkedId)
                                  return (
                                    <div key={linkedId} style={{ backgroundColor: '#0B162C', borderColor: '#3B556D' }} className="flex justify-between items-center p-3 rounded-lg border">
                                      <button
                                        onClick={() => setExpandedNoteId(linkedId)}
                                        style={{ color: '#5FC2BA' }}
                                        className="text-left hover:opacity-80 transition"
                                      >
                                        {linkedNote?.title}
                                      </button>
                                      <button
                                        onClick={() => handleRemoveLink(note.id, linkedId)}
                                        className="text-gray-500 hover:text-red-400 transition"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {linkingFromId === note.id ? (
                            <div>
                              <p style={{ color: '#3B556D' }} className="text-sm mb-3">Lier vers :</p>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {notes
                                  .filter((n) => n.id !== note.id && !getLinkedNotes(note).includes(n.id))
                                  .map((targetNote) => (
                                    <button
                                      key={targetNote.id}
                                      onClick={() => handleAddLink(note.id, targetNote.id)}
                                      style={{ backgroundColor: '#0B162C', borderColor: '#3B556D', color: '#5FC2BA' }}
                                      className="w-full text-left p-3 rounded-lg border text-sm hover:opacity-80 transition"
                                    >
                                      {targetNote.title}
                                    </button>
                                  ))}
                              </div>
                              <button
                                onClick={() => setLinkingFromId(null)}
                                style={{ color: '#3B556D' }}
                                className="mt-3 text-xs hover:text-gray-400 transition"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setLinkingFromId(note.id)}
                              style={{ backgroundColor: '#0B162C', borderColor: '#3B556D', color: '#5FC2BA' }}
                              className="px-3 py-2 rounded-lg border text-sm hover:opacity-80 transition"
                            >
                              + Ajouter lien
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ borderColor: '#3B556D', color: '#3B556D' }} className="flex justify-between items-center text-sm mt-6 pt-6 border-t">
                        <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                        <div className="space-x-4">
                          <button
                            onClick={() => handleEditNote(note)}
                            style={{ color: '#5FC2BA' }}
                            className="hover:opacity-80 transition"
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-500 hover:text-red-400 transition"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {notes.length === 0 && (
              <div style={{ color: '#3B556D' }} className="text-center mt-12">
                Aucune note. Crée la première !
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}