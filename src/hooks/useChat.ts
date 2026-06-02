import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useChat() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken, refreshAccessToken } = useAuthStore()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const {
    conversations,
    activeConversationId,
    loadingConversations,
    addMessageToConversation,
    setLoading,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  } = useChatStore()

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  )

  const isLoading = activeConversationId
    ? loadingConversations.has(activeConversationId)
    : false

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

    socket.on('agent:response', (data: { reply: string; queries?: any[]; _conversationId?: string }) => {
      const convId = data._conversationId || useChatStore.getState().activeConversationId
      if (convId) {
        addMessageToConversation(convId, {
          role: 'assistant',
          content: data.reply,
          queries: data.queries || [],
        })
        setLoading(convId, false)
      }
      setError(null)
    })

    socket.on('agent:error', (data: { message: string; _conversationId?: string }) => {
      const errorMsg = data.message || 'An unknown error occurred'
      const convId = data._conversationId || useChatStore.getState().activeConversationId
      if (convId) {
        addMessageToConversation(convId, { role: 'assistant', content: `Error: ${errorMsg}` })
        setLoading(convId, false)
      }
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
        refreshAccessToken()
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

  const sendViaHttp = useCallback(
    async (prompt: string, conversationId: string) => {
      try {
        const currentConv = useChatStore.getState().conversations.find(
          (c) => c.id === conversationId
        )
        const history = (currentConv?.messages ?? [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-20)
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          }))

        const response = await axios.post<{ reply: string; queries?: any[] }>(
          `${API_URL}/agent/chat`,
          { prompt, history },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 30000,
          }
        )
        addMessageToConversation(conversationId, {
          role: 'assistant',
          content: response.data.reply,
          queries: response.data.queries || [],
        })
        setError(null)
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to get response'
        addMessageToConversation(conversationId, { role: 'assistant', content: `Error: ${errorMsg}` })
        setError(errorMsg)
      } finally {
        setLoading(conversationId, false)
      }
    },
    [accessToken, addMessageToConversation, setLoading]
  )

  const sendMessage = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return

      // Auto-create conversation if none active
      let convId = activeConversationId
      if (!convId) {
        convId = createConversation()
      }

      addMessageToConversation(convId, { role: 'user', content: prompt })
      setLoading(convId, true)
      setError(null)

      // Try WebSocket first, fall back to HTTP
      if (socketRef.current?.connected) {
        const currentConv = useChatStore.getState().conversations.find(
          (c) => c.id === convId
        )
        const history = (currentConv?.messages ?? [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-20)
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          }))

        socketRef.current.emit('agent:chat', { prompt, history, _conversationId: convId })

        // Timeout: if no response in 60s, show error
        const targetConvId = convId
        const timeout = setTimeout(() => {
          if (useChatStore.getState().loadingConversations.has(targetConvId)) {
            addMessageToConversation(targetConvId, {
              role: 'assistant',
              content: 'Error: Request timed out. The server took too long to respond.',
            })
            setLoading(targetConvId, false)
            setError('Request timed out')
          }
        }, 60000)

        // Clear timeout when this conversation stops loading
        const unsub = useChatStore.subscribe((state) => {
          if (!state.loadingConversations.has(targetConvId)) {
            clearTimeout(timeout)
            unsub()
          }
        })
      } else {
        sendViaHttp(prompt, convId)
      }
    },
    [activeConversationId, addMessageToConversation, setLoading, createConversation, sendViaHttp]
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
