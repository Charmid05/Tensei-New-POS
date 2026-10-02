import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Keyboard, 
  X,
  Zap,
  Info
} from 'lucide-react'

interface ShortcutInfo {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
}

interface KeyboardShortcutsHelpProps {
  shortcuts: ShortcutInfo[]
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null

  const formatShortcut = (shortcut: ShortcutInfo) => {
    const keys = []
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.shift) keys.push('Shift')
    if (shortcut.alt) keys.push('Alt')
    keys.push(shortcut.key.toUpperCase())
    return keys.join(' + ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Speed up your workflow with these shortcuts</span>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700 flex-1">
                    {shortcut.description}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatShortcut(shortcut)}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Pro Tips
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Shortcuts work when not typing in input fields</li>
                    <li>• Use product search (Ctrl+F) for instant item lookup</li>
                    <li>• Navigate search results with arrow keys</li>
                    <li>• Press this shortcut again to close this help</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick shortcut indicator component for UI
export function ShortcutIndicator({ shortcut }: { shortcut: string }) {
  return (
    <Badge variant="outline" className="text-xs font-mono opacity-70 ml-2">
      {shortcut}
    </Badge>
  )
}
