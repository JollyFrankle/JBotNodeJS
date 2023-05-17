// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: process.env['FB_APIKEY'],
  authDomain: process.env['FB_AUTHDOMAIN'],
  databaseURL: process.env['FB_DBURL'],
  projectId: process.env['FB_PROJECTID'],
  storageBucket: process.env['FB_STORAGEBUCKET'],
  messagingSenderId: process.env['FB_MSID'],
  appId: process.env['FB_APPID']
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//tambahkan code untuk menginisialisasikan Realtime Database
//dan mendapatkan referensi ke database tersebut
export const db = getDatabase(app);