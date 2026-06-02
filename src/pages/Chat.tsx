import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, WifiOff, Wifi, AlertCircle, X } from 'lucide-react'

export default function Chat() {
  const { messages, isLoading, sendMessage, connectionStatus, error, clearError } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestion = (q: string) => {
    if (isLoading) return
    sendMessage(q)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/nl2sql_logo_only_picture.png"
            alt="NL2SQL"
            className="h-5 w-5 object-contain"
          />
          <h1 className="text-sm font-medium">Natural Language to SQL</h1>
        </div>
        <ConnectionIndicator status={connectionStatus} />
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <button onClick={clearError} className="shrink-0 p-0.5 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestion} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className={`flex items-center justify-center h-7 w-7 rounded-full shrink-0 text-xs font-medium ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.content.startsWith('Error:')
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {msg.role === 'user' ? 'U' : msg.content.startsWith('Error:') ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <img
                      src="/nl2sql_logo_only_picture.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {msg.role === 'user' ? 'You' : 'NL2SQL'}
                  </p>
                  <div
                    className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                      msg.role === 'assistant' && msg.content.startsWith('Error:')
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-muted">
                  <img
                    src="/nl2sql_logo_only_picture.png"
                    alt=""
                    className="h-4 w-4 object-contain"
                  />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    NL2SQL
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating query...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the database..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function ConnectionIndicator({ status }: { status: string }) {
  const config = {
    connected: { icon: Wifi, className: 'text-green-500', label: 'Connected' },
    connecting: { icon: Wifi, className: 'text-yellow-500 animate-pulse', label: 'Connecting...' },
    disconnected: { icon: WifiOff, className: 'text-muted-foreground', label: 'Disconnected' },
    error: { icon: WifiOff, className: 'text-destructive', label: 'Connection error' },
  }[status] ?? { icon: WifiOff, className: 'text-muted-foreground', label: 'Unknown' }

  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <Icon className={`h-3.5 w-3.5 ${config.className}`} />
      <span className={`text-xs ${config.className}`}>{config.label}</span>
    </div>
  )
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (q: string) => void }) {
  const suggestions = [
    'What foods have the most vitamin C?',
    'Show me all food categories',
    'Which foods have more than 20g of protein per 100g?',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <img
        src="/nl2sql_logo_full.png"
        alt="NL2SQL"
        className="h-16 object-contain mb-6"
      />
      <h2 className="text-lg font-semibold mb-2">Ask anything about the database</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        Type a natural language question and the AI will generate a SQL query
        for the food and nutrition database.
      </p>
      <div className="grid gap-2 w-full max-w-md">
        {suggestions.map((q) => (
          <button
            key={q}
            className="text-left text-sm px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
            onClick={() => onSuggestionClick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const parts: { type: 'text' | 'sql'; value: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const fencedPattern = /```(\w*)\n([\s\S]*?)```/g
  while ((match = fencedPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'sql', value: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex)
    if (/^\s*(SELECT|WITH)\b/i.test(remaining)) {
      parts.push({ type: 'sql', value: remaining.trim() })
    } else {
      parts.push({ type: 'text', value: remaining })
    }
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', value: content })
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'sql' ? (
          <pre
            key={i}
            className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"
          >
            <code>{part.value}</code>
          </pre>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </>
  )
}
