import { createFileRoute } from '@tanstack/react-router'
import { searchEvents, type Event } from '~/utils/events'
import { StudyTimer } from '~/components/timer'

export const Route = createFileRoute('/_authed/timer')({
  loader: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch upcoming exams (next 90 days)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 90)

    const result = await searchEvents({
      data: {
        categories: ['exam'],
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
      },
    })

    return {
      exams: result.events || [],
    }
  },
  component: TimerPage,
})

function TimerPage() {
  const { exams } = Route.useLoaderData()

  const handleSessionCreated = (session: Event) => {
    // Could show a toast notification here
    console.log('Session created:', session)
  }

  return (
    <div className="timer-page">
      <div className="timer-page__container">
        <StudyTimer exams={exams} onSessionCreated={handleSessionCreated} />

        <div className="timer-page__tips">
          <h4 className="timer-page__tips-title">Focus Tips</h4>
          <ul className="timer-page__tips-list">
            <li>Put your phone on silent or in another room</li>
            <li>Close unnecessary browser tabs</li>
            <li>Have water nearby to stay hydrated</li>
            <li>Take breaks to maintain productivity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
