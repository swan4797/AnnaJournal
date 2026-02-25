import { useState, useEffect } from 'react'

interface NoteSearchProps {
  onSearch: (query: string) => void
  onSubjectFilter: (subject: string | null) => void
  subjects: string[]
  selectedSubject: string | null
}

export function NoteSearch({ onSearch, onSubjectFilter, subjects, selectedSubject }: NoteSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  return (
    <div className="note-search">
      <div className="note-search__input-wrapper">
        <SearchIcon />
        <input
          type="text"
          className="note-search__input"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="note-search__clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {subjects.length > 0 && (
        <div className="note-search__filters">
          <button
            className={`note-search__filter ${!selectedSubject ? 'note-search__filter--active' : ''}`}
            onClick={() => onSubjectFilter(null)}
          >
            All
          </button>
          {subjects.map((subject) => (
            <button
              key={subject}
              className={`note-search__filter ${selectedSubject === subject ? 'note-search__filter--active' : ''}`}
              onClick={() => onSubjectFilter(subject)}
            >
              {subject}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
