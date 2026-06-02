import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  LogOut,
  Settings,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  } = useChatStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNewChat = () => {
    createConversation()
    if (location.pathname !== '/chat') {
      navigate('/chat')
    }
  }

  const handleSelectChat = (id: string) => {
    setActiveConversation(id)
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
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        {/* Logo + New Chat */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <img
              src="/nl2sql_logo_only_picture.png"
              alt="NL2SQL"
              className="h-7 w-7 object-contain"
            />
            <img
              src="/nl2sql_logo_only_schriftzug.png"
              alt="NL2SQL"
              className="h-5 object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No chats yet</p>
              <p className="text-xs text-muted-foreground">
                Click + to start a new chat
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive =
                conv.id === activeConversationId &&
                location.pathname === '/chat'
              const isEditing = editingId === conv.id

              return (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 rounded-md pr-1 transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0 px-2 py-1.5">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename()
                          if (e.key === 'Escape') handleCancelRename()
                        }}
                        className="h-6 text-xs px-1.5"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmRename}
                        className="shrink-0 p-0.5 hover:text-foreground"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="shrink-0 p-0.5 hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSelectChat(conv.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 text-left"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm truncate">{conv.title}</span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity outline-none">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onSelect={() =>
                              handleStartRename(conv.id, conv.title)
                            }
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => deleteConversation(conv.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* User section */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-md px-2 py-2 hover:bg-accent transition-colors outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
