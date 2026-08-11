import { create } from 'zustand'

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
  toolCalls?: ToolCallRecord[]
}

export interface ToolCallRecord {
  tool: string
  args?: Record<string, unknown>
  result?: Record<string, unknown>
}

export interface ConversationMeta {
  id: string
  title: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

interface ChatState {
  // Conversation list (meta only - loaded from API)
  conversationsMeta: ConversationMeta[]
  total: number
  hasMore: boolean

  // Full conversations loaded on-demand (keyed by id)
  loadedConversations: Record<string, Conversation>

  activeConversationId: string | null

  // Loading/error states
  isLoadingList: boolean
  isLoadingMore: boolean
  isLoadingConversation: boolean
  listError: string | null

  // Per-conversation chat loading (while waiting for agent response)
  loadingConversations: Set<string>

  // Actions: conversation list management
  setConversationsMeta: (meta: ConversationMeta[], total: number, hasMore: boolean) => void
  appendConversationsMeta: (meta: ConversationMeta[], total: number, hasMore: boolean) => void
  addConversationMeta: (meta: ConversationMeta) => void
  removeConversationMeta: (id: string) => void
  updateConversationTitle: (id: string, title: string) => void

  // Actions: full conversation management
  setLoadedConversation: (conversation: Conversation) => void
  setActiveConversation: (id: string | null) => void

  // Actions: message management
  addMessageToConversation: (conversationId: string, msg: ChatMessage) => void

  // Actions: loading states
  setIsLoadingList: (loading: boolean) => void
  setIsLoadingMore: (loading: boolean) => void
  setIsLoadingConversation: (loading: boolean) => void
  setListError: (error: string | null) => void
  setLoading: (conversationId: string, loading: boolean) => void
  isConversationLoading: (conversationId: string) => boolean

  // Actions: message removal (for regenerate)
  removeLastAssistantMessage: (conversationId: string) => ChatMessage | null

  // Actions: reset
  reset: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversationsMeta: [],
  total: 0,
  hasMore: false,
  loadedConversations: {},
  activeConversationId: null,
  isLoadingList: false,
  isLoadingMore: false,
  isLoadingConversation: false,
  listError: null,
  loadingConversations: new Set<string>(),

  setConversationsMeta: (meta, total, hasMore) =>
    set({ conversationsMeta: meta, total, hasMore, listError: null }),

  appendConversationsMeta: (meta, total, hasMore) =>
    set((state) => ({
      conversationsMeta: [...state.conversationsMeta, ...meta],
      total,
      hasMore,
    })),

  addConversationMeta: (meta) =>
    set((state) => ({
      conversationsMeta: [meta, ...state.conversationsMeta],
      total: state.total + 1,
    })),

  removeConversationMeta: (id) =>
    set((state) => {
      const filtered = state.conversationsMeta.filter((c) => c.id !== id)
      const { [id]: _, ...loadedConversations } = state.loadedConversations
      const loadingConversations = new Set(state.loadingConversations)
      loadingConversations.delete(id)
      const newActive =
        state.activeConversationId === id
          ? filtered[0]?.id ?? null
          : state.activeConversationId
      return {
        conversationsMeta: filtered,
        loadedConversations,
        loadingConversations,
        activeConversationId: newActive,
        total: state.total - 1,
      }
    }),

  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversationsMeta: state.conversationsMeta.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
      loadedConversations: state.loadedConversations[id]
        ? {
            ...state.loadedConversations,
            [id]: { ...state.loadedConversations[id], title },
          }
        : state.loadedConversations,
    })),

  setLoadedConversation: (conversation) =>
    set((state) => ({
      loadedConversations: {
        ...state.loadedConversations,
        [conversation.id]: conversation,
      },
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessageToConversation: (conversationId, msg) =>
    set((state) => {
      const existing = state.loadedConversations[conversationId]
      if (!existing) return state

      const updatedConversation = {
        ...existing,
        messages: [...existing.messages, msg],
      }

      // Also update title in meta if it changed (first user message)
      let updatedMeta = state.conversationsMeta
      if (existing.title === 'New Chat' && msg.role === 'user') {
        const newTitle = msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
        updatedConversation.title = newTitle
        updatedMeta = state.conversationsMeta.map((c) =>
          c.id === conversationId ? { ...c, title: newTitle } : c
        )
      }

      return {
        loadedConversations: {
          ...state.loadedConversations,
          [conversationId]: updatedConversation,
        },
        conversationsMeta: updatedMeta,
      }
    }),

  setIsLoadingList: (loading) => set({ isLoadingList: loading }),
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setIsLoadingConversation: (loading) => set({ isLoadingConversation: loading }),
  setListError: (error) => set({ listError: error }),

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

  removeLastAssistantMessage: (conversationId) => {
    const state = get()
    const conv = state.loadedConversations[conversationId]
    if (!conv) return null

    // Find last assistant message
    let lastIdx = -1
    for (let i = conv.messages.length - 1; i >= 0; i--) { if (conv.messages[i].role === 'assistant') { lastIdx = i; break } }
    if (lastIdx === -1) return null

    const removed = conv.messages[lastIdx]
    const updatedMessages = conv.messages.filter((_, i) => i !== lastIdx)

    set({
      loadedConversations: {
        ...state.loadedConversations,
        [conversationId]: { ...conv, messages: updatedMessages },
      },
    })

    return removed
  },

  reset: () =>
    set({
      conversationsMeta: [],
      total: 0,
      hasMore: false,
      loadedConversations: {},
      activeConversationId: null,
      isLoadingList: false,
      isLoadingMore: false,
      isLoadingConversation: false,
      listError: null,
      loadingConversations: new Set<string>(),
    }),
}))
