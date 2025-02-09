import { useState, useEffect } from 'react';
import axios from 'axios';

import { getNotes } from '../firebase';

import CustomSelect from "./CustomSelect";

import { db } from '../firebase';
import { ArrowUp, Trash } from 'lucide-react';


import { auth } from '../firebase';

import './loader.css'




// import { getDocs, collection } from "firebase/firestore";

import { Heart } from "lucide-react";

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { motion, AnimatePresence } from 'framer-motion';

import { MorphingText } from "@/components/ui/morphing-text";
import { Navigate, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '@headlessui/react';


import { getFirestore, doc, updateDoc, increment, collection, getDoc, setDoc, deleteDoc } from "firebase/firestore";


const TopContributor = ({ topContributor }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const contributors = topContributor || []; // Fallback to an empty array

  useEffect(() => {
    if (contributors.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % contributors.length);
      }, 2000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [contributors]);

  const texts = contributors.map((contributor) => `${contributor.name}-${contributor.noteCount}`);

  return (
    <div className='w-full'>

      {texts.length > 0 ? (
        <MorphingText texts={texts} />
      ) : (
        <p className="text-black font-bold text-center h-14">Loading..</p>
      )}

    </div>
  );
};



const getPDFPreviewUrl = (fileId) => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}


const extractFileIdFromUrl = (url) => {
  const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
  return fileIdMatch ? fileIdMatch[1] : null;
}




function findTopContributor(notes) {
  // Filter out notes with empty or "unknown" contributor names
  const validNotes = notes.filter(note =>
    note.contributorName &&
    note.contributorName.trim() !== '' &&
    note.contributorName.toLowerCase() !== 'unknown'
  );

  // Count notes per valid contributor
  const contributorCounts = validNotes.reduce((acc, note) => {
    const contributorName = note.contributorName;
    acc[contributorName] = (acc[contributorName] || 0) + 1;
    return acc;
  }, {});

  // Convert the contributor counts object to an array of [name, count] pairs and sort by count in descending order
  const sortedContributors = Object.entries(contributorCounts)
    .sort((a, b) => b[1] - a[1]);

  // Extract top 3 contributors
  const topContributors = sortedContributors.slice(0, 3).map(([name, count]) => ({
    name,
    noteCount: count
  }));


  return topContributors;

}


function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [titleFilter, setTitleFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [nameFilter, setNameFilter] = useState(''); // Add nameFilter state
  const [moduleFilter, setModuleFilter] = useState('');

  // Unique semesters and subjects for dropdowns
  const [uniqueSemesters, setUniqueSemesters] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [uniqueModules, setUniqueModules] = useState([]);



  // Total notes count
  const [totalNotes, setTotalNotes] = useState(0);

  // Admin Email 

  const adminEmail = "talaganarajesh25@gmail.com"
  const [admin, setAdmin] = useState(false);



  const [isLiked, setIsLiked] = useState({});
  const [allLikes, setAllLikes] = useState({});


  const [topContributor, setTopContributor] = useState(null);

  const owner = auth.currentUser;

  const Navigate = useNavigate();



  useEffect(() => {


    const fetchNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await getNotes();


        const user = auth.currentUser;


        if (user && user.email == adminEmail) {
          setAdmin(true);
        }


        // Normalize subject names
        const normalizedNotes = fetchedNotes.map(note => ({
          ...note,
          subject: note.subject.trim().toUpperCase(), // Normalize subject jjjjjjjjsjust test comment
        }));

        setNotes(normalizedNotes);



        // Extract unique semesters and subjects
        const semesters = [...new Set(normalizedNotes.map(note => note.semester))];
        const subjects = [...new Set(normalizedNotes.map(note => note.subject))];
        const modules = [...new Set(normalizedNotes.map(note => note.module))];

        setUniqueSemesters(semesters.sort());
        setUniqueSubjects(subjects.sort());
        setUniqueModules(modules.sort());

        // Find top contributor
        const contributorInfo = findTopContributor(fetchedNotes);

        setTopContributor(contributorInfo);

        setTotalNotes(fetchedNotes.length);


        setError(null);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filter effect
  useEffect(() => {
    // Apply filters
    const filtered = notes.filter(note =>
      (
        note.name.toLowerCase().includes(titleFilter.toLowerCase()) ||
        note.subject.toLowerCase().includes(titleFilter.toLowerCase()) || // Match subject as well
        note.contributorName.toLowerCase().includes(titleFilter.toLowerCase()) // Match contributor name as well
      ) &&
      (semesterFilter === '' || note.semester === semesterFilter) &&
      (subjectFilter === '' || note.subject === subjectFilter) &&
      (moduleFilter === '' || note.module === moduleFilter) && // Filter by module
      (nameFilter === '' || note.contributorName === nameFilter) // Filter by contributor name
    );

    setFilteredNotes(filtered);

  }, [notes, titleFilter, semesterFilter, subjectFilter, nameFilter, moduleFilter]); // Include nameFilter

  // Reset filters
  const resetFilters = () => {
    setTitleFilter('');
    setSemesterFilter('');
    setSubjectFilter('');
    setNameFilter(''); // Reset nameFilter as well
    setModuleFilter('');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const noteRef = doc(db, "notes", id); // Replace "notes" with your collection name
        await deleteDoc(noteRef);
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id)); // Remove deleted note from state
        console.log(`Note with ID: ${id} has been deleted successfully.`);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };




  const handleLike = async (noteId) => {
    if (!auth.currentUser) {
      alert("Please sign in to vote!");
      Navigate("/auth");
      return;
    }

    const db = getFirestore();
    const userId = auth.currentUser.uid;
    const noteRef = doc(db, "notes", noteId);
    const likeRef = doc(collection(noteRef, "likes"), userId);

    // Optimistic UI Update
    const previousLiked = isLiked[noteId];
    const previousLikes = allLikes[noteId] || 0;

    setIsLiked((prev) => ({ ...prev, [noteId]: !previousLiked }));
    setAllLikes((prev) => ({ ...prev, [noteId]: previousLiked ? previousLikes - 1 : previousLikes + 1 }));

    try {
      const likeSnap = await getDoc(likeRef);

      if (likeSnap.exists()) {
        // Unlike (Remove like)
        await deleteDoc(likeRef);
        await updateDoc(noteRef, { likes: increment(-1) });
      } else {
        // Like (Add like)
        await setDoc(likeRef, { liked: true });
        await updateDoc(noteRef, { likes: increment(1) });
      }
    } catch (error) {
      console.error("Error updating like:", error);

      // Revert UI changes if Firebase request fails
      setIsLiked((prev) => ({ ...prev, [noteId]: previousLiked }));
      setAllLikes((prev) => ({ ...prev, [noteId]: previousLikes }));
    }
  };

  // Fetch Likes on Component Mount
  useEffect(() => {
    const fetchLikes = async () => {
      if (!auth.currentUser) return;

      const fetchedLikes = {};
      const likedNotes = {};

      await Promise.all(
        notes.map(async (note) => {
          const likeRef = doc(collection(doc(db, "notes", note.id), "likes"), auth.currentUser.uid);
          const likeSnap = await getDoc(likeRef);

          fetchedLikes[note.id] = note.likes || 0;
          likedNotes[note.id] = likeSnap.exists();
        })
      );

      setAllLikes(fetchedLikes);
      setIsLiked(likedNotes);
    };

    fetchLikes();
  }, [notes, auth.currentUser]); // Dependencies







  const handleViewNote = (noteUrl) => {
    // Encode the URL to handle special characters
    const encodedUrl = noteUrl;
    Navigate(`/note?url=${encodedUrl}`);
  };



  return (
    <div className="container md:mt-20 mt-14 mx-auto px-4 pb-8 pt-4">

      <button className='fixed bottom-4 right-4 border border-black  text-black p-2 rounded-full shadow-lg hover:bg-green-100 transition-all duration-300' onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <ArrowUp className='md:size-5 size-3' />
      </button>

      <div className="flex justify-center items-center flex-col">
        <p className='text-xs font-semibold '>Thanks</p>
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

      {loading ?

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

                <div className='flex flex-row gap-2'>
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

        :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-5 rounded-xl shadow-xl flex flex-row justify-between">

              <div className='flex flex-col justify-between'>

                <h1 className='text-xl font-bold mb-2'>
                  <span
                    onClick={() => {
                      if (subjectFilter == note.subject) {
                        setSubjectFilter("")
                      }
                      else {
                        setSubjectFilter(note.subject)
                      }
                    }
                    }
                    className='group hover:text-green-500 transition-colors duration-300 cursor-pointer relative'
                  >
                    {note.subject || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of {note.subject}
                    </span>
                  </span>
                </h1>

                <p className='text-gray-600 mb-2'>@
                  <span
                    onClick={() => {
                      if (moduleFilter == note.module) {
                        setModuleFilter("")
                      }
                      else {
                        setModuleFilter(note.module)
                      }
                    }
                    }
                    className='text-gray-600 group hover:text-green-500 transition-colors duration-300 cursor-pointer relative'
                  >
                    {note.module || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of {note.module}
                    </span>
                  </span>
                </p>


                <p className='text-gray-600 mb-2'>Semester:
                  <span
                    onClick={() => {
                      if (semesterFilter == note.semester) {
                        setSemesterFilter("")
                      }
                      else {
                        setSemesterFilter(note.semester)
                      }
                    }

                    }
                    className='text-gray-600 text-center group ml-1 hover:text-green-500 transition-colors duration-300 cursor-pointer relative'
                  >
                    {note.semester || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes of sem {note.semester}
                    </span>
                  </span>
                </p>


                <h2 className="mb-2 text-gray-600">Details: {note.name}</h2>


                <p className='text-gray-600 mb-4'>Uploaded by:
                  <span
                    onClick={() => {
                      if (nameFilter == note.contributorName) {
                        setNameFilter("")
                      }
                      else {
                        setNameFilter(note.contributorName)
                      }
                    }
                    }
                    className='text-green-800 group font-semibold hover:text-green-500 transition-colors duration-300 cursor-pointer relative'
                  >
                    {note.contributorName || "unknown"}

                    {/* Tooltip */}
                    <span className="tooltip absolute bottom-full w-full transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View all notes by {note.contributorName}
                    </span>
                  </span>
                </p>


                <div className='flex flex-row justify-start gap-1 items-center'>

                  <button
                    onClick={() => handleViewNote(note.fileUrl)}
                    className="text-white bg-black py-2 text-center text-xs md:text-sm md:w-fit md:px-3 w-20 rounded-lg hover:rounded-2xl transition-all duration-300"
                  >
                    View Note
                  </button>

                  <div className='flex flex-row bg-gray-50 md:px-2 p-1 rounded-lg md:hover:bg-gray-100 transition-all'>
                    <Heart
                      style={{
                        cursor: "pointer",
                        marginRight: "0px",
                        color: isLiked[note.id] ? "red" : "black" // Instant UI toggle
                      }}
                      onClick={() => handleLike(note.id)}
                      className={isLiked[note.id] ? "fill-red-500 rounded-md transition-all" : "bg-transparent md:hover:fill-red-500 md:hover:p-0.5 rounded-full transition-all"}
                    />
                    {allLikes[note.id] || 0}
                  </div>


                  {admin && ( // Show Delete button only for admin
                    <div className="bg-slate-200 rounded-lg p-2 hover:rounded-xl transition-all duration-300">
                      <button onClick={() => handleDelete(note.id)}>
                        <Trash size={20} color="red" />
                      </button>
                    </div>
                  )}

                  {owner && owner.email == note.metadata.createdBy && (
                    <div className="bg-slate-100 rounded-lg md:px-2 p-1 hover:bg-slate-200 hover:rounded-xl transition-all duration-300">
                      <button onClick={() => handleDelete(note.id)}>
                        <Trash size={20} color="red" />
                      </button>
                    </div>
                  )}

                </div>


              </div>

              <div className='flex flex-col items-center justify-between'>
                <img
                  src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl))}
                  alt="PDF Preview"
                  className="md:w-40 md:h-48 w-28 h-36  object-cover rounded-lg  ml-2 border-2 border-gray-300"
                />
                <p className='opacity-40 bottom-0'>{note.uploadedAt.toDate().toLocaleDateString('en-GB')}</p>


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


      }





      <div className='text-center opacity-90 pt-14 flex flex-col'>
        <a href="https://talaganarajesh.vercel.app/" target='_blank' rel="noopener noreferrer" className='hover:-rotate-3 transition-all duration-300'>
          <span className='text-green-700 font-bold'><span className='text-black'>~ by</span> Rajesh</span>
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
