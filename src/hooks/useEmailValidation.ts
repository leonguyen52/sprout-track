import { useState, useCallback } from 'react'

interface UseEmailValidationReturn {
  email: string
  error: string
  isValid: boolean
  setEmail: (email: string) => void
  validateEmail: () => boolean
  clearError: () => void
}

/**
 * Custom hook for email validation
 * Provides email state management and validation logic
 */
export const useEmailValidation = (): UseEmailValidationReturn => {
  const [email, setEmailState] = useState('')
  const [error, setError] = useState('')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const setEmail = useCallback((newEmail: string) => {
    setEmailState(newEmail)
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }, [error])

  const validateEmail = useCallback(() => {
    if (!email.trim()) {
      setError('Email address is required')
      return false
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return false
    }

    setError('')
    return true
  }, [email])

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const isValid = email.trim() !== '' && emailRegex.test(email.trim())

  return {
    email,
    error,
    isValid,
    setEmail,
    validateEmail,
    clearError,
  }
}
