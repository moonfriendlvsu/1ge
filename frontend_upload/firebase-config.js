// Firebase Configuration for 1=GE
// Project: ge-company

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDKmaJATjfIDfV7VJiISLb6qHp0y3Km4iw",
    authDomain: "ge-company.firebaseapp.com",
    projectId: "ge-company",
    storageBucket: "ge-company.firebasestorage.app",
    messagingSenderId: "845786400154",
    appId: "1:845786400154:web:c170eda08b86a9876e2623",
    measurementId: "G-XFP26ZDCJH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other modules
export {
    app,
    auth,
    db,
    // Auth functions
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    // Firestore functions
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    serverTimestamp,
    Timestamp
};

