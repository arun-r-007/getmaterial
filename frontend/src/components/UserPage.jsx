
import { useState, useEffect } from "react"
import { db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";


import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  increment,
  orderBy,
  getFirestore,
} from "firebase/firestore"

import { Heart, MessageCircle, User, Upload, ThumbsUp, Trash, LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export default function UserPage() {
  const [userNotes, setUserNotes] = useState([])
  const [likedNotes, setLikedNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("uploads")
  const [isLiked, setIsLiked] = useState({})
  const navigate = useNavigate()

  // const user = auth.currentUser;


  const [user] = useAuthState(auth);



  const getPDFPreviewUrl = (fileId) => {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  }

  const extractFileIdFromUrl = (url) => {
    const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/)
    return fileIdMatch ? fileIdMatch[1] : null
  }



  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {

      if (!isMounted) return;


      try {
        setLoading(true)

        // Fetch user's uploaded notes
        const notesQuery = query(collection(db, "notes"), where("metadata.createdBy", "==", user.email), orderBy('uploadedAt', 'desc'))
        const notesSnapshot = await getDocs(notesQuery)
        const uploadedNotes = notesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Fetch user's liked notes
        const userLikesQuery = collection(db, "notes")
        const allNotesSnapshot = await getDocs(userLikesQuery)
        const likedNotesPromises = allNotesSnapshot.docs.map(async (noteDoc) => {
          const likeRef = doc(collection(noteDoc.ref, "likes"), user.uid)
          const likeDoc = await getDoc(likeRef)
          if (likeDoc.exists()) {
            return {
              id: noteDoc.id,
              ...noteDoc.data(),
            }
          }
          return null
        })

        const likedNotes = (await Promise.all(likedNotesPromises)).filter((note) => note !== null)

        // Fetch comment counts for each note

        setUserNotes(uploadedNotes)
        setLikedNotes(likedNotes)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    return () => {
      isMounted = false;
    };

  }, [user, navigate])


  


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
        setUserNotes((prevNotes) => prevNotes.filter((note) => note.id !== id))
        console.log(`Note with ID: ${id} has been deleted successfully.`)
      } catch (error) {
        console.error("Error deleting note:", error)
      }
    }
  }



  const NoteCardSkeleton = () => (
    <div className="bg-white p-5 rounded-xl shadow-xl flex w-fit flex-row justify-between">
      <div className="flex flex-col justify-between flex-grow">
        <Skeleton height={20} width={150} className="mb-4" /> {/* Title */}
        <Skeleton height={14} width={100} className="mb-2" /> {/* Module */}
        <Skeleton height={16} width={120} className="mb-2" /> {/* Semester */}
        <Skeleton height={20} width={130} className="mb-2" /> {/* Details */}
        <Skeleton height={10} width={80} className="mb-4" /> {/* Uploaded by */}

        <div className="flex flex-row items-center gap-3">
          <Skeleton height={46} width={120} /> {/* View button */}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between ml-4">
        <Skeleton height={192} width={160} className="rounded-lg" /> {/* Image */}
        <Skeleton height={20} width={100} className="mt-2" /> {/* Date */}
      </div>
    </div>
  )

  const renderNoteCard = (note) => (
    <div key={note.id} className="bg-white p-5 rounded-xl shadow-xl flex flex-row justify-between">
      <div className="flex flex-col justify-between">
        <h1 className="md:text-lg font-bold mb-2">
          <span className="group relative">
            {note.subject || "unknown"}

          </span>
        </h1>

        <p className="text-gray-600 mb-2">
          @<span className="text-gray-600 md:text-sm relative">
            {note.module || "unknown"}

          </span>
        </p>

        <p className="text-gray-600 mb-2">
          Semester:
          <span className="text-gray-600 md:text-sm text-center relative">
            {note.semester || "unknown"}

          </span>
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

        </div>
      </div>

      <div className="flex flex-col items-center justify-between">
        <img
          onClick={() => handleViewNote(note.fileUrl, note.id)}
          src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl))}
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
          <p className='opacity-40 bottom-0'>{note.uploadedAt.toDate().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    </div>
  )


  const handleSignOut = async () => {
    const userConfirmed = window.confirm("Are you sure you want to sign out?");

    if (userConfirmed) {
      try {
        await signOut(auth);
        navigate("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      console.log("Sign out canceled by the user.");
    }
  };


  return (
    <div className="min-h-screen">
      {/* Fixed sidebar */}
      <div className="fixed flex flex-col justify-around left-0 top-10 px-3 h-screen w-64 bg-amber-50 shadow-lg z-10">
        <div className="p-4 mt-5">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-center">{user?.displayName || "User"}</h2>
            <p className="text-sm text-gray-600 text-center">{user?.email || "loading..."}</p>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("uploads")}
              className={`w-full text-left p-2 rounded flex items-center ${activeTab === "uploads" ? "bg-amber-100" : "hover:bg-slate-100"
                }`}
            >
              <Upload size={18} className="mr-2" /> Your Uploads
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`w-full text-left p-2 rounded flex items-center ${activeTab === "likes" ? "bg-amber-100" : "hover:bg-slate-100"
                }`}
            >
              <ThumbsUp size={18} className="mr-2" /> Liked Notes
            </button>
          </nav>
        </div>
        <div className="px-4 ml-2 py-2 text-red-500 flex justify-start items-center rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer" onClick={handleSignOut}>
          <LogOutIcon size={16} className="mr-2" />
          <p>Log out</p>
        </div>
      </div>

      {/* Main content - Fixed width container */}
      <div className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 mt-20">


          {loading ? (

            <div>

              <h2 className="text-2xl font-bold mb-6">{activeTab === "uploads" ? "Your Uploads" : "Liked Notes"}</h2>



              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <NoteCardSkeleton key={i} />
                ))}
              </div>
            </div>

          ) : (

            <div>
              <h2 className="text-2xl font-bold mb-6">{activeTab === "uploads" ? "Your Uploads" : "Liked Notes"}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === "uploads" ? (
                  userNotes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">You haven't uploaded any notes yet.</p>
                  ) : (
                    userNotes.map(renderNoteCard)
                  )
                ) : likedNotes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">You haven't liked any notes yet.</p>
                ) : (
                  likedNotes.map(renderNoteCard)
                )}
              </div>

            </div>

          )}
        </div>
      </div>
    </div>
  )
}