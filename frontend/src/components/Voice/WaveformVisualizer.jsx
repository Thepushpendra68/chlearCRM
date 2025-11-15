import React, { forwardRef, useEffect, useState } from 'react'

/**
 * Waveform Visualizer Component
 * Displays real-time audio waveform during voice recording using Web Audio API
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

  // Generate real waveform based on actual audio level
  useEffect(() => {
    if (!isListening || audioLevel === 0) {
      // Reset bars when not listening or no audio
      setBars(Array(barCount).fill(0))
      return
    }

    // Update bars based on real audio level
    setBars(prevBars => {
      return prevBars.map((_, index) => {
        // Create a smooth waveform based on actual audio level
        // Higher audio levels produce taller bars
        const normalizedLevel = Math.min(audioLevel * 100, 100)

        // Add some variation to make it look natural
        // using the audio level as the primary factor
        const variation = (index / barCount) * 0.3 + 0.7 // 0.7 to 1.0
        const barHeight = normalizedLevel * variation

        return Math.max(5, Math.min(100, barHeight))
      })
    })
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
            opacity: isListening ? Math.min(0.3 + audioLevel, 1) : 0.2,
            transform: isListening ? 'scaleY(1)' : 'scaleY(0.5)',
          }}
        />
      ))}
    </div>
  )
})

WaveformVisualizer.displayName = 'WaveformVisualizer'

export default WaveformVisualizer
