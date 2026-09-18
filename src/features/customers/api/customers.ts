import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type {
  Customer,
  CustomerAccount,
  CustomerLoan,
  CustomerTransaction,
  CustomerListParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  KycDocument,
} from '@/features/customers/types'

export const customersApi = {
  list: async (params?: CustomerListParams): Promise<PaginatedResponse<Customer>> => {
    const res = await apiClient.get<{ data: Customer[]; links: unknown; meta: unknown }>(
      '/customers',
      { params }
    )
    return res.data as PaginatedResponse<Customer>
  },

  get: async (id: number | string): Promise<Customer> => {
    const res = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`)
    return res.data.data
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const res = await apiClient.post<ApiResponse<Customer>>('/customers', payload)
    return res.data.data
  },

  update: async (id: number | string, payload: UpdateCustomerPayload): Promise<Customer> => {
    const res = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, payload)
    return res.data.data
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`)
  },

  accounts: async (id: number | string): Promise<CustomerAccount[]> => {
    const res = await apiClient.get<{ data: CustomerAccount[] }>(`/customers/${id}/accounts`)
    return res.data.data
  },

  loans: async (id: number | string): Promise<CustomerLoan[]> => {
    const res = await apiClient.get<{ data: CustomerLoan[] }>(`/customers/${id}/loans`)
    return res.data.data
  },

  transactions: async (id: number | string): Promise<CustomerTransaction[]> => {
    const res = await apiClient.get<{ data: CustomerTransaction[] }>(`/customers/${id}/transactions`)
    return res.data.data
  },

  listKycDocuments: async (customerId: number | string): Promise<KycDocument[]> => {
    const res = await apiClient.get<ApiResponse<KycDocument[]>>(`/customers/${customerId}/kyc-documents`)
    return res.data.data
  },

  uploadKycDocument: async (
    customerId: number | string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<{ document: KycDocument; customer: Customer }> => {
    const res = await apiClient.post<ApiResponse<KycDocument> & { customer?: Customer }>(
      `/customers/${customerId}/kyc-documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percent)
          }
        },
      }
    )
    return {
      document: res.data.data,
      customer: res.data.customer as Customer,
    }
  },

  getKycDocument: async (id: number | string): Promise<KycDocument> => {
    const res = await apiClient.get<ApiResponse<KycDocument>>(`/kyc-documents/${id}`)
    return res.data.data
  },

  downloadKycDocument: async (id: number | string, fileName?: string): Promise<void> => {
    const res = await apiClient.get(`/kyc-documents/${id}/download`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `document-${id}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  deleteKycDocument: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/kyc-documents/${id}`)
  },
}
