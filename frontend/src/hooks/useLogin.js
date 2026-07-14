import { useEffect, useState } from 'react'
import { login as apiLogin } from '../api/authApi.js'

/**
 * Состояние и submit формы входа (без смены пароля / first-login).
 * После успешного POST /api/login — fetchUser и navigate('/').
 */
export function useLogin(fetchUser, navigate) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchUser().then(() => {
      if (!cancelled) setSessionChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [fetchUser])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await apiLogin(username.trim(), password)
      if (!res.ok) {
        if (res.status === 401) {
          setError('Неверный логин или пароль')
        } else {
          setError('Ошибка входа. Попробуйте позже.')
        }
        return
      }
      await fetchUser()
      navigate('/', { replace: true })
    } catch {
      setError('Ошибка соединения. Проверьте подключение.')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    username,
    password,
    error,
    submitting,
    sessionChecked,
    setUsername,
    setPassword,
    handleSubmit,
  }
}
