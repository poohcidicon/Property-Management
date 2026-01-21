import { useLanguageStore } from "@/app/select-language";
import en from "@/language/en.json";
import th from "@/language/th.json";

export function useSelectLanguage() {
  const { language, setLanguage } = useLanguageStore();

  const locale = language === "th" ? th : en;

  return {
    language,
    setLanguage,
    locale,
  }
}
