import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// إعدادات مشروع Firebase (نفس الإعدادات المستخدمة في النظام الثاني)
const firebaseConfig = {
  apiKey: "AIzaSyAkAvNzeQFOLltzTStkXFOfY06FXHSh8r4",
  authDomain: "smartexam-88ca5.firebaseapp.com",
  projectId: "smartexam-88ca5",
  storageBucket: "smartexam-88ca5.firebasestorage.app",
  messagingSenderId: "287974080178",
  appId: "1:287974080178:web:e4c66aa8c251dd518293ab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
