import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
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
  isLoading: boolean

  // Conversation management
  createConversation: () => string
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setActiveConversation: (id: string) => void

  // Message management
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      isLoading: false,

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
          return { conversations: filtered, activeConversationId: newActive }
        }),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (msg) =>
        set((state) => {
          const activeId = state.activeConversationId
          if (!activeId) return state

          const message: ChatMessage = {
            ...msg,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          }

          return {
            conversations: state.conversations.map((c) => {
              if (c.id !== activeId) return c
              const messages = [...c.messages, message]
              // Auto-title from first user message
              const title =
                c.title === 'New Chat' && msg.role === 'user'
                  ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
                  : c.title
              return { ...c, messages, title }
            }),
          }
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'chat-storage',
    }
  )
)
