import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import et from "./locales/et.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import fi from "./locales/fi.json";
import sv from "./locales/sv.json";
import da from "./locales/da.json";
import no from "./locales/no.json";
import pl from "./locales/pl.json";
import lv from "./locales/lv.json";
import lt from "./locales/lt.json";

const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE || "et";

i18n.use(initReactI18next).init({
  resources: {
    et: { translation: et },
    en: { translation: en },
    de: { translation: de },
    fi: { translation: fi },
    sv: { translation: sv },
    da: { translation: da },
    no: { translation: no },
    pl: { translation: pl },
    lv: { translation: lv },
    lt: { translation: lt },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
