import { Fragment } from 'react'
import { Transition, Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Full Screen Modal for Mobile
 * Used for complex forms, detailed views, and workflows
 */
const FullScreenModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  showBackButton = false,
  onBack,
  className = '',
  hideHeader = false,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <Dialog.Panel className={`fixed inset-0 bg-white flex flex-col ${className}`}>
              {/* Header */}
              {!hideHeader && (
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                  {/* Back Button */}
                  {showBackButton && onBack ? (
                    <button
                      onClick={onBack}
                      className="p-2 -ml-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-10" /> // Spacer
                  )}

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 truncate">
                      {title}
                    </Dialog.Title>
                    {subtitle && (
                      <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                    )}
                  </div>

                  {/* Close Button */}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default FullScreenModal
