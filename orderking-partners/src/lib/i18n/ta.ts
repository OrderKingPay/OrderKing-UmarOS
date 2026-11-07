import type { MessageTree } from "./en";
import { en } from "./en";

export const ta: MessageTree = {
  ...en,
  app: {
    ...en.app,
    name: "ஆர்டர் கிங் பார்ட்னர்",
    tagline: "வணிகர் செயல்பாடுகள்",
  },
  nav: {
    ...en.nav,
    home: "முகப்பு",
    orders: "ஆர்டர்கள்",
    kitchen: "சமையலறை",
    menu: "மெனு",
    more: "மேலும்",
    settings: "அமைப்புகள்",
  },
  common: {
    ...en.common,
    save: "சேமி",
    cancel: "ரத்துசெய்",
    confirm: "உறுதிப்படுத்து",
    loading: "ஏற்றுகிறது...",
  },
};
