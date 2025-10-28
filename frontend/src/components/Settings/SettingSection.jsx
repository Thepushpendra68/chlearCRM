const SettingSection = ({ title, description, children }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

export default SettingSection
