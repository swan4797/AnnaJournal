import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import {
  fetchNotes,
  fetchNoteSubjects,
  createNote,
  updateNote,
  deleteNote,
  toggleNotePinned,
  type Note,
  type NewNote,
  type UpdateNote,
} from '~/utils/notes'
import { searchEvents, type Event } from '~/utils/events'
import {
  NoteCard,
  NoteSearch,
  NoteEditor,
  NoteDetail,
} from '~/components/notes'

export const Route = createFileRoute('/_authed/notes')({
  loader: async () => {
    const [notesResult, subjectsResult, examsResult] = await Promise.all([
      fetchNotes({ data: { limit: 50 } }),
      fetchNoteSubjects({}),
      searchEvents({
        data: {
          categories: ['exam'],
          startDate: new Date().toISOString(),
          limit: 20,
        },
      }),
    ])

    return {
      notes: notesResult.notes || [],
      subjects: subjectsResult.subjects || [],
      exams: examsResult.events || [],
    }
  },
  component: NotesPage,
})

function NotesPage() {
  const { notes: initialNotes, subjects: initialSubjects, exams } = Route.useLoaderData()

  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [subjects, setSubjects] = useState<string[]>(initialSubjects)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  // Refetch notes when filters change
  useEffect(() => {
    const fetchFiltered = async () => {
      const result = await fetchNotes({
        data: {
          search: searchQuery || undefined,
          subject: selectedSubject || undefined,
          limit: 50,
        },
      })
      setNotes(result.notes || [])
    }

    fetchFiltered()
  }, [searchQuery, selectedSubject])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleSubjectFilter = useCallback((subject: string | null) => {
    setSelectedSubject(subject)
  }, [])

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsCreating(false)
  }, [])

  const handleCreateNew = useCallback(() => {
    setSelectedNote(null)
    setIsCreating(true)
    setIsEditing(false)
  }, [])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setIsCreating(false)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedNote(null)
    setIsEditing(false)
    setIsCreating(false)
  }, [])

  const handleSave = useCallback(async (data: Omit<NewNote, 'user_id'> | { id: string; updates: UpdateNote }) => {
    if ('id' in data && 'updates' in data) {
      // Update existing note
      const result = await updateNote({ data })
      if (result.note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === result.note!.id ? result.note! : n))
        )
        setSelectedNote(result.note)
        setIsEditing(false)

        // Update subjects if new subject was added
        if (result.note.subject && !subjects.includes(result.note.subject)) {
          setSubjects((prev) => [...prev, result.note!.subject!])
        }
      }
    } else {
      // Create new note
      const result = await createNote({ data })
      if (result.note) {
        setNotes((prev) => [result.note!, ...prev])
        setSelectedNote(result.note)
        setIsCreating(false)

        // Update subjects if new subject was added
        if (result.note.subject && !subjects.includes(result.note.subject)) {
          setSubjects((prev) => [...prev, result.note!.subject!])
        }
      }
    }
  }, [subjects])

  const handleDelete = useCallback(async () => {
    if (!selectedNote) return

    const result = await deleteNote({ data: { id: selectedNote.id } })
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id))
      setSelectedNote(null)
    }
  }, [selectedNote])

  const handleTogglePin = useCallback(async () => {
    if (!selectedNote) return

    const newPinned = !selectedNote.pinned
    const result = await toggleNotePinned({
      data: { id: selectedNote.id, pinned: newPinned },
    })

    if (result.success) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id ? { ...n, pinned: newPinned } : n
        ).sort((a, b) => {
          if (a.pinned === b.pinned) {
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
          }
          return a.pinned ? -1 : 1
        })
      )
      setSelectedNote((prev) => prev ? { ...prev, pinned: newPinned } : null)
    }
  }, [selectedNote])

  const handlePinFromList = useCallback(async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return

    const newPinned = !note.pinned
    const result = await toggleNotePinned({
      data: { id: noteId, pinned: newPinned },
    })

    if (result.success) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, pinned: newPinned } : n
        ).sort((a, b) => {
          if (a.pinned === b.pinned) {
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
          }
          return a.pinned ? -1 : 1
        })
      )

      if (selectedNote?.id === noteId) {
        setSelectedNote((prev) => prev ? { ...prev, pinned: newPinned } : null)
      }
    }
  }, [notes, selectedNote])

  return (
    <div className="notes-page">
      {/* Sidebar */}
      <div className="notes-page__sidebar">
        <div className="notes-page__sidebar-header">
          <h1 className="notes-page__title">Notes</h1>
          <button
            className="notes-page__add-btn"
            onClick={handleCreateNew}
            title="New Note"
          >
            <PlusIcon />
          </button>
        </div>

        <NoteSearch
          onSearch={handleSearch}
          onSubjectFilter={handleSubjectFilter}
          subjects={subjects}
          selectedSubject={selectedSubject}
        />

        <div className="notes-page__list">
          {notes.length === 0 ? (
            <div className="notes-page__empty">
              <EmptyIcon />
              <p>No notes yet</p>
              <button onClick={handleCreateNew}>Create your first note</button>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNote?.id === note.id}
                onClick={() => handleNoteClick(note)}
                onPin={() => handlePinFromList(note.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="notes-page__content">
        {isCreating ? (
          <NoteEditor
            onSave={handleSave}
            onCancel={handleCancel}
            exams={exams}
          />
        ) : isEditing && selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSave}
            onCancel={handleCancel}
            exams={exams}
          />
        ) : selectedNote ? (
          <NoteDetail
            note={selectedNote}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={handleClose}
            onTogglePin={handleTogglePin}
          />
        ) : (
          <div className="notes-page__placeholder">
            <NotesIcon />
            <p>Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Icon Components
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
