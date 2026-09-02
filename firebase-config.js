const firebaseConfig = {
  apiKey: "AIzaSyDpLnqA_raNZZ2xl1QEqLMJstbA1qAqpTM",
  authDomain: "ahlam-stor.firebaseapp.com",
  projectId: "ahlam-stor",
  storageBucket: "ahlam-stor.firebasestorage.app",
  messagingSenderId: "801828075896",
  appId: "1:801828075896:web:a31273b3c78d45d7cc708d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const WHATSAPP_NUMBER = "970592936150";

// ⚠️ إعدادات Cloudinary لرفع الصور (بديل أسرع من حفظها داخل قاعدة البيانات)
const CLOUDINARY_CLOUD_NAME = "heqkzarp";
const CLOUDINARY_UPLOAD_PRESET = "ahlam-store";
