import { Task, TaskFilters } from '../../../core/models/task.model'

/**
 * Returns true if the task's dueDate falls within the given date-range window.
 * Receives `now` as a parameter to keep the function pure.
 *
 * @param dueDate  ISO string, null, or undefined
 * @param range    One of the predefined range tokens, or null (no filter)
 * @param now      The current Date — injected to avoid impure `new Date()` calls
 */
export function isInDateRange(
  dueDate: string | null | undefined,
  range: TaskFilters['dueDateRange'],
  now: Date
): boolean {
  if (!dueDate || !range) return true

  const due = new Date(dueDate)

  // Normalise to start-of-day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  switch (range) {
    case 'today':
      return dueDay.getTime() === today.getTime()

    case 'this-week': {
      // Week starts on Monday (ISO)
      const dayOfWeek = today.getDay() // 0 = Sunday
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return dueDay >= monday && dueDay <= sunday
    }

    case 'this-month':
      return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth()

    case 'overdue':
      // A task is overdue when its due date is strictly before today
      return dueDay < today

    default:
      return true
  }
}

/**
 * Filters a list of tasks by search text, priorities, and due-date range.
 * Returns filtered tasks with completed ones pushed to the bottom.
 *
 * @param tasks   The full task list
 * @param filters Active filters (search, priorities, dueDateRange)
 * @param now     Current Date for date-range calculations
 */
export function filterTasks(
  tasks: Task[],
  filters: { search: string; priorities: TaskFilters['priorities']; dueDateRange: TaskFilters['dueDateRange'] },
  now: Date
): Task[] {
  const query = filters.search.trim().toLowerCase()

  const filtered = tasks.filter((task) => {
    // 1. Text search
    if (query) {
      const inTitle = task.title.toLowerCase().includes(query)
      const inDescription = task.description?.toLowerCase().includes(query) ?? false
      if (!inTitle && !inDescription) return false
    }

    // 2. Priority filter (OR - any selected priority matches)
    if (filters.priorities.length > 0) {
      if (!task.priority) return false
      if (!filters.priorities.includes(task.priority)) return false
    }

    // 3. Due date range filter
    if (filters.dueDateRange !== null) {
      if (!task.dueDate) return false
      if (!isInDateRange(task.dueDate, filters.dueDateRange, now)) return false
    }

    return true
  })

  // 4. Completed tasks sink to the bottom
  const pending = filtered.filter((t) => !t.completed)
  const completed = filtered.filter((t) => t.completed)
  return [...pending, ...completed]
}
