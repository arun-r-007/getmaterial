
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    query,
    serverTimestamp, 
    orderBy  // Add this import
  } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBShbEHeY2aPY2sx8NDoFrqqBtMztEVuzQ",
    authDomain: "material-web-app-5af17.firebaseapp.com",
    projectId: "material-web-app-5af17",
    storageBucket: "material-web-app-5af17.firebasestorage.app",
    messagingSenderId: "366377409289",
    appId: "1:366377409289:web:31371992ec5ec4e8fb91d8",
    measurementId: "G-WG5LX7Z162"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const addNote = async (noteData) => {
    try {
        // Validate input
        if (!auth.currentUser) {
            throw new Error('User must be authenticated to add a note');
        }

        // Ensure all required fields are present
        if (!noteData.name || !noteData.semester || !noteData.subject) {
            throw new Error('Missing required note details');
        }

        const notesCollection = collection(db, 'notes');
        const docRef = await addDoc(notesCollection, {
            ...noteData,
            uploadedBy: auth.currentUser.uid, // Explicitly add user ID
            uploadedAt: serverTimestamp(), // Use server-side timestamp
            metadata: {
                createdBy: auth.currentUser.email, // Optional: add email for reference
                createdAt: new Date().toISOString()
            }
        });

        console.log('Note added with ID: ', docRef.id);
        return docRef;
    } catch (error) {
        console.error("Error adding note: ", error);
        
        // More detailed error handling
        if (error.code === 'permission-denied') {
            console.error('Permission denied. Check Firestore security rules.');
        }
        
        throw error;
    }
};

// Function to get all notes
const getNotes = async () => {
    try {
        const notesCollection = collection(db, 'notes');
        const q = query(notesCollection, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching notes: ", error);
        throw error;
    }
};



const handleLike = async (noteId) => {
    if (!auth.currentUser) {
        alert("Please sign in to vote!");
        return;
    }

    const userId = auth.currentUser.uid;
    const noteRef = doc(db, "notes", noteId);
    const likeRef = doc(collection(noteRef, "likes"), userId); // User's like reference

    try {
        const likeSnap = await getDoc(likeRef);

        if (likeSnap.exists()) {
            // If user already liked, remove like
            await deleteDoc(likeRef);
            await updateDoc(noteRef, { likes: increment(-1) });
            console.log(`User ${userId} removed like from note ${noteId}`);
        } else {
            // If user hasn't liked, add like
            await setDoc(likeRef, { liked: true });
            await updateDoc(noteRef, { likes: increment(1) });
            console.log(`User ${userId} liked note ${noteId}`);
        }
    } catch (error) {
        console.error("Error updating like:", error);
    }
};

/**
 * Fetches the like status for a note.
 */
const getUserLikeStatus = async (noteId) => {
    if (!auth.currentUser) return false;

    const likeRef = doc(collection(doc(db, "notes", noteId), "likes"), auth.currentUser.uid);
    const likeSnap = await getDoc(likeRef);
    
    return likeSnap.exists();
};




export { 
    auth, 
    db, 
    addNote, 
    getNotes ,
    handleLike, 
    getUserLikeStatus
};