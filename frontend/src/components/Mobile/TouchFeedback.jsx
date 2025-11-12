import { useState, useRef } from 'react'

/**
 * Touch Feedback Component
 * Provides visual feedback when touching interactive elements
 * Creates a ripple effect on touch/click
 */
const TouchFeedback = ({
  children,
  className = '',
  disabled = false,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  onClick,
  onTouchStart,
  onTouchEnd,
}) => {
  const [ripples, setRipples] = useState([])
  const timeoutRef = useRef(null)

  const handleTouchStart = (e) => {
    if (disabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.touches[0].clientX - rect.left - size / 2
    const y = e.touches[0].clientY - rect.top - size / 2

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    }

    setRipples(prev => [...prev, newRipple])

    // Auto remove ripple after animation
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)

    if (onTouchStart) {
      onTouchStart(e)
    }
  }

  const handleTouchEnd = (e) => {
    if (onTouchEnd) {
      onTouchEnd(e)
    }
  }

  const handleClick = (e) => {
    if (disabled) return

    // For keyboard-activated clicks, create a ripple in the center
    if (e.clientX === 0 && e.clientY === 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = rect.width / 2 - size / 2
      const y = rect.height / 2 - size / 2

      const newRipple = {
        id: Date.now(),
        x,
        y,
        size,
      }

      setRipples(prev => [...prev, newRipple])

      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 600)
    }

    if (onClick) {
      onClick(e)
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {children}

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: 'ripple 0.6s linear',
            pointerEvents: 'none',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default TouchFeedback
