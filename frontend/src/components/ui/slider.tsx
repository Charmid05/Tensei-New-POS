import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  disabled?: boolean
  className?: string
  orientation?: "horizontal" | "vertical"
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({
    value = [0],
    onValueChange,
    max = 100,
    min = 0,
    step = 1,
    disabled = false,
    className,
    orientation = "horizontal",
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value[0])
    const [isDragging, setIsDragging] = React.useState(false)

    const [sliderRect, setSliderRect] = React.useState<DOMRect | null>(null)

    const getPercentage = (val: number) => {
      return ((val - min) / (max - min)) * 100
    }

    const getValueFromPosition = (clientX: number) => {
      if (!sliderRect) return min

      const percentage = ((clientX - sliderRect.left) / sliderRect.width) * 100
      const rawValue = (percentage / 100) * (max - min) + min

      // Round to step
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, steppedValue))
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return

      const rect = e.currentTarget.getBoundingClientRect()
      setSliderRect(rect)
      setIsDragging(true)
      const newValue = getValueFromPosition(e.clientX)
      setInternalValue(newValue)
      onValueChange?.([newValue])
    }

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isDragging || disabled) return

      const newValue = getValueFromPosition(e.clientX)
      setInternalValue(newValue)
      onValueChange?.([newValue])
    }, [isDragging, disabled, onValueChange, getValueFromPosition])

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false)
    }, [])

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, handleMouseMove, handleMouseUp])

    React.useEffect(() => {
      setInternalValue(value[0])
    }, [value])

    const percentage = getPercentage(internalValue)

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          orientation === "vertical" ? "flex-col h-full" : "flex-row",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {/* Track */}
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-secondary",
            orientation === "vertical" ? "w-2 h-full flex-1" : "h-2 w-full grow"
          )}
        >
          {/* Range/Fill */}
          <div
            className={cn(
              "absolute bg-primary transition-all",
              orientation === "vertical"
                ? "bottom-0 w-full"
                : "left-0 top-0 h-full"
            )}
            style={{
              [orientation === "vertical" ? "height" : "width"]: `${percentage}%`
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className={cn(
            "block rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            orientation === "vertical" ? "w-5 h-5 -ml-1" : "h-5 w-5 -mt-1"
          )}
          style={{
            [orientation === "vertical" ? "bottom" : "left"]: `${percentage}%`,
            transform: orientation === "vertical" ? "translateY(50%)" : "translateX(-50%)"
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
