import { useTheme } from '@/components/theme-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor } from 'lucide-react'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export default function General() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">General</h1>
          <p className="text-sm text-muted-foreground mt-1">Application preferences</p>
        </div>

        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Theme</Label>
              <p className="text-sm text-muted-foreground mt-1">Select your preferred theme</p>
            </div>

            <div className="flex gap-3 pt-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
