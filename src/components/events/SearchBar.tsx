import { useState, useEffect, useRef, useCallback } from 'react'
import { searchEvents, type Event } from '~/utils/events'
import { CATEGORY_LIST, type EventCategory } from '~/utils/categories'
import { formatTime } from '~/utils/calendar'

interface SearchBarProps {
  onEventSelect: (event: Event) => void
  onCategoryFilterChange?: (categories: EventCategory[]) => void
  selectedCategories?: EventCategory[]
}

export function SearchBar({
  onEventSelect,
  onCategoryFilterChange,
  selectedCategories = [],
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string, categories: EventCategory[]) => {
    if (!searchQuery.trim() && categories.length === 0) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const result = await searchEvents({
        data: {
          query: searchQuery || undefined,
          categories: categories.length > 0 ? categories : undefined,
          limit: 20,
        },
      })
      setResults(result.events)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, selectedCategories)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, selectedCategories, performSearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategoryToggle = (category: EventCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    onCategoryFilterChange?.(newCategories)
  }

  const handleEventClick = (event: Event) => {
    onEventSelect(event)
    setShowResults(false)
    setQuery('')
  }

  const clearFilters = () => {
    onCategoryFilterChange?.([])
    setQuery('')
  }

  const hasActiveFilters = query.trim() || selectedCategories.length > 0

  return (
    <div ref={containerRef} className="search-bar">
      <div className="search-bar__container">
        <div className="search-bar__input-wrapper">
          <svg className="search-bar__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search events..."
            className="search-bar__input"
          />
          {loading && <span className="spinner spinner--sm" />}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`search-bar__filter-btn ${showFilters || selectedCategories.length > 0 ? 'search-bar__filter-btn--active' : ''}`}
          title="Filter by category"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="search-bar__dropdown">
          <div className="calendar-header__filter-pills">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryToggle(cat.value)}
                className={`calendar-header__pill calendar-header__pill--${cat.value} ${selectedCategories.includes(cat.value) ? 'calendar-header__pill--active' : ''}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && (query.trim() || selectedCategories.length > 0) && (
        <div className="search-bar__dropdown">
          {results.length === 0 ? (
            <div className="day-agenda__empty">
              {loading ? 'Searching...' : 'No events found'}
            </div>
          ) : (
            <>
              <div className="mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              {results.map((event) => {
                const cat = CATEGORY_LIST.find(c => c.value === event.category)
                return (
                  <button key={event.id} onClick={() => handleEventClick(event)} className="search-bar__result-item">
                    <span>{cat?.icon || '📅'}</span>
                    <div>
                      <div className={`event-card__title ${event.completed ? 'event-card--completed' : ''}`}>
                        {event.title}
                      </div>
                      <div className="event-card__time">
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {!event.all_day && ` at ${formatTime(event.start_time)}`}
                      </div>
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
