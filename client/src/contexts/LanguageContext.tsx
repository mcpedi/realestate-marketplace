import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "sw";
type TranslationKey = keyof typeof messages.en;

const messages = {
  en: {
    "nav.home": "Home", "nav.explore": "Explore", "nav.map": "Map Search", "nav.assistant": "AI Assistant", "nav.browse": "Browse Properties", "nav.mapDiscovery": "Map Discovery", "nav.planning": "Planning Studio", "nav.operations": "Property Operations", "nav.agentOperations": "Agent Operations", "nav.propertyIds": "Property IDs", "nav.swipe": "Swipe Discovery", "nav.compare": "Compare Properties", "nav.alerts": "Property Alerts", "nav.viewings": "My Viewings", "nav.about": "About Us", "nav.guides": "Property Guides", "nav.addProperty": "Add Property", "nav.saved": "Saved", "nav.profile": "Profile", "language.label": "Language",
  },
  sw: {
    "nav.home": "Nyumbani", "nav.explore": "Tafuta", "nav.map": "Ramani", "nav.assistant": "Msaidizi wa AI", "nav.browse": "Tazama Mali", "nav.mapDiscovery": "Tafuta kwa Ramani", "nav.planning": "Mipango", "nav.operations": "Usimamizi wa Mali", "nav.agentOperations": "Usimamizi wa Wakala", "nav.propertyIds": "Vitambulisho vya Mali", "nav.swipe": "Gundua kwa Kutelezesha", "nav.compare": "Linganisha Mali", "nav.alerts": "Tahadhari za Mali", "nav.viewings": "Miadi Yangu", "nav.about": "Kutuhusu", "nav.guides": "Miongozo ya Mali", "nav.addProperty": "Ongeza Mali", "nav.saved": "Zilizohifadhiwa", "nav.profile": "Wasifu", "language.label": "Lugha",
  },
} as const;

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "nyumba-360-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return window.localStorage.getItem(STORAGE_KEY) === "sw" ? "sw" : "en"; } catch { return "en"; }
  });
  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, language); document.documentElement.lang = language === "sw" ? "sw" : "en"; } catch { /* storage can be unavailable */ } }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => messages[language][key] ?? messages.en[key] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
