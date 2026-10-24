import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    process.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCp7HtG82WvmqjqMSg3COQuAIfrmdMvN4A",
  authDomain:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "orderkingpay.firebaseapp.com",
  projectId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    "orderkingpay",
  storageBucket:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "orderkingpay.firebasestorage.app",
  messagingSenderId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "446957899969",
  appId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    process.env.VITE_FIREBASE_APP_ID ||
    "1:446957899969:web:4d093d23d5da6889e1c440",
  measurementId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) ||
    process.env.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-HMNVNZ3Y8T",
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Initializes an invisible reCAPTCHA verifier tied to a DOM button or container ID.
 */
export function createInvisibleRecaptcha(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved silently
    },
  });
}

/**
 * Dispatches an authentic cellular SMS OTP across Indian telecom towers (Jio, Airtel, Vi, BSNL)
 * via Google Firebase Phone Authentication (10,000 monthly free quota).
 */
export async function sendFirebasePhoneOtp(
  phone10Digits: string,
  appVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const e164 = `+91${phone10Digits.replace(/\D/g, "").slice(-10)}`;
  return await signInWithPhoneNumber(auth, e164, appVerifier);
}
