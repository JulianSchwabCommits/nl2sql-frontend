import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowUp, Loader2, AlertCircle, X, ChevronDown, ChevronRight, Database, Terminal, Square } from 'lucide-react'
import type { QueryExecution } from '@/stores/chatStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TextareaAutosize from 'react-textarea-autosize'
import { useAuthStore } from '@/stores/authStore'

export default function Chat() {
  const { messages, isLoading, sendMessage, cancelMessage, error, clearError } = useChat()
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
          <EmptyState
            onSuggestionClick={handleSuggestion}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            cancelMessage={cancelMessage}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
                  {/* Clean text response */}
                  <div
                    className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                      msg.role === 'assistant' && msg.content.startsWith('Error:')
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    <CleanContent content={msg.content} />
                  </div>
                  {/* Queries dropdown */}
                  {msg.queries && msg.queries.length > 0 && (
                    <QueriesDropdown queries={msg.queries} />
                  )}
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
                    Querying database...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - only show when there are messages */}
      {messages.length > 0 && (
        <div className="px-4 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative"
        >
          <div className="relative flex items-center gap-1 rounded-[28px] border border-input bg-background pl-5 pr-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
            <TextareaAutosize
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    handleSubmit(e)
                  }
                }
              }}
              placeholder="Ask a question about the database..."
              disabled={isLoading}
              minRows={1}
              maxRows={6}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 pl-1"
              autoFocus
            />
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={cancelMessage}
                title="Cancel"
                className="h-10 w-10 rounded-full shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="h-10 w-10 rounded-full shrink-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
      )}
    </div>
  )
}

/** Renders the assistant's text as formatted markdown (tables, bold, lists, etc.) */
function CleanContent({ content }: { content: string }) {
  if (!content.trim()) return null

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-th:text-left prose-th:font-semibold prose-tr:border-b">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

// function ConnectionIndicator({ status }: { status: string }) {
//   const config = {
//     connected: { icon: Wifi, className: 'text-green-500', label: 'Connected' },
//     connecting: { icon: Wifi, className: 'text-yellow-500 animate-pulse', label: 'Connecting...' },
//     disconnected: { icon: WifiOff, className: 'text-muted-foreground', label: 'Disconnected' },
//     error: { icon: WifiOff, className: 'text-destructive', label: 'Connection error' },
//   }[status] ?? { icon: WifiOff, className: 'text-muted-foreground', label: 'Unknown' }

//   const Icon = config.icon

//   return (
//     <div className="flex items-center gap-1.5" title={config.label}>
//       <Icon className={`h-3.5 w-3.5 ${config.className}`} />
//       <span className={`text-xs ${config.className}`}>{config.label}</span>
//     </div>
//   )
// }

interface EmptyStateProps {
  onSuggestionClick: (q: string) => void
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  cancelMessage: () => void
}

function EmptyState({ onSuggestionClick, input, setInput, handleSubmit, isLoading, cancelMessage }: EmptyStateProps) {
  const user = useAuthStore((state) => state.user)
  const suggestions = [
    'Show me all food categories',
    'Whats the fdcId 321358?',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-3xl font-semibold mb-12 text-foreground">
        Good to see you, {user?.name || 'there'}.
      </h1>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mb-6"
      >
        <div className="relative flex items-center gap-1 rounded-[28px] border border-input bg-background pl-5 pr-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                  handleSubmit(e)
                }
              }
            }}
            placeholder="Ask a question about the database..."
            disabled={isLoading}
            minRows={1}
            maxRows={6}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 pl-1"
            autoFocus
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={cancelMessage}
              title="Cancel"
              className="h-10 w-10 rounded-full shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-10 w-10 rounded-full shrink-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Suggestion bubbles */}
      <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
        {suggestions.map((q) => (
          <button
            key={q}
            className="text-sm px-5 py-2.5 rounded-full border border-input hover:bg-accent transition-colors"
            onClick={() => onSuggestionClick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function QueriesDropdown({ queries }: { queries: QueryExecution[] }) {
  const [open, setOpen] = useState(false)
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null)

  return (
    <div className="mt-3 rounded-lg border bg-card overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Database className="h-3.5 w-3.5" />
        <span>
          {queries.length} {queries.length === 1 ? 'query' : 'queries'} executed
        </span>
        {queries.some((q) => q.error) && (
          <span className="ml-auto text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
            errors
          </span>
        )}
      </button>

      {/* Expanded query list */}
      {open && (
        <div className="border-t">
          {queries.map((q, i) => (
            <div key={i} className="border-b last:border-0">
              {/* Query header */}
              <button
                onClick={() => setExpandedQuery(expandedQuery === i ? null : i)}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs hover:bg-muted/30 transition-colors"
              >
                {expandedQuery === i ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <Terminal className="h-3 w-3 text-muted-foreground" />
                <span
                  className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                    q.error
                      ? 'bg-destructive/10 text-destructive'
                      : q.operation === 'SELECT'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : q.operation === 'INSERT'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : q.operation === 'UPDATE'
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                            : q.operation === 'DELETE'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {q.operation}
                </span>
                <span className="text-muted-foreground font-mono truncate flex-1 text-left">
                  {q.sql.length > 60 ? q.sql.slice(0, 60) + '...' : q.sql}
                </span>
                {q.rowCount !== undefined && !q.error && (
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {q.rowCount} row{q.rowCount !== 1 ? 's' : ''}
                  </span>
                )}
              </button>

              {/* Expanded: full SQL + results table */}
              {expandedQuery === i && (
                <div className="px-4 pb-3 space-y-3">
                  {/* Raw SQL */}
                  <pre className="bg-muted/70 rounded-md p-3 overflow-x-auto text-xs font-mono text-foreground">
                    <code>{q.sql}</code>
                  </pre>

                  {/* Error */}
                  {q.error && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-md p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {q.error}
                    </div>
                  )}

                  {/* Results table */}
                  {q.results && q.results.length > 0 && (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            {Object.keys(q.results[0]).map((col) => (
                              <TableHead key={col} className="text-xs font-semibold whitespace-nowrap">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {q.results.map((row, ri) => (
                            <TableRow key={ri}>
                              {Object.values(row).map((val, ci) => (
                                <TableCell key={ci} className="text-xs whitespace-nowrap max-w-[250px] truncate">
                                  {val === null ? (
                                    <span className="text-muted-foreground italic">null</span>
                                  ) : (
                                    String(val)
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
