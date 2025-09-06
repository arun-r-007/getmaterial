"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { getInitialNotes, getNotesWithPagination, searchNotes, getFilterOptions, getTotalNotesCount, getAllNotesWithFilters } from "../firebase"
import { toTitleCase } from "../lib/utils"
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

import NotesLoader from "./NotesLoader"

import { Link } from "react-router-dom"

import { HandHeart, X } from "lucide-react";

import whatsapplogo from '../assets/whatsapp-logo.png'

const donators = [
  { name: "Sachin Barik", amount: 51 },
  { name: "Ashumal Pradhan", amount: 40 },
  { name: "Aniket Singh", amount: 25 },
  { name: "Saurav SD", amount: 20 },
  { name: "P S Ganesan", amount: 100 },
  { name: "Dipti", amount: 10 },
  { name: "Anurag", amount: 5 },
  { name: "Rajib", amount: 20 },
  { name: "Aditya Das", amount: 1.5 },
  { name: "Tanuj", amount: 10 },
  { name: "Prabin", amount: 13 },
  { name: "Saumya Singh", amount: 10 },
  { name: "Bidit raj", amount: 1 }
]

const TopContributor = ({ topContributor }) => {
  const contributors = topContributor || [] // Fallback to an empty array



  const texts = contributors.map((contributor) => `${contributor.name}-${contributor.amount}₹`)

  return (
    <div className="w-full">
      {texts.length > 0 ? (
        <MorphingText texts={texts} />
      ) : (
        <p className="text-black font-bold text-center md:text-sm h-14">Loading..</p>
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
  const {
    notes,
    setNotes,
    loading,
    setLoading,
    loadingMore,
    setLoadingMore,
    hasMore,
    setHasMore,
    lastDocSnapshot,
    setLastDocSnapshot,
    currentFilters,
    setCurrentFilters,
    totalNotesCount,
    setTotalNotesCount,
    filterOptions,
    setFilterOptions
  } = useContext(NotesContext);

  const { savedNotes, setSavedNotes, setIsSavedNotesLoading } = useContext(SavedNotesContext);

  const [error, setError] = useState(null)

  // Filter state
  const [titleFilter, setTitleFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [moduleFilter, setModuleFilter] = useState("")

  // Admin Email
  const adminEmail = import.meta.env.VITE_ADMIN_MAIL;
  const [admin, setAdmin] = useState(false)

  const [topContributor, setTopContributor] = useState(null)

  const owner = auth.currentUser

  const Navigate = useNavigate()

  const [savingNotes, setSavingNotes] = useState(false)

  // Helper function to check if any filters are applied
  const hasActiveFilters = () => {
    return titleFilter.trim() !== '' || semesterFilter || subjectFilter || moduleFilter || nameFilter;
  };



  // Initial load effect
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch initial notes (first 9)
        const initialNotesResult = await getInitialNotes();
        setNotes(initialNotesResult.notes);
        setLastDocSnapshot(initialNotesResult.lastDocSnapshot);
        setHasMore(initialNotesResult.hasMore);

        // Fetch filter options
        const filterOptionsResult = await getFilterOptions();
        setFilterOptions(filterOptionsResult);

        // Fetch total notes count
        const totalCount = await getTotalNotesCount();
        setTotalNotesCount(totalCount);

        // Check admin status
        const user = auth.currentUser;
        if (user && user.email === adminEmail) {
          setAdmin(true);
        }

        // Find top contributor from initial notes
        const contributorInfo = findTopContributor(initialNotesResult.notes);
        setTopContributor(contributorInfo);

      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Load more notes function (only for latest notes without filters)
  const loadMoreNotes = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      
      // Only paginate when no filters are applied
      const result = await getNotesWithPagination(9, lastDocSnapshot, {});
      
      setNotes(prevNotes => [...prevNotes, ...result.notes]);
      setLastDocSnapshot(result.lastDocSnapshot);
      setHasMore(result.hasMore);

    } catch (error) {
      console.error("Error loading more notes:", error);
      setError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };  // Apply filters function - gets ALL filtered results (no pagination)
  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if any filters are applied
      const hasFilters = titleFilter.trim() !== '' || semesterFilter || subjectFilter || moduleFilter || nameFilter;

      if (hasFilters) {
        // Get ALL notes with filters applied (no pagination)
        const filters = {
          semester: semesterFilter,
          subject: subjectFilter,
          module: moduleFilter,
          contributorName: nameFilter
        };
        const result = await getAllNotesWithFilters(filters, titleFilter);
        
        setNotes(result.notes);
        setLastDocSnapshot(null);
        setHasMore(false); // No pagination for filtered results
      } else {
        // Reset to initial state - first 9 notes with pagination
        const result = await getInitialNotes();
        setNotes(result.notes);
        setLastDocSnapshot(result.lastDocSnapshot);
        setHasMore(result.hasMore);
      }

      setCurrentFilters({
        titleFilter,
        semesterFilter,
        subjectFilter,
        moduleFilter,
        nameFilter
      });

    } catch (error) {
      console.error("Error applying filters:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters(); // Always apply filters (will handle both filtered and unfiltered states)
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [titleFilter, semesterFilter, subjectFilter, moduleFilter, nameFilter]);

  // Reset filters
  const resetFilters = async () => {
    setTitleFilter("");
    setSemesterFilter("");
    setSubjectFilter("");
    setNameFilter("");
    setModuleFilter("");
    
    try {
      setLoading(true);
      // Reset to initial state - first 9 notes with pagination
      const result = await getInitialNotes();
      setNotes(result.notes);
      setLastDocSnapshot(result.lastDocSnapshot);
      setHasMore(result.hasMore);
      setCurrentFilters({});
    } catch (error) {
      console.error("Error resetting filters:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const noteRef = doc(db, "notes", id) // Replace "notes" with your collection name
        await deleteDoc(noteRef)
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id)) // Remove deleted note from state
        // Update total count
        setTotalNotesCount(prevCount => prevCount - 1);
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


  const handleViewNote = (noteUrl, noteId, noteSubject, noteModule, noteContributorName) => {
    if (!noteUrl) {
      alert("Invalid Note URL") // Debugging
      return
    }

    const encodedUrl = encodeURIComponent(noteUrl)
    const url = `/note?url=${encodedUrl}&id=${noteId}&subject=${noteSubject}&module=${noteModule}&contributor=${noteContributorName}`
    window.open(url, '_blank')

  }


  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    // Check if popup has already been shown in this session
    if (!sessionStorage.getItem("donatePopupShown")) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        sessionStorage.setItem("donatePopupShown", "true"); // Mark as shown
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  // Close popup when clicking outside
  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      setShowPopup(false);
    }
  };

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup]);




  const handleShare = (noteUrl, noteId, noteSubject, noteModule, noteContributorName) => {
    const encodedUrl = encodeURIComponent(noteUrl);
    const encodedSubject = encodeURIComponent(noteSubject);
    const encodedModule = encodeURIComponent(noteModule);
    const encodedContributor = encodeURIComponent(noteContributorName);

    const url = `https://getmaterial.vercel.app/note?url=${encodedUrl}&id=${noteId}&subject=${encodedSubject}&module=${encodedModule}&contributor=${encodedContributor}`;

    const message = `Check out the notes of *${noteSubject}* | *${noteModule}* by *${noteContributorName}* on *GET MATERIAL* :- ${url}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };





  return (
    <div className="container md:mt-16 mt-14 mx-auto px-4 pb-8 pt-4">


      <div>
        {showPopup && (
          <div className="fixed z-50 px-2 inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div
              ref={popupRef}
              className="bg-amber-100 p-6 rounded-lg shadow-lg w-80 text-center relative"
            >
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPopup(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <HandHeart className="w-12 h-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold mt-2">
                Database <span className="text-amber-600">Cost</span> Rising! Support Us
              </h2>
              <p className="text-gray-600 text-xs mt-2">
                Help us continue our mission by making a small donation.
              </p>
              <Link to="/donate">
                <button className="bg-green-500 transition-all duration-300 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-sm mt-4">
                  Donate Now
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <button
        className="fixed bottom-4 right-4 border border-black  text-black p-2 rounded-full shadow-lg hover:bg-green-100 transition-all duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp className="md:size-5 size-3" />
      </button>

      <div className="flex justify-center items-center flex-col">
        <TopContributor topContributor={donators || []} />
      </div>

      <Link to="/donate">
        <div className="flex flex-row justify-center animate-pulse duration-700 hover:animate-none items-center">
          <h1 className="text-sm hover:underline md:hover:border-x px-5 md:hover:border-green-400 font-bold text-center hover:text-green-600 transition-all duration-200 ">Database <span className="text-amber-600 hover:text-green-600"> Cost
          </span> Rising. <span className="text-green-700">Donate</span> to Keep Us Running!</h1>

        </div>
      </Link>

      {/* Updated rendering of top contributor */}
      <h1 className=" text-xs text-gray-600 mb-1 ml-1 font-semibold ">
        Notes - <span>{totalNotesCount}</span>
      </h1>

      {/* Filter Panel */}
      <div className="mb-6 border-2 border-amber-100 shadow-xl border-x-amber-200 p-4 rounded-2xl">
        <div className="grid md:grid-cols-5 gap-3 items-center">
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
              options={["Select Subject", ...filterOptions.subjects.map(subject => toTitleCase(subject))]}
              placeholder={subjectFilter ? toTitleCase(subjectFilter) : "Select Subject"}
              onChange={(selectedOption) => {
                if (selectedOption === "Select Subject") {
                  setSubjectFilter(""); // Clear filter when "Select Subject" is chosen
                } else {
                  setSubjectFilter(selectedOption.toLowerCase());
                }
              }}
            />
          </div>

          {/* module Filter */}
          <div>
            {/* <label htmlFor="moduleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label> */}
            <CustomSelect
              options={["Select Module", ...filterOptions.modules.map(module => toTitleCase(module))]}
              placeholder={moduleFilter ? toTitleCase(moduleFilter) : "Select Module"}
              onChange={(selectedOption) => {
                if (selectedOption === "Select Module") {
                  setModuleFilter(""); // Clear filter when "Select Module" is chosen
                } else {
                  setModuleFilter(selectedOption.toLowerCase());
                }
              }}
            />
          </div>

          {/* Semester Filter */}
          <div>
            {/* <label htmlFor="semesterFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label> */}
            <CustomSelect
              options={["Select Semester", ...filterOptions.semesters]}
              placeholder={semesterFilter || "Select Semester"}
              onChange={(selectedOption) => {
                if (selectedOption === "Select Semester") {
                  setSemesterFilter(""); // Clear filter when "Select Semester" is chosen
                } else {
                  setSemesterFilter(selectedOption);
                }
              }}
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
        <NotesLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white p-5 rounded-xl shadow-xl">

              <div className="flex flex-row justify-between">

                <div className="flex flex-col justify-between">
                  <h1 className="md:text-xl font-bold mb-2">
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
                      {toTitleCase(note.subject) || "unknown"}

                      {/* Tooltip */}
                      <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        View all notes of {toTitleCase(note.subject)}
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
                      {toTitleCase(note.module) || "unknown"}

                      {/* Tooltip */}
                      <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        View all notes of {toTitleCase(note.module)}
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

                  <p className="mb-2 text-gray-600 md:text-sm text-xs ">Details: {note.name}</p>

                  <p className="text-gray-600 mb-4">
                    By:
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

                </div>

                <div className="flex flex-col items-center justify-between">
                  <img
                    onClick={() => handleViewNote(note.fileUrl, note.id, note.subject, note.module, note.contributorName)}
                    src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl)) || "/placeholder.svg"}
                    alt="PDF Preview"
                    className="md:w-40 cursor-pointer hover:brightness-90 transition-all duration-300 md:h-48 w-28 h-36  object-cover rounded-lg  ml-2 border-2 border-gray-300"
                  />
                </div>

              </div>

              <div className="flex flex-row items-center justify-between w-full gap-1 md:gap-2">
                <button
                  onClick={() => handleViewNote(note.fileUrl, note.id, note.subject, note.module, note.contributorName)}
                  className="text-white bg-black py-2 text-xs md:text-sm md:px-3 px-2 rounded-lg hover:rounded-2xl transition-all duration-300"
                >
                  View Note
                </button>

                <div className="flex flex-row items-center gap-2">
                  {/* WhatsApp share */}
                  <div className="flex items-center justify-center bg-gray-50 p-1 rounded-lg hover:bg-gray-100 transition-all">
                    <img
                      src={whatsapplogo}
                      alt="share"
                      onClick={() => handleShare(note.fileUrl, note.id, note.subject, note.module, note.contributorName)}
                      className="w-5 h-5 cursor-pointer hover:scale-125 transition-all"
                    />
                  </div>

                  {/* Bookmark */}
                  <div className="flex items-center justify-center bg-gray-50 p-1 rounded-lg hover:bg-gray-100 transition-all">
                    <Bookmark
                      size={20}
                      style={{
                        cursor: "pointer",
                        color: savedNotes[note.id] ? "red" : "black",
                      }}
                      onClick={() => handleSaveNote(note.id)}
                      className={
                        savedNotes[note.id]
                          ? "fill-red-500 transition-all"
                          : "hover:fill-red-500 hover:scale-125 transition-all"
                      }
                    />
                  </div>

                  {/* Delete button - conditionally rendered */}
                  {(admin || (owner && owner.email === note.metadata.createdBy)) && (
                    <div className="flex items-center justify-center bg-slate-50 p-1 rounded-lg hover:bg-red-200 transition-all duration-300">
                      <button onClick={() => handleDelete(note.id)}>
                        <Trash size={20} color="red" className="hover:scale-110 transition-all duration-300" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:mr-10">
                  <p className="opacity-40 text-xs md:text-sm bottom-0">{note.uploadedAt.toDate().toLocaleDateString("en-GB")}</p>
                </div>
              </div>

            </div>
          ))}

          {/* No results message */}
          {notes.length === 0 && !loading && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No notes found! Reset filters or try different search terms.
            </div>
          )}

          {/* Load More Button - only show when no filters are applied */}
          {hasMore && notes.length > 0 && !hasActiveFilters() && (
            <div className="col-span-full flex justify-center py-8">
              <button
                onClick={loadMoreNotes}
                disabled={loadingMore}
                className="px-6 py-3 rounded-lg font-medium
               bg-amber-300 text-black
               hover:bg-amber-400 
               disabled:bg-zinc-300 disabled:text-zinc-600
               shadow-sm hover:shadow-md
               transition-all duration-300 ease-in-out"
              >
                {loadingMore ? 'Loading More...' : 'Load More Notes'}
              </button>
            </div>

          )}
        </div>
      )}

      {/* Loading More Skeleton */}
      {loadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="z-70 w-full bg-zinc-50 rounded-lg shadow-lg p-4 flex flex-row space-x-6 overflow-hidden"
            >
              {/* Left Section Skeletons */}
              <div className="flex flex-col justify-center flex-grow">
                <Skeleton height={30} width={200} className="mb-4" />
                <Skeleton height={20} width={140} className="mb-4" />
                <Skeleton height={20} width={180} className="mb-4" />
                <Skeleton height={20} width={160} className="mb-4" />
                <div className="flex flex-row gap-2">
                  <Skeleton height={40} width={100} className="mt-4" />
                  <Skeleton height={40} width={40} className="mt-4" />
                </div>
              </div>
              {/* Right Section Skeleton */}
              <div className="flex-shrink-0">
                <Skeleton height={200} width={150} className="rounded-lg" />
              </div>
            </div>
          ))}
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

