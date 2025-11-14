import { Fragment } from 'react'
import { Transition, Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MobileOnly } from '../ResponsiveUtils'

/**
 * Bottom Sheet Modal for Mobile
 * Used for quick actions, confirmations, and simple forms
 */
const BottomSheetModal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  height = 'auto', // 'auto', 'half', 'full'
  className = '',
}) => {
  const getHeightClass = () => {
    switch (height) {
      case 'half':
        return 'h-1/2'
      case 'full':
        return 'h-full'
      case 'auto':
      default:
        return 'max-h-[90vh]'
    }
  }

  return (
    <MobileOnly>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0">
                <Transition.Child
                  as={Fragment}
                  enter="transition ease-out duration-300"
                  enterFrom="translate-y-full"
                  enterTo="translate-y-0"
                  leave="transition ease-in duration-200"
                  leaveFrom="translate-y-0"
                  leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-full">
                    <div
                      className={`bg-white rounded-t-2xl shadow-2xl ${getHeightClass()} flex flex-col ${className}`}
                    >
                      {/* Handle */}
                      <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {title}
                        </Dialog.Title>
                        {showCloseButton && (
                          <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto">{children}</div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </MobileOnly>
  )
}

export default BottomSheetModal
