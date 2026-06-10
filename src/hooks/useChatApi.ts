import { useCallback } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { generateUUID } from '@/lib/utils'
import type { Conversation } from '@/stores/chatStore'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set')
}

function getAuthHeaders() {
  const token = useAuthStore.getState().accessToken
  return { Authorization: `Bearer ${token}` }
}

/**
 * Hook that provides conversation CRUD operations synced with the backend (Redis).
 * Use this instead of calling useChatStore actions directly.
 */
export function useChatApi() {
  const {
    conversations,
    activeConversationId,
    setConversations,
    setActiveConversation,
    hasFetched,
  } = useChatStore()

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get<Conversation[]>(`${API_URL}/agent/conversations`, {
        headers: getAuthHeaders(),
      })
      setConversations(res.data)
      return res.data
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setConversations([])
      return []
    }
  }, [setConversations])

  const createConversation = useCallback(async (): Promise<string> => {
    const id = generateUUID()
    const title = 'New Chat'

    // Optimistic local update
    const store = useChatStore.getState()
    store.createConversationWithId(id, title)

    // Sync with backend
    try {
      await axios.post(
        `${API_URL}/agent/conversations`,
        { id, title },
        { headers: getAuthHeaders() },
      )
    } catch (err) {
      console.error('Failed to create conversation on backend:', err)
    }

    return id
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    // Optimistic local update
    useChatStore.getState().deleteConversation(id)

    // Sync with backend
    try {
      await axios.delete(`${API_URL}/agent/conversations/${id}`, {
        headers: getAuthHeaders(),
      })
    } catch (err) {
      console.error('Failed to delete conversation on backend:', err)
    }
  }, [])

  const renameConversation = useCallback(async (id: string, title: string) => {
    // Optimistic local update
    useChatStore.getState().renameConversation(id, title)

    // Sync with backend
    try {
      await axios.patch(
        `${API_URL}/agent/conversations/${id}`,
        { title },
        { headers: getAuthHeaders() },
      )
    } catch (err) {
      console.error('Failed to rename conversation on backend:', err)
    }
  }, [])

  return {
    conversations,
    activeConversationId,
    hasFetched,
    fetchConversations,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  }
}
