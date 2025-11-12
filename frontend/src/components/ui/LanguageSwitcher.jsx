import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { supportedLanguages } from "../../i18n/config";
import i18n from "../../i18n";

const LanguageSwitcher = ({ className = "" }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("sakha-language") || "en"
  );

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem("sakha-language", langCode);
  };

  const languageEntries = Object.entries(supportedLanguages);

  return (
    <Menu as="div" className={`relative ${className}`}>
      <Menu.Button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <GlobeAltIcon className="h-5 w-5" />
        <span className="hidden sm:inline">
          {supportedLanguages[currentLanguage]?.nativeName || "English"}
        </span>
        <span className="text-lg">
          {supportedLanguages[currentLanguage]?.flag || "🇺🇸"}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1 max-h-64 overflow-y-auto">
            {languageEntries.map(([code, lang]) => (
              <Menu.Item key={code}>
                {({ active }) => (
                  <button
                    onClick={() => handleLanguageChange(code)}
                    className={`${
                      active ? "bg-gray-100" : ""
                    } ${
                      currentLanguage === code ? "bg-blue-50" : ""
                    } flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-medium">{lang.nativeName}</div>
                        <div className="text-xs text-gray-500">{lang.name}</div>
                      </div>
                    </div>
                    {currentLanguage === code && (
                      <CheckIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default LanguageSwitcher;
