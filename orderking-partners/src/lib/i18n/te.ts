import type { MessageTree } from "./en";
import { en } from "./en";

export const te: MessageTree = {
  ...en,
  app: {
    ...en.app,
    name: "ఆర్డర్ కింగ్ భాగస్వామి",
    tagline: "మీ వంటగది. మీ ఆర్డర్లు. మీ సెటిల్మెంట్.",
  },
  nav: {
    ...en.nav,
    home: "హోమ్",
    orders: "ఆర్డర్లు",
    kitchen: "వంటగది",
    menu: "మెనూ",
    more: "మరిన్ని",
    settings: "సెట్టింగులు",
  },
  common: {
    ...en.common,
    save: "సేవ్ చేయండి",
    cancel: "రద్దు చేయండి",
    confirm: "నిర్ధారించండి",
    loading: "లోడ్ అవుతోంది...",
  },
};
