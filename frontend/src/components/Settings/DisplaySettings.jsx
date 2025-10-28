import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import SettingSection from './SettingSection'

const defaultDisplayPreferences = {
  theme: 'light',
  items_per_page: 20,
  default_view: 'list'
}

const DisplaySettings = ({ preferences, onSave }) => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      ...defaultDisplayPreferences,
      ...(preferences || {})
    }
  })

  useEffect(() => {
    reset({
      ...defaultDisplayPreferences,
      ...(preferences || {})
    })
  }, [preferences, reset])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSave(data)
      toast.success('Display settings updated')
    } catch (error) {
      toast.error('Failed to update display settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingSection
      title="Display Settings"
      description="Customize how your CRM interface looks and behaves"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Theme */}
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
            Theme
          </label>
          <select
            id="theme"
            {...register('theme')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Choose your preferred color scheme
          </p>
        </div>

        {/* Items Per Page */}
        <div>
          <label htmlFor="items_per_page" className="block text-sm font-medium text-gray-700">
            Items Per Page
          </label>
          <select
            id="items_per_page"
            {...register('items_per_page', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Number of items to display per page in lists
          </p>
        </div>

        {/* Default View */}
        <div>
          <label htmlFor="default_view" className="block text-sm font-medium text-gray-700">
            Default View
          </label>
          <select
            id="default_view"
            {...register('default_view')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="list">List View</option>
            <option value="grid">Grid View</option>
            <option value="kanban">Kanban Board</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Your preferred view for leads and tasks
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={!isDirty || isLoading}
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm ${
              !isDirty || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </SettingSection>
  )
}

export default DisplaySettings
