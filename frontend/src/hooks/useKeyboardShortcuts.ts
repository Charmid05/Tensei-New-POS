import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      ctrl: s.ctrlKey,
      shift: s.shiftKey,
      alt: s.altKey,
      description: s.description
    }))
  }
}

// Common POS keyboard shortcuts
export const createPOSShortcuts = (actions: {
  openSearch: () => void
  clearCart: () => void
  proceedToPayment: () => void
  switchOrderType: () => void
  selectTable: () => void
}) => [
  {
    key: 'f',
    ctrlKey: true,
    action: actions.openSearch,
    description: 'Open product search'
  },
  {
    key: 'Escape',
    action: actions.clearCart,
    description: 'Clear current cart'
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: actions.proceedToPayment,
    description: 'Proceed to payment'
  },
  {
    key: 't',
    ctrlKey: true,
    action: actions.switchOrderType,
    description: 'Switch order type'
  },
  {
    key: 's',
    ctrlKey: true,
    action: actions.selectTable,
    description: 'Select table (dine-in only)'
  }
]
