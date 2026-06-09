import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QueryExecution {
  sql: string
  operation: string
  results?: Record<string, unknown>[]
  error?: string
  rowCount?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sql?: string
  results?: Record<string, unknown>[]
  queries?: QueryExecution[]
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  // Per-conversation loading state (not persisted)
  loadingConversations: Set<string>
  hasFetched: boolean
  // Track which user owns this data
  _ownerId: string | null

  // Conversation management
  createConversation: () => string
  createConversationWithId: (id: string, title?: string) => void
  setConversations: (conversations: Conversation[]) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setActiveConversation: (id: string) => void

  // Message management
  addMessageToConversation: (conversationId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (conversationId: string, loading: boolean) => void
  isConversationLoading: (conversationId: string) => boolean

  // User isolation
  initForUser: (userId: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      loadingConversations: new Set<string>(),
      hasFetched: false,
      _ownerId: null,

      setConversations: (conversations) =>
        set({ conversations, hasFetched: true }),

      createConversation: () => {
        const id = crypto.randomUUID()
        const conversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }))
        return id
      },

      createConversationWithId: (id, title = 'New Chat') => {
        const conversation: Conversation = {
          id,
          title,
          messages: [],
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }))
      },

      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          const newActive =
            state.activeConversationId === id
              ? filtered[0]?.id ?? null
              : state.activeConversationId
          const loadingConversations = new Set(state.loadingConversations)
          loadingConversations.delete(id)
          return { conversations: filtered, activeConversationId: newActive, loadingConversations }
        }),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessageToConversation: (conversationId, msg) =>
        set((state) => {
          const message: ChatMessage = {
            ...msg,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          }

          return {
            conversations: state.conversations.map((c) => {
              if (c.id !== conversationId) return c
              const messages = [...c.messages, message]
              const title =
                c.title === 'New Chat' && msg.role === 'user'
                  ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
                  : c.title
              return { ...c, messages, title }
            }),
          }
        }),

      addMessage: (msg) => {
        const activeId = get().activeConversationId
        if (!activeId) return
        get().addMessageToConversation(activeId, msg)
      },

      setLoading: (conversationId, loading) =>
        set((state) => {
          const loadingConversations = new Set(state.loadingConversations)
          if (loading) {
            loadingConversations.add(conversationId)
          } else {
            loadingConversations.delete(conversationId)
          }
          return { loadingConversations }
        }),

      isConversationLoading: (conversationId) => {
        return get().loadingConversations.has(conversationId)
      },

      initForUser: (userId: string) => {
        const current = get()

        // If already loaded for this user, do nothing
        if (current._ownerId === userId) return

        // Save current user's data if they had any
        if (current._ownerId && current.conversations.length > 0) {
          saveUserData(current._ownerId, current.conversations, current.activeConversationId)
        }

        // Load new user's data
        const userData = loadUserData(userId)
        set({
          conversations: userData.conversations,
          activeConversationId: userData.activeConversationId,
          _ownerId: userId,
          loadingConversations: new Set<string>(),
        })
      },

      reset: () => {
        const current = get()
        // Save before clearing
        if (current._ownerId && current.conversations.length > 0) {
          saveUserData(current._ownerId, current.conversations, current.activeConversationId)
        }
        set({
          conversations: [],
          activeConversationId: null,
          _ownerId: null,
          loadingConversations: new Set<string>(),
        })
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        hasFetched: state.hasFetched,
        _ownerId: state._ownerId,
      }),
    }
  )
)

// Auto-save to user-specific key whenever conversations change
useChatStore.subscribe((state) => {
  if (state._ownerId) {
    saveUserData(state._ownerId, state.conversations, state.activeConversationId)
  }
})

// Helper: save user data to their own localStorage key
function saveUserData(userId: string, conversations: Conversation[], activeConversationId: string | null) {
  const key = `chat-data-${userId}`
  localStorage.setItem(key, JSON.stringify({ conversations, activeConversationId }))
}

// Helper: load user data from their own localStorage key
function loadUserData(userId: string): { conversations: Conversation[]; activeConversationId: string | null } {
  const key = `chat-data-${userId}`
  const stored = localStorage.getItem(key)
  if (!stored) return { conversations: [], activeConversationId: null }

  try {
    const data = JSON.parse(stored)
    return {
      conversations: data.conversations || [],
      activeConversationId: data.activeConversationId || null,
    }
  } catch {
    return { conversations: [], activeConversationId: null }
  }
}
