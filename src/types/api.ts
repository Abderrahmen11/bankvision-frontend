export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
}

export interface ApiErrorResponse {
  success?: boolean
  message: string
  errors?: Record<string, string[]>
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  links?: PaginationLinks
  meta?: PaginationMeta
}
