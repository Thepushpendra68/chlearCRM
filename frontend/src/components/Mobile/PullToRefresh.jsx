import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { MobileOnly } from '../ResponsiveUtils'
import usePullToRefresh from '../../hooks/usePullToRefresh'

/**
 * Pull to Refresh wrapper component
 * Wraps content and provides pull-to-refresh functionality on mobile
 */
const PullToRefresh = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 60,
  maxPullDistance = 100,
  className = '',
  showIndicator = true,
}) => {
  const { containerRef, isPulling, pullDistance, isRefreshing, canRefresh } = usePullToRefresh(
    onRefresh,
    { threshold, maxPullDistance, disabled }
  )

  // Calculate refresh indicator height
  const indicatorHeight = Math.min(pullDistance, 80)
  const progress = Math.min(pullDistance / threshold, 1)

  return (
    <MobileOnly>
      <div ref={containerRef} className={`relative overflow-y-auto ${className}`}>
        {/* Refresh Indicator */}
        {showIndicator && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
            style={{
              height: `${indicatorHeight}px`,
              transform: `translateY(${-indicatorHeight + Math.min(pullDistance, 20)}px)`,
              opacity: progress,
            }}
          >
            <div className="bg-white shadow-lg rounded-full p-2">
              <ArrowPathIcon
                className={`h-6 w-6 text-primary-600 transition-transform duration-200 ${
                  isRefreshing ? 'animate-spin' : canRefresh ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
            transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </div>
      </div>
    </MobileOnly>
  )
}

export default PullToRefresh
