// Event category configuration with colors and icons

export type EventCategory =
  | 'clinical'
  | 'lecture'
  | 'study'
  | 'task'
  | 'homework'
  | 'exam'
  | 'meeting'
  | 'personal'
  | 'deadline'

export interface CategoryConfig {
  label: string
  shortLabel: string
  // Tailwind classes
  bgColor: string
  bgColorLight: string
  borderColor: string
  textColor: string
  icon: string // Emoji for now, can replace with icon library later
}

export const CATEGORIES: Record<EventCategory, CategoryConfig> = {
  clinical: {
    label: 'Clinical Placement',
    shortLabel: 'Clinical',
    bgColor: 'bg-green-500',
    bgColorLight: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-l-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    icon: '🏥',
  },
  lecture: {
    label: 'Lecture',
    shortLabel: 'Lecture',
    bgColor: 'bg-blue-500',
    bgColorLight: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-l-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: '📚',
  },
  study: {
    label: 'Study Session',
    shortLabel: 'Study',
    bgColor: 'bg-purple-500',
    bgColorLight: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-l-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: '📖',
  },
  task: {
    label: 'Task',
    shortLabel: 'Task',
    bgColor: 'bg-gray-500',
    bgColorLight: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-l-gray-500',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: '✓',
  },
  homework: {
    label: 'Homework & Assignment',
    shortLabel: 'Homework',
    bgColor: 'bg-amber-500',
    bgColorLight: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: '📝',
  },
  exam: {
    label: 'Exam',
    shortLabel: 'Exam',
    bgColor: 'bg-red-500',
    bgColorLight: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    icon: '📋',
  },
  meeting: {
    label: 'Meeting',
    shortLabel: 'Meeting',
    bgColor: 'bg-cyan-500',
    bgColorLight: 'bg-cyan-50 dark:bg-cyan-950',
    borderColor: 'border-l-cyan-500',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    icon: '👥',
  },
  personal: {
    label: 'Personal',
    shortLabel: 'Personal',
    bgColor: 'bg-pink-500',
    bgColorLight: 'bg-pink-50 dark:bg-pink-950',
    borderColor: 'border-l-pink-500',
    textColor: 'text-pink-700 dark:text-pink-300',
    icon: '🏠',
  },
  deadline: {
    label: 'Deadline',
    shortLabel: 'Deadline',
    bgColor: 'bg-rose-700',
    bgColorLight: 'bg-rose-50 dark:bg-rose-950',
    borderColor: 'border-l-rose-700',
    textColor: 'text-rose-700 dark:text-rose-300',
    icon: '⏰',
  },
}

export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORIES[category as EventCategory] || CATEGORIES.task
}

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, config]) => ({
  value: key as EventCategory,
  ...config,
}))
