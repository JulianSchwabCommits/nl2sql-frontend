import { useCallback } from 'react'
import { useChatStore } from '@/stores/chatStore'
import type { Conversation } from '@/stores/chatStore'
import api from '@/api/auth'

/**
 * Hook that provides conversation CRUD operations synced with the backend (Redis).
 * Redis is the single source of truth - no localStorage.
 */
export function useChatApi() {
  const {
    conversationsMeta,
    hasMore,
    activeConversationId,
    isLoadingList,
    isLoadingMore,
    isLoadingConversation,
    listError,
    loadedConversations,
    setConversationsMeta,
    appendConversationsMeta,
    addConversationMeta,
    removeConversationMeta,
    updateConversationTitle,
    setLoadedConversation,
    setActiveConversation,
    setIsLoadingList,
    setIsLoadingMore,
    setIsLoadingConversation,
    setListError,
  } = useChatStore()

  /** Fetch first page of conversations (meta only) */
  const fetchConversations = useCallback(async () => {
    setIsLoadingList(true)
    setListError(null)
    try {
      const res = await api.get<{ conversations: Array<{ id: string; title: string; createdAt: string }>; total: number; hasMore: boolean }>(
        '/agent/conversations',
        { params: { offset: 0, limit: 15 } },
      )
      setConversationsMeta(res.data.conversations, res.data.total, res.data.hasMore)
    } catch {
      setListError("Can't load conversations")
      setConversationsMeta([], 0, false)
    } finally {
      setIsLoadingList(false)
    }
  }, [setConversationsMeta, setIsLoadingList, setListError])

  /** Load more conversations (next page) */
  const fetchMoreConversations = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const offset = conversationsMeta.length
      const res = await api.get<{ conversations: Array<{ id: string; title: string; createdAt: string }>; total: number; hasMore: boolean }>(
        '/agent/conversations',
        { params: { offset, limit: 10 } },
      )
      appendConversationsMeta(res.data.conversations, res.data.total, res.data.hasMore)
    } catch {
      // Silently fail on load-more (list is still showing)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, conversationsMeta.length, appendConversationsMeta, setIsLoadingMore])

  /** Fetch a full conversation with messages (on-demand when user selects it) */
  const fetchConversation = useCallback(async (id: string) => {
    // If already loaded, just activate it
    if (loadedConversations[id]) {
      setActiveConversation(id)
      return loadedConversations[id]
    }

    setIsLoadingConversation(true)
    setActiveConversation(id)
    try {
      const res = await api.get<Conversation>(`/agent/conversations/${id}`)
      setLoadedConversation(res.data)
      return res.data
    } catch {
      setListError("Can't load conversation")
      return null
    } finally {
      setIsLoadingConversation(false)
    }
  }, [loadedConversations, setActiveConversation, setIsLoadingConversation, setLoadedConversation, setListError])

  /** Create a new conversation via backend */
  const createConversation = useCallback(async (id: string, title = 'New Chat'): Promise<string> => {
    // Optimistic: add to meta list and load an empty conversation
    const meta = { id, title, createdAt: new Date().toISOString() }
    addConversationMeta(meta)
    setLoadedConversation({ ...meta, messages: [] })
    setActiveConversation(id)

    // Sync to backend
    try {
      await api.post('/agent/conversations', { id, title })
    } catch {
      // Backend creates the conversation in the gateway anyway on first message
    }

    return id
  }, [addConversationMeta, setLoadedConversation, setActiveConversation])

  /** Delete a conversation */
  const deleteConversation = useCallback(async (id: string) => {
    // Optimistic removal
    removeConversationMeta(id)

    try {
      await api.delete(`/agent/conversations/${id}`)
    } catch {
      // If delete fails, user can refresh
    }
  }, [removeConversationMeta])

  /** Rename a conversation */
  const renameConversation = useCallback(async (id: string, title: string) => {
    // Optimistic update
    updateConversationTitle(id, title)

    try {
      await api.patch(`/agent/conversations/${id}`, { title })
    } catch {
      // If rename fails, title reverts on next fetch
    }
  }, [updateConversationTitle])

  return {
    conversationsMeta,
    hasMore,
    activeConversationId,
    isLoadingList,
    isLoadingMore,
    isLoadingConversation,
    listError,
    loadedConversations,
    fetchConversations,
    fetchMoreConversations,
    fetchConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  }
}
