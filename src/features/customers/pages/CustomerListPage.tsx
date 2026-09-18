import { showToast, useAuth, useDebounce } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import { customersApi } from '@/features/customers/api/customers'
import { branchesApi } from '@/features/branches/api/branches'
import type { Customer } from '@/features/customers/types'
import type { PaginationMeta } from '@/shared/types/api'
import {
  CUSTOMER_TYPE_LABELS,
  exportToCSV,
  canCreateCustomer,
  canEditCustomer,
  canDeleteCustomer,
} from '../customerHelpers'
import { MobileSortSelect } from '@/shared/components/MobileSortSelect'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { AddCustomerModal }    from '../modals/AddCustomerModal'
import { EditCustomerModal }   from '../modals/EditCustomerModal'
import { DeleteCustomerModal } from '../modals/DeleteCustomerModal'

import { CustomerPageHeader } from '../components/CustomerPageHeader'
import { CustomerStatsRow }   from '../components/CustomerStatsRow'
import { CustomerFilters }    from '../components/CustomerFilters'
import { CustomerTable }      from '../components/CustomerTable'

import './CustomerManagement.css'

type SortField = 'registration_date' | 'created_at' | 'full_name' | 'customer_number'

export const CustomerListPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const role = authUser?.role

  // Permissions
  const allowCreate = canCreateCustomer(role)
  const allowEdit   = canEditCustomer(role)
  const allowDelete = canDeleteCustomer(role)

  const queryClient = useQueryClient()

  // Filter state
  const [search, setSearch]             = useState('')
  const debouncedSearch                 = useDebounce(search, 300)
  const [typeFilter, setTypeFilter]     = useState('')
  const [kycFilter, setKycFilter]       = useState('')
  const [riskFilter, setRiskFilter]     = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [sortBy, setSortBy]             = useState<SortField>('created_at')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')
  const [page, setPage]                 = useState(1)

  // Modal state
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editTarget, setEditTarget]       = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Customer | null>(null)

  // Data — customers list
  const listQuery = useQuery({
    queryKey: [
      'customers',
      'list',
      {
        search: debouncedSearch.trim() || undefined,
        typeFilter,
        kycFilter,
        riskFilter,
        branchFilter,
        sortBy,
        sortDir,
        page,
      },
    ],
    queryFn: () =>
      customersApi.list({
        search: debouncedSearch.trim() || undefined,
        customer_type: typeFilter || undefined,
        kyc_status: kycFilter || undefined,
        risk_level: riskFilter || undefined,
        branch_id: branchFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      }),
  })

  const customers  = listQuery.data?.data ?? []
  const meta       = (listQuery.data?.meta as PaginationMeta | null) ?? null
  const loading    = listQuery.isFetching
  const listError  = listQuery.error as Error | null

  // Data — branches (for filter + modals)
  const branchesQuery = useQuery({
    queryKey: ['branches', 'options'],
    queryFn: () => branchesApi.list({ per_page: 100 }),
  })
  const branches = branchesQuery.data?.data ?? []

  // Surface fetch errors
  useEffect(() => {
    if (listError) showToast.error(listError.message || 'Failed to fetch customers.')
  }, [listError])

  // KPI computations (on current page of data)
  const totalVerified          = customers.filter((c) => c.kyc_status === 'verified').length
  const totalHighRisk          = customers.filter((c) => c.risk_level === 'high').length
  const totalPortfolioBalance  = customers.reduce((sum, c) => sum + (c.total_balance || 0), 0)

  // Handlers
  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('')
    setKycFilter('')
    setRiskFilter('')
    setBranchFilter('')
    setPage(1)
  }

  const handleToggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleExportCSV = () => {
    if (!customers.length) {
      showToast.error('No customer records to export.')
      return
    }
    const exportData = customers.map((c) => ({
      'Customer ID':       c.id,
      'Customer Number':   c.customer_number,
      'Full Name':         c.full_name,
      'Email':             c.email,
      'Phone':             c.phone,
      'Classification':    CUSTOMER_TYPE_LABELS[c.customer_type] || c.customer_type,
      'KYC Status':        c.kyc_status,
      'Risk Level':        c.risk_level,
      'Accounts Count':    c.accounts_count ?? 0,
      'Total Balance':     c.total_balance ?? 0,
      'Branch':            c.branch?.branch_name || 'Global',
      'Registration Date': c.registration_date || '',
    }))
    exportToCSV(exportData, `bankvision_customers_${new Date().toISOString().split('T')[0]}`)
    showToast.success('Export downloaded successfully!')
  }

  const invalidateCustomers = () => queryClient.invalidateQueries({ queryKey: ['customers'] })

  const showBranchFilter =
    role === 'admin' || role === 'compliance' || role === 'auditor' || role === 'analyst'

  return (
    <div className="cm-page">
      <CustomerPageHeader
        loading={loading}
        allowCreate={allowCreate}
        onExportCSV={handleExportCSV}
        onRefresh={() => listQuery.refetch()}
        onAddCustomer={() => setShowAddModal(true)}
      />

      <CustomerStatsRow
        totalCount={meta?.total ?? customers.length}
        totalVerified={totalVerified}
        totalHighRisk={totalHighRisk}
        totalPortfolioBalance={totalPortfolioBalance}
      />

      <CustomerFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        typeFilter={typeFilter}
        onTypeFilterChange={(v) => { setTypeFilter(v); setPage(1) }}
        kycFilter={kycFilter}
        onKycFilterChange={(v) => { setKycFilter(v); setPage(1) }}
        riskFilter={riskFilter}
        onRiskFilterChange={(v) => { setRiskFilter(v); setPage(1) }}
        branchFilter={branchFilter}
        onBranchFilterChange={(v) => { setBranchFilter(v); setPage(1) }}
        branches={branches}
        showBranchFilter={showBranchFilter}
        onReset={handleResetFilters}
      />

      {/* Mobile sort controls (hidden on desktop) */}
      <MobileSortSelect
        value={sortBy}
        dir={sortDir}
        options={[
          { value: 'created_at',         label: 'Sort by Date Added' },
          { value: 'full_name',          label: 'Sort by Name' },
          { value: 'customer_number',    label: 'Sort by Number' },
          { value: 'registration_date',  label: 'Sort by Registration' },
        ]}
        onField={(v) => { setSortBy(v as SortField); setPage(1) }}
        onDir={setSortDir}
      />

      <CustomerTable
        customers={customers}
        loading={loading}
        error={listError}
        sortBy={sortBy}
        sortDir={sortDir}
        onToggleSort={handleToggleSort}
        onRetry={() => listQuery.refetch()}
        allowEdit={allowEdit}
        allowDelete={allowDelete}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        meta={meta}
        page={page}
        onPageChange={setPage}
      />

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          branches={branches}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); invalidateCustomers() }}
        />
      )}

      {editTarget && (
        <EditCustomerModal
          customer={editTarget}
          branches={branches}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); invalidateCustomers() }}
        />
      )}

      {deleteTarget && (
        <DeleteCustomerModal
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); invalidateCustomers() }}
        />
      )}
    </div>
  )
}
