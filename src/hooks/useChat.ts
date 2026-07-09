import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore, ChatMessage } from '@/stores/chatStore'
import { useChatApi } from '@/hooks/useChatApi'
import { generateUUID } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ToolCallInfo {
  tool: string
  status: 'started' | 'completed'
  args?: Record<string, unknown>
  result?: Record<string, unknown>
}

export function useChat() {
  const socketRef = useRef<Socket | null>(null)
  const toolCallsRef = useRef<{ tool: string; args?: Record<string, unknown>; result?: Record<string, unknown> }[]>([])
  const { accessToken, refreshAccessToken } = useAuthStore()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const {
    activeConversationId,
    loadedConversations,
    loadingConversations,
    setLoading,
    addMessageToConversation,
  } = useChatStore()

  const { createConversation, fetchConversation } = useChatApi()

  const activeConversation = activeConversationId
    ? loadedConversations[activeConversationId]
    : null

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

    socket.on('agent:response', (data: { reply: string; queries?: Array<Record<string, unknown>>; conversationId?: string }) => {
      const convId = data.conversationId || useChatStore.getState().activeConversationId
      if (convId) {
        const message: ChatMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
          queries: data.queries as ChatMessage['queries'],
          toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
        }
        addMessageToConversation(convId, message)
        setLoading(convId, false)
      }
      setIsThinking(false)
      setToolCalls([])
      toolCallsRef.current = []
      setError(null)
    })

    socket.on('agent:thinking', () => {
      setIsThinking(true)
      setToolCalls([])
    })

    socket.on('agent:tool_call', (data: ToolCallInfo) => {
      setIsThinking(false)
      if (data.status === 'completed') {
        toolCallsRef.current = toolCallsRef.current.map((tc) =>
          tc.tool === data.tool && !tc.result
            ? { ...tc, result: data.result }
            : tc
        )
      } else {
        toolCallsRef.current = [...toolCallsRef.current, { tool: data.tool, args: data.args }]
      }
      setToolCalls((prev) => {
        if (data.status === 'completed') {
          return prev.map((tc) =>
            tc.tool === data.tool && tc.status === 'started'
              ? { ...tc, status: 'completed' as const }
              : tc
          )
        }
        return [...prev, data]
      })
    })

    socket.on('agent:error', (data: { message: string; conversationId?: string }) => {
      const errorMsg = data.message || 'An unknown error occurred'
      const convId = data.conversationId || useChatStore.getState().activeConversationId
      if (convId) {
        const message: ChatMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        }
        addMessageToConversation(convId, message)
        setLoading(convId, false)
      }
      setIsThinking(false)
      setToolCalls([])
      toolCallsRef.current = []
      setError(errorMsg)
    })

    socket.on('agent:cancelled', (data: { _conversationId?: string }) => {
      const convId = data._conversationId || useChatStore.getState().activeConversationId
      if (convId) {
        setLoading(convId, false)
      }
      setIsThinking(false)
      setToolCalls([])
      toolCallsRef.current = []
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

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return

      // Create conversation via backend if none active
      let convId = activeConversationId
      if (!convId) {
        const newId = generateUUID()
        await createConversation(newId, 'New Chat')
        convId = newId
      }

      // Ensure conversation is loaded
      if (!useChatStore.getState().loadedConversations[convId]) {
        await fetchConversation(convId)
      }

      // Add user message optimistically to the loaded conversation
      const userMessage: ChatMessage = {
        id: generateUUID(),
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      }
      addMessageToConversation(convId, userMessage)
      setLoading(convId, true)
      setError(null)

      // Send via WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('agent:chat', { prompt, conversationId: convId })

        // Timeout: if no response in 60s, show error
        const targetConvId = convId
        const timeout = setTimeout(() => {
          if (useChatStore.getState().loadingConversations.has(targetConvId)) {
            const timeoutMessage: ChatMessage = {
              id: generateUUID(),
              role: 'assistant',
              content: 'Error: Request timed out. The server took too long to respond.',
              timestamp: new Date().toISOString(),
            }
            addMessageToConversation(targetConvId, timeoutMessage)
            setLoading(targetConvId, false)
            setError('Request timed out')
          }
        }, 60000)

        const unsub = useChatStore.subscribe((state) => {
          if (!state.loadingConversations.has(targetConvId)) {
            clearTimeout(timeout)
            unsub()
          }
        })
      } else {
        // No connection - show error
        const errMessage: ChatMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: 'Error: Not connected to the server. Please wait for reconnection.',
          timestamp: new Date().toISOString(),
        }
        addMessageToConversation(convId, errMessage)
        setLoading(convId, false)
        setError('Not connected')
      }
    },
    [activeConversationId, addMessageToConversation, setLoading, createConversation, fetchConversation]
  )

  const clearError = useCallback(() => setError(null), [])

  const cancelMessage = useCallback(() => {
    if (!activeConversationId) return
    if (!loadingConversations.has(activeConversationId)) return

    if (socketRef.current?.connected) {
      socketRef.current.emit('agent:cancel')
    }

    setLoading(activeConversationId, false)
  }, [activeConversationId, loadingConversations, setLoading])

  return {
    messages: activeConversation?.messages ?? [],
    isLoading,
    sendMessage,
    cancelMessage,
    activeConversationId,
    connectionStatus,
    error,
    clearError,
    isThinking,
    toolCalls,
  }
}
