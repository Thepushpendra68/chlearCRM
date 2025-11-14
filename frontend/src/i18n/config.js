// i18n Configuration
export const supportedLanguages = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  hi: { name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  ta: { name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  te: { name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  bn: { name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  mr: { name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
};

export const defaultLanguage = "en";

export const fallbackLanguage = "en";

export const namespaces = [
  "common",
  "navigation",
  "dashboard",
  "leads",
  "activities",
  "tasks",
  "pipeline",
  "reports",
  "users",
  "auth",
  "errors",
  "emails",
];

export const languageDetector = {
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
};
