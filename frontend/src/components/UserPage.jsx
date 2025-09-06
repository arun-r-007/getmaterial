"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { signOut } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"

import { User, Upload, Trash, LogOutIcon, Bookmark } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import SavedNotesContext from "./context/SavedNotesContext"

export default function UserPage() {
  const navigate = useNavigate()
  const [user] = useAuthState(auth)

  const { savedNotes, setSavedNotes } = useContext(SavedNotesContext);

  const [userNotes, setUserNotes] = useState([])
  const [savedNotesList, setSavedNotesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("saves")
  const [savingNotes, setSavingNotes] = useState(false)
  const [dataFetched, setDataFetched] = useState(false) // Flag to prevent refetching
  const [error, setError] = useState(null) // Error state for better error handling

  // Function to manually refresh data
  const refreshData = async () => {
    setDataFetched(false);
    setError(null);
    setLoading(true);
  };


  const getPDFPreviewUrl = (fileId) => {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  }

  const extractFileIdFromUrl = (url) => {
    const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/)
    return fileIdMatch ? fileIdMatch[1] : null
  }

  // Fetch user's uploaded notes directly from database
  const fetchUserUploadedNotes = async (userEmail) => {
    try {
      const notesCollection = collection(db, 'notes');
      const userNotesQuery = query(notesCollection, where('metadata.createdBy', '==', userEmail));
      const querySnapshot = await getDocs(userNotesQuery);
      
      const uploadedNotes = [];
      querySnapshot.forEach((doc) => {
        uploadedNotes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return uploadedNotes;
    } catch (error) {
      console.error("Error fetching user uploaded notes:", error);
      return [];
    }
  };

  // Fetch user's saved notes directly from database
  const fetchUserSavedNotes = async (userId) => {
    try {
      // First, get the list of saved note IDs
      const savedNotesRef = collection(db, "users", userId, "savedNotes");
      const savedNotesSnapshot = await getDocs(savedNotesRef);
      
      const savedNoteIds = [];
      const savedNotesMap = {};
      savedNotesSnapshot.forEach((doc) => {
        savedNoteIds.push(doc.id);
        savedNotesMap[doc.id] = true;
      });

      // Update the saved notes context
      setSavedNotes(savedNotesMap);

      if (savedNoteIds.length === 0) {
        return [];
      }

      // Then, fetch the actual note documents from the notes collection
      const notesCollection = collection(db, 'notes');
      const allNotesSnapshot = await getDocs(notesCollection);
      
      const savedNotesData = [];
      allNotesSnapshot.forEach((doc) => {
        if (savedNoteIds.includes(doc.id)) {
          savedNotesData.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      return savedNotesData;
    } catch (error) {
      console.error("Error fetching user saved notes:", error);
      return [];
    }
  };


  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (!isMounted || !user || dataFetched) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch both uploaded and saved notes concurrently
        const [uploadedNotes, savedNotesData] = await Promise.all([
          fetchUserUploadedNotes(user.email),
          fetchUserSavedNotes(user.uid)
        ]);

        if (isMounted) {
          setUserNotes(uploadedNotes);
          setSavedNotesList(savedNotesData);
          setDataFetched(true); // Mark data as fetched to prevent refetching
          console.log(`Fetched ${uploadedNotes.length} uploaded notes and ${savedNotesData.length} saved notes for user ${user.email}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setError("Failed to load your notes. Please try refreshing the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch when we have user and haven't fetched data yet
    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [user, dataFetched]);

  const handleViewNote = (noteUrl, noteId) => {
    if (!noteId || !noteUrl) {
      alert("Invalid Note ID or URL")
      return
    }
    const encodedUrl = encodeURIComponent(noteUrl)
    navigate(`/note?url=${encodedUrl}&id=${noteId}`)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDoc(doc(db, "notes", id))
        // Update local state to reflect the deletion
        setUserNotes((prevNotes) => prevNotes.filter((note) => note.id !== id))
        console.log(`Note with ID: ${id} has been deleted successfully.`)
      } catch (error) {
        console.error("Error deleting note:", error)
        alert("Error deleting note. Please try again.")
      }
    }
  }


  const handleUnsave = async (noteId) => {
    setSavingNotes(true);

    const confirmUnsave = window.confirm("Are you sure you want to unsave this note?");
    if (!confirmUnsave) {
      setSavingNotes(false);
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const noteRef = doc(db, "users", userId, "savedNotes", noteId);

      await deleteDoc(noteRef); // Remove from Firestore

      // Update local states
      setSavedNotesList((prev) => prev.filter((note) => note.id !== noteId));
      setSavedNotes((prev) => {
        const updated = { ...prev };
        delete updated[noteId];
        return updated;
      });

    } catch (error) {
      console.error("Error unsaving note:", error);
      alert("Error unsaving note. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };
  
  


  const NoteCardSkeleton = () => (
    <div className="bg-white p-5 rounded-xl overflow-hidden shadow-xl flex w-full flex-row justify-between">
      <div className="flex flex-col justify-between flex-grow">
        <Skeleton height={20} width={150} className="mb-4" />
        <Skeleton height={14} width={100} className="mb-2" />
        <Skeleton height={16} width={120} className="mb-2" />
        <Skeleton height={20} width={130} className="mb-2" />
        <Skeleton height={10} width={80} className="mb-4" />
        <div className="flex flex-row items-center gap-3">
          <Skeleton height={46} width={120} />
        </div>
      </div>
      <div className="flex flex-col items-center justify-between ml-4">
        <Skeleton height={192} width={160} className="rounded-lg" />
        <Skeleton height={20} width={100} className="mt-2" />
      </div>
    </div>
  )

  const renderNoteCard = (note) => (
    <div key={note.id} className="bg-white p-5 rounded-xl shadow-xl flex flex-row justify-between">
      <div className="flex flex-col justify-between">
        <h1 className="md:text-lg font-bold mb-2">
          <span className="group relative">{note.subject || "unknown"}</span>
        </h1>
        <p className="text-gray-600 mb-2">
          @<span className="text-gray-600 md:text-sm relative">{note.module || "unknown"}</span>
        </p>
        <p className="text-gray-600 mb-2">
          Semester:
          <span className="text-gray-600 md:text-sm text-center relative">{note.semester || "unknown"}</span>
        </p>
        <h2 className="mb-2 md:text-sm text-gray-600">Details: {note.name}</h2>
        <p className="text-gray-600 md:text-sm mb-4">
          Uploaded by:
          <span className="text-green-800 group md:text-sm font-semibold relative ml-1">
            {note.contributorName || "unknown"}
          </span>
        </p>
        <div className="flex flex-row justify-start w-full items-center gap-3">
          <button
            onClick={() => handleViewNote(note.fileUrl, note.id)}
            className="text-white bg-black py-2 text-center w-full text-xs md:text-base md:w-fit md:px-5 rounded-lg hover:rounded-2xl transition-all duration-300"
          >
            View Note
          </button>
          {activeTab === "saves" && (
            <div className="flex flex-row bg-gray-50 md:px-2 gap-1 p-1 rounded-lg md:hover:bg-gray-100 transition-all">
            <Bookmark
              size={20}
              style={{
                cursor: "pointer",
                marginRight: "0px",
                color: savedNotes[note.id] ? "red" : "black", // Instant UI toggle
              }}
              onClick={() => handleUnsave(note.id)}
              className={
                savedNotes[note.id]
                  ? "fill-red-500 rounded-md transition-all"
                  : "bg-transparent md:hover:fill-red-500  md:hover:scale-125 rounded-full transition-all"
              }
            />
          </div>
          )}

        </div>
      </div>
      <div className="flex flex-col items-center justify-between">
        <img
          onClick={() => handleViewNote(note.fileUrl, note.id)}
          src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl)) || "/placeholder.svg"}
          alt="PDF Preview"
          className="md:w-40 cursor-pointer hover:brightness-90 transition-all duration-300 md:h-48 w-28 h-36 object-cover rounded-lg ml-2 border-2 border-gray-300"
        />
        <div className="flex flex-row justify-around items-center w-full mt-2">
          {activeTab === "uploads" && (
            <div className="bg-slate-50 rounded-lg md:px-2 p-1 hover:bg-slate-200 hover:rounded-xl transition-all duration-300">
              <button onClick={() => handleDelete(note.id)}>
                <Trash size={20} className="text-red-500" />
              </button>
            </div>
          )}
          <p className="opacity-40 bottom-0">{note.uploadedAt.toDate().toLocaleDateString("en-GB")}</p>
        </div>
      </div>
    </div>
  )

  const handleSignOut = async () => {
    const userConfirmed = window.confirm("Are you sure you want to sign out?")
    if (userConfirmed) {
      try {
        await signOut(auth)
        navigate("/")
      } catch (error) {
        console.error("Error signing out:", error)
      }
    } else {
      console.log("Sign out canceled by the user.")
    }
  }

  return (
    <div className="min-h-screen">
      {/* Fixed sidebar */}
      <div className="fixed hidden md:flex flex-col justify-around left-0 top-10 px-3 h-screen w-64 bg-amber-50 shadow-lg z-10">
        <div className="p-4 mt-5">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-center">{user?.displayName || "User"}</h2>
            <p className="text-sm text-gray-600 text-center">{user?.email || "loading..."}</p>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("saves")}
              className={`w-full text-left p-2 rounded flex items-center ${activeTab === "saves" ? "bg-amber-100" : "hover:bg-slate-100"}`}
            >
              <Bookmark size={18} className="mr-2" /> Saved Notes
            </button>
            <button
              onClick={() => setActiveTab("uploads")}
              className={`w-full text-left p-2 rounded flex items-center ${activeTab === "uploads" ? "bg-amber-100" : "hover:bg-slate-100"}`}
            >
              <Upload size={18} className="mr-2" /> Your Uploads
            </button>
          </nav>
        </div>
        <div
          className="px-4 ml-2 py-2 text-red-500 flex justify-start items-center rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOutIcon size={16} className="mr-2" />
          <p>Log out</p>
        </div>
      </div>

      <div className="md:hidden flex mt-20 justify-between items-center p-4 bg-amber-50 shadow-sm">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`p-2 rounded flex items-center ${activeTab === "uploads" ? "bg-amber-100" : "hover:bg-slate-100"}`}
        >
          <Upload size={18} className="mr-2" /> Your Uploads
        </button>
        <button
          onClick={() => setActiveTab("saves")}
          className={`p-2 rounded flex items-center ${activeTab === "saves" ? "bg-amber-100" : "hover:bg-slate-100"}`}
        >
          <Bookmark size={18} className="mr-2" /> Saved Notes
        </button>
      </div>

      {/* Main content - Fixed width container */}
      <div className="md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 md:mt-20">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={refreshData}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">{activeTab === "uploads" ? "Your Uploads" : "Saved Notes"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <NoteCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6">{activeTab === "uploads" ? "Your Uploads" : "Saved Notes"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === "uploads" ? (
                  userNotes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">You haven't uploaded any notes yet.</p>
                  ) : (
                    userNotes.map(renderNoteCard)
                  )
                ) : savedNotesList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">You haven't saved any notes yet.</p>
                ) : (
                  savedNotesList.map(renderNoteCard)
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {savingNotes && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-all z-50">
          <h1 className="loader3 "></h1>
        </div>
      )}
    </div>
  )
}

