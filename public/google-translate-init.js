window.googleTranslateElementInit = function googleTranslateElementInit() {
  if (!window.google?.translate?.TranslateElement) return;

  new window.google.translate.TranslateElement(
    { pageLanguage: 'id', includedLanguages: 'id,en' },
    'google_translate_element'
  );
};

