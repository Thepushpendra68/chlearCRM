import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import SettingSection from './SettingSection'

const defaultRegionalPreferences = {
  timezone: 'UTC',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  language: 'en'
}

const RegionalSettings = ({ preferences, user, onSave }) => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      ...defaultRegionalPreferences,
      ...(preferences || {}),
      ...(user
        ? {
            timezone: user.timezone || defaultRegionalPreferences.timezone,
            language: user.language || defaultRegionalPreferences.language
          }
        : {})
    }
  })

  useEffect(() => {
    reset({
      ...defaultRegionalPreferences,
      ...(preferences || {}),
      ...(user
        ? {
            timezone: user.timezone || defaultRegionalPreferences.timezone,
            language: user.language || defaultRegionalPreferences.language
          }
        : {})
    })
  }, [preferences, user, reset])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSave(data)
      toast.success('Regional settings updated')
    } catch (error) {
      toast.error('Failed to update regional settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingSection
      title="Language & Regional Settings"
      description="Set your timezone, date format, and language preferences"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Denver">Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="America/Phoenix">Arizona</option>
            <option value="America/Anchorage">Alaska</option>
            <option value="Pacific/Honolulu">Hawaii</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Europe/Berlin">Berlin</option>
            <option value="Asia/Dubai">Dubai</option>
            <option value="Asia/Kolkata">India Standard Time</option>
            <option value="Asia/Shanghai">China Standard Time</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Your timezone affects how dates and times are displayed
          </p>
        </div>

        {/* Date Format */}
        <div>
          <label htmlFor="date_format" className="block text-sm font-medium text-gray-700">
            Date Format
          </label>
          <select
            id="date_format"
            {...register('date_format')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Choose how dates are displayed throughout the application
          </p>
        </div>

        {/* Time Format */}
        <div>
          <label htmlFor="time_format" className="block text-sm font-medium text-gray-700">
            Time Format
          </label>
          <select
            id="time_format"
            {...register('time_format')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="12h">12-hour (3:30 PM)</option>
            <option value="24h">24-hour (15:30)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Choose between 12-hour and 24-hour time format
          </p>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            {...register('language')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            disabled
          >
            <option value="en">English</option>
            <option value="es">Spanish (Coming Soon)</option>
            <option value="fr">French (Coming Soon)</option>
            <option value="de">German (Coming Soon)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Additional language support coming soon
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

export default RegionalSettings
