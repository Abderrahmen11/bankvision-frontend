import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardApi } from '@/api/dashboard'
import type {
  DashboardStatsData,
  TransactionChartPoint,
  RecentActivityData,
  RiskAnalysisData,
  ReportsData,
} from '@/types/dashboard'

interface HookResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

export function useStatsData(refreshInterval = 0): HookResult<DashboardStatsData> {
  const [data, setData] = useState<DashboardStatsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await dashboardApi.getStats()
      if (isMounted.current) {
        setData(res)
        setLastUpdated(new Date())
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load stats data.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => {
        isMounted.current = false
        clearInterval(interval)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [fetchData, refreshInterval])

  return { data, isLoading, error, refresh: fetchData, lastUpdated }
}

export function useChartData(days = 30, refreshInterval = 0): HookResult<TransactionChartPoint[]> {
  const [data, setData] = useState<TransactionChartPoint[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await dashboardApi.getChartData(days)
      if (isMounted.current) {
        setData(res)
        setLastUpdated(new Date())
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [days])

  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => {
        isMounted.current = false
        clearInterval(interval)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [fetchData, refreshInterval])

  return { data, isLoading, error, refresh: fetchData, lastUpdated }
}

export function useRecentActivityData(limit = 10, refreshInterval = 0): HookResult<RecentActivityData> {
  const [data, setData] = useState<RecentActivityData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await dashboardApi.getRecentActivity(limit)
      if (isMounted.current) {
        setData(res)
        setLastUpdated(new Date())
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load recent activity.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [limit])

  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => {
        isMounted.current = false
        clearInterval(interval)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [fetchData, refreshInterval])

  return { data, isLoading, error, refresh: fetchData, lastUpdated }
}

export function useRiskAnalysisData(refreshInterval = 0): HookResult<RiskAnalysisData> {
  const [data, setData] = useState<RiskAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await dashboardApi.getRiskAnalysis()
      if (isMounted.current) {
        setData(res)
        setLastUpdated(new Date())
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load risk analysis.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => {
        isMounted.current = false
        clearInterval(interval)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [fetchData, refreshInterval])

  return { data, isLoading, error, refresh: fetchData, lastUpdated }
}

export function useReportsData(refreshInterval = 0): HookResult<ReportsData> {
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await dashboardApi.getReports()
      if (isMounted.current) {
        setData(res)
        setLastUpdated(new Date())
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load reports.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => {
        isMounted.current = false
        clearInterval(interval)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [fetchData, refreshInterval])

  return { data, isLoading, error, refresh: fetchData, lastUpdated }
}
