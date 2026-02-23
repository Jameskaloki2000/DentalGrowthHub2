// Firebase Configuration for Dental Growth Hub
// Project: dental-growth-hub
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBccWzGYs64eW6V-Fr4czFu8LqEBAFYtGc",
    authDomain: "dental-growth-hub.firebaseapp.com",
    projectId: "dental-growth-hub",
    storageBucket: "dental-growth-hub.firebasestorage.app",
    messagingSenderId: "106729533387",
    appId: "1:106729533387:web:edd0b1a41c7136dc91904e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Fetch all VSL videos from Firestore
 * Collection: vsl-videos
 * Document structure:
 *   - title: string (e.g., "Hero VSL" or "Pre-Call Preparation")
 *   - url: string (YouTube/Vimeo/direct video URL)
 *   - placement: string ("hero" | "thankyou")
 *   - thumbnail: string (optional thumbnail URL)
 *   - active: boolean
 *   - createdAt: timestamp
 */
async function getVSLVideos() {
    const videosRef = collection(db, "vsl-videos");
    const snapshot = await getDocs(videosRef);
    const videos = [];
    snapshot.forEach((doc) => {
        videos.push({ id: doc.id, ...doc.data() });
    });
    return videos;
}

/**
 * Fetch a specific VSL video by its placement location
 * @param {string} placement - "hero" or "thankyou"
 */
async function getVSLByPlacement(placement) {
    const videos = await getVSLVideos();
    return videos.find(v => v.placement === placement && v.active === true) || null;
}

export { db, getVSLVideos, getVSLByPlacement };
