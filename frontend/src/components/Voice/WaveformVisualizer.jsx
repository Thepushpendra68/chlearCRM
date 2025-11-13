import React, { forwardRef, useEffect, useState } from 'react'

/**
 * Waveform Visualizer Component
 * Displays audio waveform during voice recording
 */
const WaveformVisualizer = forwardRef(({
  isListening = false,
  audioLevel = 0,
  height = 50,
  barCount = 20,
  color = 'rgb(59, 130, 246)', // blue-500
  backgroundColor = 'rgb(243, 244, 246)', // gray-100
  className = '',
  ...props
}, ref) => {
  const [bars, setBars] = useState(Array(barCount).fill(0))

  // Animate bars when listening
  useEffect(() => {
    if (!isListening) {
      // Reset bars when not listening
      setBars(Array(barCount).fill(0))
      return
    }

    const interval = setInterval(() => {
      setBars(prevBars => {
        return prevBars.map((_, index) => {
          // Create a wave pattern based on audio level
          const randomFactor = Math.random()
          const wavePosition = Math.sin(Date.now() / 200 + index * 0.5) * 50
          const baseHeight = Math.abs(wavePosition) + randomFactor * audioLevel

          return Math.max(5, Math.min(100, baseHeight))
        })
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isListening, audioLevel, barCount])

  return (
    <div
      ref={ref}
      className={`flex items-end justify-center gap-[2px] ${className}`}
      style={{ height }}
      {...props}
    >
      {bars.map((barHeight, index) => (
        <div
          key={index}
          className="transition-all duration-100 ease-out"
          style={{
            width: '3px',
            height: `${Math.max(barHeight * 0.6, 5)}px`,
            backgroundColor: color,
            borderRadius: '2px',
            opacity: isListening ? 0.8 : 0.3,
            transform: isListening ? 'scaleY(1)' : 'scaleY(0.5)',
          }}
        />
      ))}
    </div>
  )
})

WaveformVisualizer.displayName = 'WaveformVisualizer'

export default WaveformVisualizer
