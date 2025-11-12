import { useState, useRef, useEffect } from 'react'

/**
 * Custom hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Function to call when refresh is triggered
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and handlers
 */
const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 60, // Minimum distance to trigger refresh
    maxPullDistance = 100, // Maximum pull distance
    disabled = false, // Disable pull-to-refresh
  } = options

  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)

  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    const handleTouchStart = (e) => {
      // Only allow pull-to-refresh when at the top of the scroll
      if (container.scrollTop > 0) return

      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }

    const handleTouchMove = (e) => {
      if (!isPulling || disabled) return

      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, currentY.current - startY.current)

      // Don't allow pulling beyond max distance
      const clampedDistance = Math.min(distance, maxPullDistance)
      setPullDistance(clampedDistance)

      // Can refresh if we've passed the threshold
      setCanRefresh(clampedDistance >= threshold)

      // Prevent the default pull-to-refresh behavior
      if (distance > 0) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling || disabled) return

      setIsPulling(false)
      setPullDistance(0)
      setCanRefresh(false)

      // Trigger refresh if we can
      if (canRefresh && onRefresh) {
        try {
          setIsRefreshing(true)
          await onRefresh()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setIsRefreshing(false)
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, disabled, threshold, maxPullDistance, canRefresh, onRefresh])

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    canRefresh,
  }
}

export default usePullToRefresh
