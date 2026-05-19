import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD3CTrpzVAV4Wu05VGhITXwWpryd-Djk54',
  authDomain: 'backyard-pizza.firebaseapp.com',
  projectId: 'backyard-pizza',
  storageBucket: 'backyard-pizza.firebasestorage.app',
  messagingSenderId: '795840417546',
  appId: '1:795840417546:web:b15f564f37ea00cebf74f3',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
