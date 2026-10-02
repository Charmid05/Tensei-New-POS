import { useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

interface UseLoadingStatesReturn {
  states: Record<string, LoadingState>
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string | null) => void
  setSuccess: (key: string, success: boolean) => void
  clearState: (key: string) => void
  clearAllStates: () => void
  isAnyLoading: boolean
}

const defaultState: LoadingState = {
  isLoading: false,
  error: null,
  success: false,
}

export function useLoadingStates(): UseLoadingStatesReturn {
  const [states, setStates] = useState<Record<string, LoadingState>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || defaultState,
        isLoading: loading,
        error: loading ? null : prev[key]?.error || null,
      }
    }))
  }, [])

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || defaultState,
        isLoading: false,
        error,
        success: false,
      }
    }))
  }, [])

  const setSuccess = useCallback((key: string, success: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || defaultState,
        isLoading: false,
        error: null,
        success,
      }
    }))
  }, [])

  const clearState = useCallback((key: string) => {
    setStates(prev => {
      const newStates = { ...prev }
      delete newStates[key]
      return newStates
    })
  }, [])

  const clearAllStates = useCallback(() => {
    setStates({})
  }, [])

  const isAnyLoading = Object.values(states).some(state => state.isLoading)

  return {
    states,
    setLoading,
    setError,
    setSuccess,
    clearState,
    clearAllStates,
    isAnyLoading,
  }
}

// Specialized hook for form loading states
export function useFormLoading() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true)
    setSubmitError(null)
    setIsSuccess(false)
  }, [])

  const stopSubmitting = useCallback((error?: string) => {
    setIsSubmitting(false)
    if (error) {
      setSubmitError(error)
    } else {
      setIsSuccess(true)
      // Clear success after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000)
    }
  }, [])

  const clearStates = useCallback(() => {
    setIsSubmitting(false)
    setSubmitError(null)
    setIsSuccess(false)
  }, [])

  return {
    isSubmitting,
    submitError,
    isSuccess,
    startSubmitting,
    stopSubmitting,
    clearStates,
  }
}

// Hook for pagination loading states
export function usePaginationLoading() {
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  return {
    isLoadingPage,
    isSearching,
    isFiltering,
    setIsLoadingPage,
    setIsSearching,
    setIsFiltering,
  }
}
