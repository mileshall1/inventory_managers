// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBteiMJPevCjtPiZQM2URHyCoGLRwllRmo",
  authDomain: "inventory-management-19f5d.firebaseapp.com",
  projectId: "inventory-management-19f5d",
  storageBucket: "inventory-management-19f5d.appspot.com",
  messagingSenderId: "900807781097",
  appId: "1:900807781097:web:66e8c92f56693b1e771e78",
  measurementId: "G-7400XZM4GV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export{firestore}