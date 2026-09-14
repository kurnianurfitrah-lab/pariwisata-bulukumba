import { useState, useRef, useCallback, useEffect } from "react";
import { GlobeAltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const getLanguageFromCookie = () => {
  const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
  return match?.[1] || "id"; // fallback ke "id" (Bahasa Indonesia)
};

const TranslateWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  ];

  const handleLanguageChange = useCallback(async (langCode) => {
    setIsTranslating(true);
    try {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event("change"));
      }

      setSelectedLanguage(langCode);
      setIsOpen(false);
    } catch (err) {
      console.log(err);
      setError("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const currentLanguage =
    languages.find((lang) => lang.code === selectedLanguage) || languages[0];

  useEffect(() => {
    const langCode = getLanguageFromCookie();
    setSelectedLanguage(langCode);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
      >
        <div className="flex items-center gap-2">
          <GlobeAltIcon className="w-4 h-4 text-base-content/70" />
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-base-content leading-none">
                {currentLanguage.name}
              </span>
            </div>
          </span>
          <ChevronDownIcon className={`w-3.5 h-3.5 text-base-content/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 sm:left-auto mt-2 w-64 bg-base-100 border border-base-content/10 rounded-box shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-base-200 focus:bg-base-200 focus:outline-none transition-colors duration-150 flex items-center gap-3 ${
                  selectedLanguage === language.code
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-base-content"
                }`}
                disabled={isTranslating}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="flex-1">{language.name}</span>
                {selectedLanguage === language.code && (
                  <span className="text-primary font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isTranslating && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-100/80 rounded-box backdrop-blur-sm">
          <span className="loading loading-spinner loading-sm text-primary"></span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 text-xs text-error bg-error/10 px-3 py-2 rounded-box border border-error/20">
          {error}
        </div>
      )}
    </div>
  );
};

export default TranslateWidget;
