import { useRef, useEffect, useState } from 'react'

/**
 * Swipe Gesture Hook
 * Detects horizontal and vertical swipe gestures
 */
const useSwipeGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 500, // Maximum time for a swipe in ms
  } = options

  const [isSwiping, setIsSwiping] = useState(false)
  const startTouch = useRef({ x: 0, y: 0, time: 0 })
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      startTouch.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
      setIsSwiping(true)
    }

    const handleTouchEnd = (e) => {
      if (!isSwiping) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - startTouch.current.x
      const deltaY = touch.clientY - startTouch.current.y
      const deltaTime = Date.now() - startTouch.current.time

      setIsSwiping(false)

      // Check if swipe was fast enough
      if (deltaTime > maxSwipeTime) return

      // Check if swipe distance is sufficient
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (Math.max(absX, absY) < minSwipeDistance) return

      // Determine swipe direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isSwiping, minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    containerRef,
    isSwiping,
  }
}

/**
 * Swipeable Card Component
 * Wrapper that makes cards swipeable with configurable actions
 */
const SwipeableCard = ({
  children,
  leftAction,
  rightAction,
  leftActionLabel = 'Delete',
  rightActionLabel = 'Complete',
  leftActionColor = 'bg-red-500',
  rightActionColor = 'bg-green-500',
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  className = '',
}) => {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const containerRef = useRef(null)

  const maxSwipeDistance = 100
  const actionThreshold = 75

  const handleTouchStart = (e) => {
    if (disabled) return
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return

    const currentX = e.touches[0].clientX
    const deltaX = currentX - startX.current
    const newOffset = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX))

    setOffset(newOffset)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    setIsDragging(false)

    // Trigger actions based on swipe distance
    if (offset < -actionThreshold && onSwipeLeft) {
      onSwipeLeft()
    } else if (offset > actionThreshold && onSwipeRight) {
      onSwipeRight()
    }

    // Reset offset
    setOffset(0)
  }

  const getActionOpacity = () => {
    return Math.min(Math.abs(offset) / actionThreshold, 1)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-center px-6 ${leftActionColor} text-white transition-opacity`}
          style={{
            opacity: offset < 0 ? getActionOpacity() : 0,
          }}
        >
          {leftActionLabel}
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-center px-6 ${rightActionColor} text-white transition-opacity`}
          style={{
            opacity: offset > 0 ? getActionOpacity() : 0,
          }}
        >
          {rightActionLabel}
        </div>
      )}

      {/* Card Content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-white transition-transform ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { useSwipeGestures, SwipeableCard }
export default SwipeableCard
