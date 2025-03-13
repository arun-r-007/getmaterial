"use client"

import { useState, useEffect, useContext } from "react"
import { getNotes } from "../firebase"
import CustomSelect from "./CustomSelect"
import { db, auth } from "../firebase"
import { ArrowUp, Trash, Bookmark } from "lucide-react"
import "./loader.css"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { MorphingText } from "@/components/ui/morphing-text"
import { useNavigate } from "react-router-dom"
import { doc, collection, getDocs, setDoc, deleteDoc } from "firebase/firestore"
import NotesContext from "./context/NotesContext"
import SavedNotesContext from "./context/SavedNotesContext"



const TopContributor = ({ topContributor }) => {
  const contributors = topContributor || [] // Fallback to an empty array



  const texts = contributors.map((contributor) => `${contributor.name}-${contributor.noteCount}`)

  return (
    <div className="w-full">
      {texts.length > 0 ? (
        <MorphingText texts={texts} />
      ) : (
        <p className="text-black font-bold text-center h-14">Loading..</p>
      )}
    </div>
  )
}

const getPDFPreviewUrl = (fileId) => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
}

const extractFileIdFromUrl = (url) => {
  const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/)
  return fileIdMatch ? fileIdMatch[1] : null
}

function findTopContributor(notes) {
  // Filter out notes with empty or "unknown" contributor names
  const validNotes = notes.filter(
    (note) =>
      note.contributorName && note.contributorName.trim() !== "" && note.contributorName.toLowerCase() !== "unknown",
  )

  // Count notes per valid contributor
  const contributorCounts = validNotes.reduce((acc, note) => {
    const contributorName = note.contributorName
    acc[contributorName] = (acc[contributorName] || 0) + 1
    return acc
  }, {})

  // Convert the contributor counts object to an array of [name, count] pairs and sort by count in descending order
  const sortedContributors = Object.entries(contributorCounts).sort((a, b) => b[1] - a[1])

  // Extract top 3 contributors
  const topContributors = sortedContributors.slice(0, 3).map(([name, count]) => ({
    name,
    noteCount: count,
  }))

  return topContributors
}

function Dashboard() {
  const { notes, setNotes } = useContext(NotesContext)
  const { savedNotes, setSavedNotes, setIsSavedNotesLoading } = useContext(SavedNotesContext);

  const [filteredNotes, setFilteredNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [titleFilter, setTitleFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [nameFilter, setNameFilter] = useState("") // Add nameFilter state
  const [moduleFilter, setModuleFilter] = useState("")

  // Unique semesters and subjects for dropdowns
  const [uniqueSemesters, setUniqueSemesters] = useState([])
  const [uniqueSubjects, setUniqueSubjects] = useState([])
  const [uniqueModules, setUniqueModules] = useState([])

  // Total notes count
  const [totalNotes, setTotalNotes] = useState(0)

  // Admin Email

  const adminEmail = "talaganarajesh25@gmail.com"
  const [admin, setAdmin] = useState(false)

  const [topContributor, setTopContributor] = useState(null)

  const owner = auth.currentUser

  const Navigate = useNavigate()

  const [savingNotes, setSavingNotes] = useState(false)



  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true)
        const fetchedNotes = await getNotes()

        const user = auth.currentUser

        if (user && user.email == adminEmail) {
          setAdmin(true)
        }

        // Normalize subject names
        const normalizedNotes = fetchedNotes.map((note) => ({
          ...note,
          subject: note.subject.trim().toUpperCase(),
        }))

        setNotes(normalizedNotes)

        // Extract unique semesters and subjects
        const semesters = [...new Set(normalizedNotes.map((note) => note.semester))]
        const subjects = [...new Set(normalizedNotes.map((note) => note.subject))]
        const modules = [...new Set(normalizedNotes.map((note) => note.module))]

        setUniqueSemesters(semesters.sort())
        setUniqueSubjects(subjects.sort())
        setUniqueModules(modules.sort())

        // Find top contributor
        const contributorInfo = findTopContributor(fetchedNotes)

        setTopContributor(contributorInfo)

        setTotalNotes(fetchedNotes.length)

        setError(null)
      } catch (error) {
        console.error("Error fetching notes:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [setNotes])

  // Filter effect
  useEffect(() => {
    // Apply filters
    const filtered = notes.filter(
      (note) =>
        (note.name.toLowerCase().includes(titleFilter.toLowerCase()) ||
          note.subject.toLowerCase().includes(titleFilter.toLowerCase()) ||
          note.contributorName.toLowerCase().includes(titleFilter.toLowerCase())) &&
        (semesterFilter === "" || note.semester === semesterFilter) &&
        (subjectFilter === "" || note.subject === subjectFilter) &&
        (moduleFilter === "" || note.module === moduleFilter) &&
        (nameFilter === "" || note.contributorName === nameFilter),
    )

    setFilteredNotes(filtered)
  }, [notes, titleFilter, semesterFilter, subjectFilter, nameFilter, moduleFilter])

  // Reset filters
  const resetFilters = () => {
    setTitleFilter("")
    setSemesterFilter("")
    setSubjectFilter("")
    setNameFilter("") // Reset nameFilter as well
    setModuleFilter("")
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const noteRef = doc(db, "notes", id) // Replace "notes" with your collection name
        await deleteDoc(noteRef)
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id)) // Remove deleted note from state
        console.log(`Note with ID: ${id} has been deleted successfully.`)
      } catch (error) {
        console.error("Error deleting note:", error)
      }
    }
  }



  useEffect(() => {
    const fetchSavedNotes = async () => {
      if (!auth.currentUser) {
        setIsSavedNotesLoading(false);
        return;
      }

      try {
        setIsSavedNotesLoading(true);
        const userId = auth.currentUser.uid;
        const savedNotesRef = collection(db, "users", userId, "savedNotes");
        const savedNotesSnapshot = await getDocs(savedNotesRef);

        const saved = {};
        savedNotesSnapshot.forEach((doc) => {
          saved[doc.id] = true;
        });

        setSavedNotes(saved);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
      } finally {
        setIsSavedNotesLoading(false);
      }
    };

    fetchSavedNotes();
  }, [auth.currentUser, setSavedNotes, setIsSavedNotesLoading]);

  // Update handleSaveNote function
  const handleSaveNote = async (noteId) => {
    if (!auth.currentUser) {
      alert("Please log in to save notes!");
      return;
    }

    try {
      setSavingNotes(true);
      const userId = auth.currentUser.uid;
      const noteRef = doc(db, "users", userId, "savedNotes", noteId);

      if (savedNotes[noteId]) {
        await deleteDoc(noteRef);
        setSavedNotes((prev) => {
          const updated = { ...prev };
          delete updated[noteId];
          return updated;
        });
      } else {
        await setDoc(noteRef, {
          savedAt: new Date(),
          noteId: noteId
        });
        setSavedNotes((prev) => ({
          ...prev,
          [noteId]: true
        }));
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };


  const handleViewNote = (noteUrl,noteId, noteSubject, noteModule, noteContributorName) => {
    if (!noteUrl) {
      alert("Invalid Note URL") // Debugging
      return
    }

    const encodedUrl = encodeURIComponent(noteUrl)
    const url=`/note?url=${encodedUrl}&id=${noteId}&subject=${noteSubject}&module=${noteModule}&contributor=${noteContributorName}`
    window.open(url, '_blank')

  }


  return (
    <div className="container md:mt-20 mt-14 mx-auto px-4 pb-8 pt-4">
      <button
        className="fixed bottom-4 right-4 border border-black  text-black p-2 rounded-full shadow-lg hover:bg-green-100 transition-all duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp className="md:size-5 size-3" />
      </button>

      <div className="flex justify-center items-center flex-col">
        <p className="text-xs font-semibold ">Thanks</p>
        <TopContributor topContributor={topContributor || []} />
      </div>

      {/* Updated rendering of top contributor */}
      <h1 className=" text-xs text-gray-600 mb-1 ml-1 font-semibold ">
        NIST NOTES - <span>{totalNotes}</span>
      </h1>

      {/* Filter Panel */}
      <div className="mb-6 border-2 border-green-200 shadow-xl border-x-teal-200 p-4 rounded-2xl">
        <div className="grid md:grid-cols-5 gap-4 p-2 items-center">
          {/* Title Filter */}
          <div>
            {/* <label htmlFor="titleFilter" className="block text-sm font-medium text-gray-700">
              Search
            </label> */}
            <input
              type="text"
              id="titleFilter"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Search subject / teacher etc."
              className="p-3 block w-full rounded-md border-gray-300 border-2 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          {/* Subject Filter */}

          <div>
            {/* <label
              htmlFor="subjectFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject
            </label> */}
            <CustomSelect
              options={uniqueSubjects}
              placeholder={subjectFilter || "All Subjects"}
              onChange={(selectedOption) => setSubjectFilter(selectedOption)}
            />
          </div>

          {/* module Filter */}
          <div>
            {/* <label htmlFor="moduleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label> */}
            <CustomSelect
              options={uniqueModules}
              placeholder={moduleFilter || "All Modules"}
              onChange={(selectedOption) => setModuleFilter(selectedOption)}
            />
          </div>

          {/* Semester Filter */}
          <div>
            {/* <label htmlFor="semesterFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label> */}
            <CustomSelect
              options={uniqueSemesters}
              placeholder={semesterFilter || "All Semesters"}
              onChange={(selectedOption) => setSemesterFilter(selectedOption)}
            />
          </div>

          {/* Reset Filters Button */}
          <div className=" text-center">
            <button
              onClick={resetFilters}
              className="bg-yellow-100 border-yellow-300 border text-gray-800 py-3 px-5 rounded-lg font-semibold md:hover:border-yellow-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500">Error fetching notes: {error}</p>}


      {/* Notes Grid */}

      {loading ? (
        <div className="flex-row justify-center gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((card) => (
            <div
              key={card}
              className="z-70 w-full bg-zinc-50 rounded-lg shadow-lg p-4 flex flex-row space-x-6 overflow-hidden"
            >
              {/* Left Section Skeletons */}
              <div className="flex flex-col justify-center flex-grow">
                <Skeleton height={30} width={200} className="mb-4" /> {/* Title */}
                <Skeleton height={20} width={140} className="mb-4" /> {/* Subtitle */}
                <Skeleton height={20} width={180} className="mb-4" /> {/* Subtitle */}
                <div className="flex flex-row gap-2">
                  <Skeleton height={40} width={100} className="mt-4" /> {/* Button */}
                  <Skeleton height={40} width={40} className="mt-4" /> {/* likes */}
                </div>
              </div>

              {/* Right Section Skeleton */}
              <div className="flex-shrink-0">
                <Skeleton height={200} width={150} className="rounded-lg" /> {/* Image Placeholder */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-5 rounded-xl shadow-xl flex flex-row justify-between">
              <div className="flex flex-col justify-between">
                <h1 className="text-xl font-bold mb-2">
                  <span
                    onClick={() => {
                      if (subjectFilter == note.subject) {
                        setSubjectFilter("")
                      } else {
                        setSubjectFilter(note.subject)
                      }
                    }}
                    className="group hover:text-green-500 transition-colors duration-300 cursor-pointer relative"
                  >
                    {note.subject || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of {note.subject}
                    </span>
                  </span>
                </h1>

                <p className="text-gray-600 mb-2">
                  @
                  <span
                    onClick={() => {
                      if (moduleFilter == note.module) {
                        setModuleFilter("")
                      } else {
                        setModuleFilter(note.module)
                      }
                    }}
                    className="text-gray-600 group hover:text-green-500 transition-colors duration-300 cursor-pointer relative"
                  >
                    {note.module || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of {note.module}
                    </span>
                  </span>
                </p>

                <p className="text-gray-600 mb-2">
                  Semester:
                  <span
                    onClick={() => {
                      if (semesterFilter == note.semester) {
                        setSemesterFilter("")
                      } else {
                        setSemesterFilter(note.semester)
                      }
                    }}
                    className="text-gray-600 text-center group ml-1 hover:text-green-500 transition-colors duration-300 cursor-pointer relative"
                  >
                    {note.semester || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of sem {note.semester}
                    </span>
                  </span>
                </p>

                <h2 className="mb-2 text-gray-600">Details: {note.name}</h2>

                <p className="text-gray-600 mb-4">
                  Uploaded by:
                  <span
                    onClick={() => {
                      if (nameFilter == note.contributorName) {
                        setNameFilter("")
                      } else {
                        setNameFilter(note.contributorName)
                      }
                    }}
                    className="text-green-800 group font-semibold hover:text-green-500 transition-colors duration-300 cursor-pointer relative"
                  >
                    {note.contributorName || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes by {note.contributorName}
                    </span>
                  </span>
                </p>

                <div className="flex flex-row justify-start w-full items-baseline">
                  <button
                    onClick={() => handleViewNote(note.fileUrl,note.id, note.subject, note.module, note.contributorName)}
                    className="text-white bg-black py-2 text-center text-xs md:text-sm md:w-fit md:px-3 w-20 rounded-lg hover:rounded-2xl transition-all duration-300"
                  >
                    View Note
                  </button>


                  <div className="flex flex-row md:px-2 gap-1 px-1 rounded-lg transition-all">
                    <div className="flex flex-row bg-gray-50 md:px-2 gap-1 p-1 rounded-lg md:hover:bg-gray-100 transition-all">
                      <Bookmark
                        size={20}
                        style={{
                          cursor: "pointer",
                          marginRight: "0px",
                          color: savedNotes[note.id] ? "red" : "black", // Instant UI toggle
                        }}
                        onClick={() => handleSaveNote(note.id)}
                        className={
                          savedNotes[note.id]
                            ? "fill-red-500 rounded-md transition-all"
                            : "bg-transparent md:hover:fill-red-500  md:hover:scale-125 rounded-full transition-all"
                        }
                      />
                    </div>

                    {(admin || (owner && owner.email === note.metadata.createdBy)) && (
                      <div className="bg-slate-50 hover:bg-red-200 rounded-lg p-1 transition-all duration-300">
                        <button onClick={() => handleDelete(note.id)}>
                          <Trash size={20} color="red" className="hover:scale-110 transition-all duration-300" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between">
                <img
                  onClick={() => handleViewNote(note.fileUrl,note.id, note.subject, note.module, note.contributorName)}
                  src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl)) || "/placeholder.svg"}
                  alt="PDF Preview"
                  className="md:w-40 cursor-pointer hover:brightness-90 transition-all duration-300 md:h-48 w-28 h-36  object-cover rounded-lg  ml-2 border-2 border-gray-300"
                />

                <p className="opacity-40 bottom-0">{note.uploadedAt.toDate().toLocaleDateString("en-GB")}</p>
              </div>
            </div>
          ))}

          {/* No results message */}
          {filteredNotes.length === 0 && !loading && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No notes found ! Reset filters or Refresh page.
            </div>
          )}
        </div>
      )}

      {savingNotes && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-all z-50">
          <h1 className="loader3 "></h1>
        </div>
      )}
      <div className="text-center opacity-90 pt-14 flex flex-col">
        <a
          href="https://talaganarajesh.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:-rotate-3 transition-all duration-300"
        >
          <span className="text-green-700 font-bold">
            <span className="text-black">~ by</span> Rajesh
          </span>
        </a>
      </div>
    </div>
  )
}

export default Dashboard

