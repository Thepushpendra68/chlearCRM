import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import SettingSection from './SettingSection'

const defaultNotificationPreferences = {
  email_notifications: true,
  email_lead_assigned: true,
  email_lead_updated: false,
  email_task_assigned: true,
  email_task_due: true,
  email_daily_digest: false,
  email_weekly_digest: false,
  in_app_notifications: true
}

const NotificationSettings = ({ preferences, onSave }) => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      ...defaultNotificationPreferences,
      ...(preferences || {})
    }
  })

  useEffect(() => {
    reset({
      ...defaultNotificationPreferences,
      ...(preferences || {})
    })
  }, [preferences, reset])

  const emailNotifications = watch('email_notifications')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSave(data)
      toast.success('Notification settings updated')
    } catch (error) {
      toast.error('Failed to update notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const ToggleSwitch = ({ name, label, description, disabled = false }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-start justify-between py-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => field.onChange(!field.value)}
            className={`${
              field.value ? 'bg-primary-600' : 'bg-gray-200'
            } ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
          >
            <span className="sr-only">{label}</span>
            <span
              aria-hidden="true"
              className={`${
                field.value ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      )}
    />
  )

  return (
    <SettingSection
      title="Notification Settings"
      description="Manage how and when you receive notifications"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-1 divide-y divide-gray-200">
        {/* Master Email Toggle */}
        <ToggleSwitch
          name="email_notifications"
          label="Email Notifications"
          description="Receive notifications via email"
        />

        {/* Email Notification Options */}
        <div className="space-y-1 pl-4">
          <ToggleSwitch
            name="email_lead_assigned"
            label="Lead Assigned"
            description="When a lead is assigned to you"
            disabled={!emailNotifications}
          />
          <ToggleSwitch
            name="email_lead_updated"
            label="Lead Updated"
            description="When a lead you're following is updated"
            disabled={!emailNotifications}
          />
          <ToggleSwitch
            name="email_task_assigned"
            label="Task Assigned"
            description="When a task is assigned to you"
            disabled={!emailNotifications}
          />
          <ToggleSwitch
            name="email_task_due"
            label="Task Due Soon"
            description="Reminder when tasks are due within 24 hours"
            disabled={!emailNotifications}
          />
          <ToggleSwitch
            name="email_daily_digest"
            label="Daily Digest"
            description="Summary of your daily activities"
            disabled={!emailNotifications}
          />
          <ToggleSwitch
            name="email_weekly_digest"
            label="Weekly Digest"
            description="Weekly summary of your performance"
            disabled={!emailNotifications}
          />
        </div>

        {/* In-App Notifications */}
        <ToggleSwitch
          name="in_app_notifications"
          label="In-App Notifications"
          description="Show notifications within the application"
        />

        {/* Save Button */}
        <div className="flex justify-end pt-6">
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

export default NotificationSettings
