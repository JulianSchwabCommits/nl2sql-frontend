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
  const [isCollapsed, setIsCollapsed] = useState(false)

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
                className="h-8 w-8 object-contain group-hover:opacity-0 transition-opacity"
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
                variant="ghost"
                size="icon"
                className="w-full h-10"
                title="Search chats"
                disabled
              >
                <Search className="h-4 w-4" />
              </Button>
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
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
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
                  className="h-6 w-6 object-contain"
                />
                <img
                  src="/nl2sql_logo_only_schriftzug.png"
                  alt="NL2SQL"
                  className="h-4 object-contain"
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

            {/* New Chat and Search */}
            <div className="px-3 pb-3 space-y-2">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start gap-3 h-11 font-medium"
                variant="outline"
              >
                <SquarePen className="h-5 w-5" />
                New chat
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats"
                  className="pl-9 h-10"
                  disabled
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="px-3 py-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No chats yet</p>
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
                })
              )}
            </div>

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
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
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
    </div>
  )
}
