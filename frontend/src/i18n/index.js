import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { supportedLanguages, defaultLanguage, fallbackLanguage, namespaces } from "./config";

// Import translation files
import en_common from "./locales/en/common.json";
import en_navigation from "./locales/en/navigation.json";
import en_dashboard from "./locales/en/dashboard.json";
import en_leads from "./locales/en/leads.json";
import en_activities from "./locales/en/activities.json";
import en_tasks from "./locales/en/tasks.json";
import en_pipeline from "./locales/en/pipeline.json";
import en_reports from "./locales/en/reports.json";
import en_users from "./locales/en/users.json";
import en_auth from "./locales/en/auth.json";
import en_errors from "./locales/en/errors.json";
import en_emails from "./locales/en/emails.json";

// Initialize translations object
const resources = {
  en: {
    common: en_common,
    navigation: en_navigation,
    dashboard: en_dashboard,
    leads: en_leads,
    activities: en_activities,
    tasks: en_tasks,
    pipeline: en_pipeline,
    reports: en_reports,
    users: en_users,
    auth: en_auth,
    errors: en_errors,
    emails: en_emails,
  },
};

// Add other languages (hi, ta, te, bn, mr) as they are created
// For now, they fall back to English

i18n
  .use({
    type: "languageDetector",
    async: true,
    detect: (callback) => {
      // Get saved language from localStorage
      const savedLanguage = localStorage.getItem("sakha-language");

      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Detect from browser
      const browserLanguage = navigator.language.split("-")[0];

      // Check if browser language is supported
      if (supportedLanguages[browserLanguage]) {
        callback(browserLanguage);
        return;
      }

      // Default to English
      callback(defaultLanguage);
    },
    init: () => {},
    cacheUserLanguage: (lng) => {
      localStorage.setItem("sakha-language", lng);
    },
  })
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: fallbackLanguage,
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "sakha-language",
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
