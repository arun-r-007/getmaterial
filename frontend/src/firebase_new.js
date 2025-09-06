import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { normalizeForStorage } from "./lib/utils";

import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    query,
    orderBy, 
    limit, 
    where, 
    startAfter, 
    serverTimestamp, 
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
            subject: normalizeForStorage(noteData.subject), // Store subject in lowercase
            module: normalizeForStorage(noteData.module), // Store module in lowercase
            contributorName: noteData.contributorName, // Keep contributor name as-is
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

// Function to get notes with pagination and filtering
const getNotesWithPagination = async (pageSize = 10, lastDocSnapshot = null, filters = {}) => {
    try {
        const notesCollection = collection(db, 'notes');
        let constraints = [orderBy('uploadedAt', 'desc')];

        // Add filter constraints if provided
        if (filters.semester && filters.semester !== '') {
            constraints.push(where('semester', '==', filters.semester));
        }
        if (filters.subject && filters.subject !== '') {
            constraints.push(where('subject', '==', filters.subject));
        }
        if (filters.module && filters.module !== '') {
            constraints.push(where('module', '==', filters.module));
        }
        if (filters.contributorName && filters.contributorName !== '') {
            constraints.push(where('contributorName', '==', filters.contributorName));
        }

        // Add pagination
        if (lastDocSnapshot) {
            constraints.push(startAfter(lastDocSnapshot));
        }
        constraints.push(limit(pageSize));

        const q = query(notesCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        
        const notes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            subject: doc.data().subject || '', // Keep stored lowercase value
            module: doc.data().module || '' // Keep stored lowercase value
        }));

        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        const hasMore = querySnapshot.docs.length === pageSize;

        return {
            notes,
            lastDocSnapshot: lastDoc,
            hasMore
        };
    } catch (error) {
        console.error("Error fetching notes with pagination: ", error);
        throw error;
    }
};

// Function to get all notes with filters (no pagination - for filtered results)
const getAllNotesWithFilters = async (filters = {}, searchTerm = '') => {
    try {
        const notesCollection = collection(db, 'notes');
        let constraints = [orderBy('uploadedAt', 'desc')];

        // For better filtering, we'll fetch all notes and do client-side filtering
        // This ensures case-insensitive matching and better search functionality
        const q = query(notesCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        
        let notes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            subject: doc.data().subject || '', // Keep stored lowercase value
            module: doc.data().module || '' // Keep stored lowercase value
        }));

        // Apply filters client-side with lowercase comparison
        if (filters.semester && filters.semester !== '') {
            notes = notes.filter(note => 
                note.semester && note.semester.toString() === filters.semester.toString()
            );
        }
        
        if (filters.subject && filters.subject !== '') {
            const normalizedSubject = normalizeForStorage(filters.subject);
            notes = notes.filter(note => 
                normalizeForStorage(note.subject) === normalizedSubject
            );
        }
        
        if (filters.module && filters.module !== '') {
            const normalizedModule = normalizeForStorage(filters.module);
            notes = notes.filter(note => 
                normalizeForStorage(note.module) === normalizedModule
            );
        }
        
        if (filters.contributorName && filters.contributorName !== '') {
            notes = notes.filter(note => 
                note.contributorName && note.contributorName.trim() === filters.contributorName.trim()
            );
        }

        // Client-side filtering for search if search term is provided
        if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            notes = notes.filter(note => 
                (note.subject?.toLowerCase() || '').includes(searchLower) ||
                (note.contributorName?.toLowerCase() || '').includes(searchLower) ||
                (note.name?.toLowerCase() || '').includes(searchLower)
            );
        }

        return {
            notes,
            lastDocSnapshot: null,
            hasMore: false // No pagination for filtered results
        };
    } catch (error) {
        console.error("Error fetching all filtered notes: ", error);
        throw error;
    }
};

// Function to get initial notes (first 9)
const getInitialNotes = async () => {
    return await getNotesWithPagination(9, null, {});
};

// Function to search notes by title/contributor name
const searchNotes = async (searchTerm, pageSize = 20, lastDocSnapshot = null) => {
    try {
        const notesCollection = collection(db, 'notes');
        let constraints = [orderBy('uploadedAt', 'desc')];

        // Note: Firestore doesn't support contains queries easily, so we'll do this client-side
        // For now, we'll fetch more data and filter on client side for search
        if (lastDocSnapshot) {
            constraints.push(startAfter(lastDocSnapshot));
        }
        constraints.push(limit(pageSize * 3)); // Fetch more to compensate for client-side filtering

        const q = query(notesCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        
        let allNotes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            subject: doc.data().subject || '', // Keep stored lowercase value
            module: doc.data().module || '' // Keep stored lowercase value
        }));

        // Client-side filtering for search
        if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            allNotes = allNotes.filter(note => 
                (note.subject?.toLowerCase() || '').includes(searchLower) ||
                (note.contributorName?.toLowerCase() || '').includes(searchLower) ||
                (note.name?.toLowerCase() || '').includes(searchLower)
            );
        }

        // Take only the requested page size
        const notes = allNotes.slice(0, pageSize);
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        const hasMore = querySnapshot.docs.length === pageSize * 3;

        return {
            notes,
            lastDocSnapshot: lastDoc,
            hasMore: hasMore && notes.length === pageSize
        };
    } catch (error) {
        console.error("Error searching notes: ", error);
        throw error;
    }
};

// Function to get unique filter values (for dropdowns)
const getFilterOptions = async () => {
    try {
        const notesCollection = collection(db, 'notes');
        const q = query(notesCollection, orderBy('uploadedAt', 'desc'), limit(1000)); // Limit to reduce load
        const querySnapshot = await getDocs(q);
        
        const notes = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            subject: doc.data().subject || '', // Keep stored value
            module: doc.data().module || '' // Keep stored value
        }));
        
        const semesters = [...new Set(notes.map(note => note.semester).filter(Boolean))];
        
        // Deduplicate subjects by normalizing to lowercase
        const subjectMap = new Map();
        notes.forEach(note => {
            if (note.subject) {
                const normalizedSubject = normalizeForStorage(note.subject);
                if (!subjectMap.has(normalizedSubject)) {
                    subjectMap.set(normalizedSubject, normalizedSubject); // Store the normalized version
                }
            }
        });
        const subjects = Array.from(subjectMap.values());
        
        // Deduplicate modules by normalizing to lowercase
        const moduleMap = new Map();
        notes.forEach(note => {
            if (note.module) {
                const normalizedModule = normalizeForStorage(note.module);
                if (!moduleMap.has(normalizedModule)) {
                    moduleMap.set(normalizedModule, normalizedModule); // Store the normalized version
                }
            }
        });
        const modules = Array.from(moduleMap.values());
        
        return {
            semesters: semesters.sort(),
            subjects: subjects.sort(), // Already normalized to lowercase
            modules: modules.sort() // Already normalized to lowercase
        };
    } catch (error) {
        console.error("Error fetching filter options: ", error);
        throw error;
    }
};

// Function to get total notes count
const getTotalNotesCount = async () => {
    try {
        const notesCollection = collection(db, 'notes');
        const querySnapshot = await getDocs(notesCollection);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error getting total notes count: ", error);
        return 0;
    }
};

// Function to get all notes (keeping for backward compatibility)
const getNotes = async () => {
    try {
        const notesCollection = collection(db, 'notes');
        const q = query(notesCollection, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            subject: doc.data().subject || '', // Keep stored lowercase value
            module: doc.data().module || '' // Keep stored lowercase value
        }));
    } catch (error) {
        console.error("Error fetching notes: ", error);
        throw error;
    }
};

export { 
    auth, 
    db, 
    addNote, 
    getNotes,
    getNotesWithPagination,
    getInitialNotes,
    searchNotes,
    getFilterOptions,
    getTotalNotesCount,
    getAllNotesWithFilters
};
