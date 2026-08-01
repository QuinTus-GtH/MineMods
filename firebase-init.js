  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, deleteUser, sendPasswordResetEmail
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  import {
    getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, onSnapshot, arrayUnion, arrayRemove, increment
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDlMeyunjoO1ZFQO883dTiRxkGCPk6iHiE",
    authDomain: "minemods-8d14a.firebaseapp.com",
    projectId: "minemods-8d14a",
    storageBucket: "minemods-8d14a.firebasestorage.app",
    messagingSenderId: "85414226347",
    appId: "1:85414226347:web:5c7470ed4d34d06c0ecaee"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseFn = {
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, deleteUser, sendPasswordResetEmail,
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, onSnapshot, arrayUnion, arrayRemove, increment
  };
  window.firebaseReady = true;
  window.dispatchEvent(new Event('firebase-ready'));
