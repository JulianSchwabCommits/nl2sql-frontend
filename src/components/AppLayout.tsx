import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useChatApi } from '@/hooks/useChatApi'
import { useChatStore } from '@/stores/chatStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  LogOut,
  Settings,
  SquarePen,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  PanelLeftClose,
  Shield,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Bot,
  Database,
  Sparkles,
} from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { generateUUID } from '@/lib/utils'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    conversationsMeta,
    hasMore,
    isLoadingList,
    isLoadingMore,
    listError,
    activeConversationId,
    fetchConversations,
    fetchMoreConversations,
    fetchConversation,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useChatApi()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const chatListRef = useRef<HTMLDivElement>(null)

  const isSettingsPage = location.pathname.startsWith('/settings')

  const settingsNavItems = [
    { label: 'General', path: '/settings', icon: Settings },
    { label: 'Profile', path: '/settings/profile', icon: User },
    { label: 'LLM', path: '/settings/llm', icon: Bot },
    { label: 'Databases', path: '/settings/databases', icon: Database },
    { label: 'Personalization', path: '/settings/personalization', icon: Sparkles },
  ]

  const isSettingsActive = (path: string) => {
    if (path === '/settings') return location.pathname === '/settings'
    return location.pathname.startsWith(path)
  }

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = chatListRef.current
    if (!el || !hasMore || isLoadingMore) return

    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchMoreConversations()
    }
  }, [hasMore, isLoadingMore, fetchMoreConversations])

  const handleLogout = async () => {
    useChatStore.getState().reset()
    await logout()
    navigate('/login')
  }

  const handleNewChat = async () => {
    const id = generateUUID()
    await createConversation(id, 'New Chat')
    if (location.pathname !== '/chat') {
      navigate('/chat')
    }
  }

  const handleSelectChat = async (id: string) => {
    await fetchConversation(id)
    if (location.pathname !== '/chat') {
      navigate('/chat')
    }
  }

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleConfirmRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-16' : 'w-64'
        } border-r bg-card flex flex-col shrink-0 transition-all duration-300 group relative overflow-hidden`}
      >
        {/* Collapsed sidebar */}
        {isCollapsed ? (
          <>
            {/* Logo */}
            <div className="flex items-center justify-center h-[52px]">
              <img
                src="/nl2sql_logo_only_picture.png"
                alt="NL2SQL"
                className="h-10 w-10 object-contain group-hover:opacity-0 transition-opacity"
              />
            </div>

            {/* Hover overlay toggle button */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute top-[10px] left-1/2 -translate-x-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
              title="Expand Sidebar"
            >
              <PanelLeftClose className="h-5 w-5 rotate-180" />
            </button>

            {/* Action buttons */}
            <div className="px-2 pb-3 space-y-2">
              {isSettingsPage ? (
                <>
                  <Button
                    onClick={() => navigate('/chat')}
                    variant="ghost"
                    size="icon"
                    className="w-full h-11"
                    title="Back to Chat"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  {settingsNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        variant="ghost"
                        size="icon"
                        className={`w-full h-10 ${isSettingsActive(item.path) ? 'bg-accent' : ''}`}
                        title={item.label}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    )
                  })}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleNewChat}
                    variant="ghost"
                    size="icon"
                    className="w-full h-11"
                    title="New chat"
                  >
                    <SquarePen className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={() => setIsSearchOpen(true)}
                    variant="ghost"
                    size="icon"
                    className="w-full h-10"
                    title="Search chats"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User profile */}
            <div className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-full rounded-lg p-2 hover:bg-accent transition-colors outline-none">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <>
            {/* Expanded sidebar */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <img
                  src="/nl2sql_logo_only_picture.png"
                  alt="NL2SQL"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Collapse Sidebar"
                onClick={() => setIsCollapsed(true)}
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>

            {/* New Chat/Search OR Settings Nav */}
            {isSettingsPage ? (
              <>
                <div className="px-3 pb-3">
                  <Button
                    onClick={() => navigate('/chat')}
                    className="w-full justify-start gap-3 h-11 font-medium"
                    variant="outline"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Chat
                  </Button>
                </div>

                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Settings
                  </p>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                  {settingsNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isSettingsActive(item.path)
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </>
            ) : (
              <>
                <div className="px-3 pb-3 space-y-2">
                  <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-3 h-11 font-medium"
                    variant="outline"
                  >
                    <SquarePen className="h-5 w-5" />
                    New chat
                  </Button>

                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="relative w-full h-10 flex items-center gap-2 px-3 rounded-md border border-input bg-secondary text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span className="text-sm">Search chats</span>
                  </button>
                </div>

                {/* Chat list */}
                <div
                  ref={chatListRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-2 space-y-1"
                >
              {isLoadingList ? (
                <div className="px-3 py-12 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                </div>
              ) : listError ? (
                <div className="px-3 py-12 text-center">
                  <AlertCircle className="h-10 w-10 mx-auto text-destructive/50 mb-3" />
                  <p className="text-sm text-destructive">{listError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={fetchConversations}
                  >
                    Retry
                  </Button>
                </div>
              ) : conversationsMeta.length === 0 ? (
                <div className="px-3 py-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No chats yet</p>
                </div>
              ) : (
                <>
                  {conversationsMeta.map((conv) => {
                    const isActive =
                      conv.id === activeConversationId &&
                      location.pathname === '/chat'
                    const isEditing = editingId === conv.id

                    return (
                      <div
                        key={conv.id}
                        className={`group/item flex items-center gap-1 rounded-lg transition-colors ${
                          isActive ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2.5">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmRename()
                                if (e.key === 'Escape') handleCancelRename()
                              }}
                              className="h-7 text-sm px-2"
                              autoFocus
                            />
                            <button
                              onClick={handleConfirmRename}
                              className="shrink-0 p-1 hover:bg-accent rounded"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="shrink-0 p-1 hover:bg-accent rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectChat(conv.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5 text-left"
                            >
                              <span className="text-sm truncate">
                                {conv.title}
                              </span>
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="shrink-0 p-1.5 rounded-md opacity-0 group-hover/item:opacity-100 hover:bg-accent transition-opacity outline-none mr-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleStartRename(conv.id, conv.title)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => deleteConversation(conv.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Load more indicator */}
                  {isLoadingMore && (
                    <div className="py-3 text-center">
                      <Loader2 className="h-4 w-4 mx-auto animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              )}
            </div>
              </>
            )}

            {/* User profile */}
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-accent transition-colors outline-none">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuItem onSelect={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>

      {/* Search Modal */}
      <Dialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)}>
        <div className="relative w-full max-w-2xl mx-auto bg-card rounded-xl border shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* New Chat Button */}
            <button
              onClick={() => {
                handleNewChat()
                setIsSearchOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b"
            >
              <SquarePen className="h-5 w-5" />
              <span className="font-medium">New chat</span>
            </button>

            {/* Chat List */}
            {conversationsMeta.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No chats yet</p>
              </div>
            ) : (
              conversationsMeta
                .filter((conv) => {
                  if (!searchQuery) return true
                  return conv.title.toLowerCase().includes(searchQuery.toLowerCase())
                })
                .map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      handleSelectChat(conv.id)
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                  >
                    <MessageSquare className="h-5 w-5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </button>
                ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
