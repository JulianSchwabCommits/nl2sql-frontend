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
  // Per-conversation loading state
  loadingConversations: Set<string>

  // Conversation management
  createConversation: () => string
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setActiveConversation: (id: string) => void

  // Message management
  addMessageToConversation: (conversationId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (conversationId: string, loading: boolean) => void
  isConversationLoading: (conversationId: string) => boolean
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      loadingConversations: new Set<string>(),

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
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
