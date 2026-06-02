import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useChat() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken } = useAuthStore()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const {
    conversations,
    activeConversationId,
    isLoading,
    addMessage,
    setLoading,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  } = useChatStore()

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  )

  useEffect(() => {
    if (!accessToken) {
      setConnectionStatus('disconnected')
      return
    }

    setConnectionStatus('connecting')

    const socket = io(`${API_URL}/agent`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      setConnectionStatus('connected')
      setError(null)
    })

    socket.on('agent:response', (data: { reply: string }) => {
      addMessage({ role: 'assistant', content: data.reply })
      setLoading(false)
      setError(null)
    })

    socket.on('agent:error', (data: { message: string }) => {
      const errorMsg = data.message || 'An unknown error occurred'
      addMessage({ role: 'assistant', content: `Error: ${errorMsg}` })
      setLoading(false)
      setError(errorMsg)
    })

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message)
      setConnectionStatus('error')
      setError(`Connection failed: ${err.message}`)
    })

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected')
      if (reason === 'io server disconnect') {
        setError('Disconnected by server (token may be expired)')
      }
    })

    socket.on('reconnect_attempt', (attempt) => {
      setConnectionStatus('connecting')
      setError(`Reconnecting... (attempt ${attempt})`)
    })

    socket.on('reconnect', () => {
      setConnectionStatus('connected')
      setError(null)
    })

    socket.on('reconnect_failed', () => {
      setConnectionStatus('error')
      setError('Failed to reconnect after multiple attempts')
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  // HTTP fallback for when WebSocket is not connected
  const sendViaHttp = useCallback(
    async (prompt: string) => {
      try {
        const response = await axios.post<{ reply: string }>(
          `${API_URL}/agent/chat`,
          { prompt },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 30000,
          }
        )
        addMessage({ role: 'assistant', content: response.data.reply })
        setError(null)
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to get response'
        addMessage({ role: 'assistant', content: `Error: ${errorMsg}` })
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    },
    [accessToken, addMessage, setLoading]
  )

  const sendMessage = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return

      // Auto-create conversation if none active
      if (!activeConversationId) {
        createConversation()
      }

      addMessage({ role: 'user', content: prompt })
      setLoading(true)
      setError(null)

      // Try WebSocket first, fall back to HTTP
      if (socketRef.current?.connected) {
        socketRef.current.emit('agent:chat', { prompt })

        // Timeout: if no response in 30s, show error
        const timeout = setTimeout(() => {
          if (useChatStore.getState().isLoading) {
            addMessage({
              role: 'assistant',
              content: 'Error: Request timed out. The server took too long to respond.',
            })
            setLoading(false)
            setError('Request timed out')
          }
        }, 30000)

        // Clear timeout when response arrives (via store subscription)
        const unsub = useChatStore.subscribe((state) => {
          if (!state.isLoading) {
            clearTimeout(timeout)
            unsub()
          }
        })
      } else {
        // Fallback to HTTP
        sendViaHttp(prompt)
      }
    },
    [activeConversationId, addMessage, setLoading, createConversation, sendViaHttp]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    messages: activeConversation?.messages ?? [],
    isLoading,
    sendMessage,
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
    connectionStatus,
    error,
    clearError,
  }
}
