export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  completed?: boolean
}

export interface TaskListResponse {
  success: boolean
  data: {
    items: Task[]
    nextCursor: string | null
  }
}

export interface TaskResponse {
  success: boolean
  data: Task
}

export interface DeleteCompletedResponse {
  success: boolean
  data: { deletedCount: number }
}

export interface TaskFilters {
  priorities: ('low' | 'medium' | 'high')[]
  dueDateRange: DueDateRange | null
}

export type DueDateRange = 'today' | 'this-week' | 'this-month' | 'overdue'

/** Valor por defecto de filtros sin ninguna selección activa */
export const EMPTY_TASK_FILTERS: TaskFilters = {
  priorities: [],
  dueDateRange: null
}
