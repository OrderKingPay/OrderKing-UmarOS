import type { MessageTree } from "./en";
import { en } from "./en";

export const hi: MessageTree = {
  ...en,
  app: {
    ...en.app,
    name: "ऑर्डर किंग पार्टनर",
    tagline: "आपकी रसोई। आपके ऑर्डर्स। आपका सेटलमेंट।",
  },
  nav: {
    ...en.nav,
    home: "होम",
    orders: "ऑर्डर्स",
    kitchen: "किचन",
    menu: "मेनू",
    more: "अधिक",
    settings: "सेटिंग्स",
  },
  common: {
    ...en.common,
    save: "सहेजें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    loading: "लोड हो रहा है...",
  },
};
