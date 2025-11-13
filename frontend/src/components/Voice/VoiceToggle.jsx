import React from 'react'
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { MicrophoneIcon as MicrophoneSolid } from '@heroicons/react/24/solid'

/**
 * Voice Toggle Button
 * Toggle button for voice input/output
 */
const VoiceToggle = ({
  isListening = false,
  isSpeaking = false,
  onToggle,
  disabled = false,
  size = 'md',
  variant = 'primary',
  showLabel = true,
  className = '',
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  }

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  }

  // Button variants
  const getButtonClasses = () => {
    let baseClasses = `relative inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses[size]} `

    if (disabled) {
      baseClasses += 'opacity-50 cursor-not-allowed '
    } else {
      baseClasses += 'hover:scale-105 active:scale-95 cursor-pointer '
    }

    // Variant styles
    if (variant === 'primary') {
      if (isListening) {
        baseClasses += 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 animate-pulse'
      } else if (isSpeaking) {
        baseClasses += 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
      } else {
        baseClasses += 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      }
    } else if (variant === 'secondary') {
      if (isListening) {
        baseClasses += 'bg-red-100 hover:bg-red-200 text-red-600 focus:ring-red-500'
      } else if (isSpeaking) {
        baseClasses += 'bg-green-100 hover:bg-green-200 text-green-600 focus:ring-green-500'
      } else {
        baseClasses += 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
      }
    } else if (variant === 'minimal') {
      if (isListening) {
        baseClasses += 'bg-red-500 text-white focus:ring-red-500'
      } else if (isSpeaking) {
        baseClasses += 'bg-green-500 text-white focus:ring-green-500'
      } else {
        baseClasses += 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
      }
    }

    return baseClasses + (className ? ` ${className}` : '')
  }

  // Get icon based on state
  const getIcon = () => {
    const IconComponent = isListening || isSpeaking ? MicrophoneSolid : MicrophoneIcon

    return (
      <IconComponent
        className={`${iconSizes[size]} transition-transform duration-200 ${isListening ? 'scale-110' : ''}`}
      />
    )
  }

  // Get tooltip label
  const getTooltip = () => {
    if (disabled) return 'Voice features not available'

    if (isListening) return 'Click to stop listening'
    if (isSpeaking) return 'Click to stop speaking'

    return 'Click to start voice input'
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={getButtonClasses()}
        title={getTooltip()}
        aria-label={getTooltip()}
        {...props}
      >
        {getIcon()}

        {/* Listening indicator */}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}

        {/* Speaking indicator */}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
        )}
      </button>

      {/* Label */}
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {isListening ? 'Listening...' : isSpeaking ? 'Speaking' : 'Voice'}
        </span>
      )}
    </div>
  )
}

export default VoiceToggle
