import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDwsiHLqeq8dgYB90GsoiTak17L8g0kEoU",
  authDomain: "closercademy-0qtmag.firebaseapp.com",
  databaseURL: "https://closercademy-0qtmag-default-rtdb.firebaseio.com",
  projectId: "closercademy-0qtmag",
  storageBucket: "closercademy-0qtmag.appspot.com",
  messagingSenderId: "346459143041",
  appId: "1:346459143041:web:f0e543fe2bcb7f25110680"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);