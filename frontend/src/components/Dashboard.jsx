import { useState, useEffect } from 'react';
import axios from 'axios';

import { getNotes } from '../firebase';

import CustomSelect from "./CustomSelect";

import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Trash } from 'lucide-react';


import { auth } from '../firebase';

import './loader.css'

import { getFirestore, updateDoc, increment } from "firebase/firestore";



import { getDocs, collection } from "firebase/firestore";

import { Heart } from "lucide-react";

import "./style.css";


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

  return (
    <div className="text-green-700 shining-text">
      {contributors.length > 0 ? (
        <div key={currentIndex}>
          <h2>{contributors[currentIndex].name}
            <span>({contributors[currentIndex].noteCount})</span>
          </h2>
        </div>
      ) : (
        <p>NULL</p>
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



  const [isLiked, setIsLiked] = useState(false);
  const [allLikes, setAllLikes] = useState({});


  const [topContributor, setTopContributor] = useState(null);

  const owner = auth.currentUser;



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
    const db = getFirestore();
    const noteRef = doc(db, "notes", noteId);

    // Optimistically update the likes locally
    setAllLikes((prevLikes) => ({
      ...prevLikes,
      [noteId]: (prevLikes[noteId] || 0) + (isLiked ? -1 : 1), // Increment or decrement based on `isLiked`
    }));

    try {
      // Update the likes count in the Firestore database
      await updateDoc(noteRef, {
        likes: increment(isLiked ? -1 : 1), // Atomically increment in Firestore
      });

      // Toggle the liked state
      setIsLiked(!isLiked);
    } catch (error) {

      // Roll back the local state if the database update fails
      setAllLikes((prevLikes) => ({
        ...prevLikes,
        [noteId]: (prevLikes[noteId] || 0) + (isLiked ? 1 : -1), // Revert the optimistic update
      }));
    }
  };


  useEffect(() => {
    const fetchLikes = async () => {
      const fetchedLikes = {};

      await Promise.all(
        notes.map((note) => {
          fetchedLikes[note.id] = note.likes || 0; // Populate likes dictionary
        })
      );

      setAllLikes(fetchedLikes); // Update state with fetched likes
    };

    fetchLikes();
  }, [notes]); // Depend on `notes` array




  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Nist Notes <span className='text-gray-600 text-2xl'>({totalNotes})</span></h1>

      {/* Updated rendering of top contributor */}
      <h1 className=" items-center text-gray-600 mb-0 font-semibold flex-row flex gap-1 relative group">
        <p className='text-sm'>Top Contributors:</p>

        <TopContributor topContributor={topContributor || []} />


      </h1>


      {/* Filter Panel */}
      <div className="mb-6 bg-gray-100 p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Title Filter */}
          <div>
            <label htmlFor="titleFilter" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="titleFilter"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Enter subject / teacher etc."
              className="mt-1 p-3 block w-full rounded-md border-gray-300 border-2 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>



          {/* Subject Filter */}

          <div>
            <label
              htmlFor="subjectFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject
            </label>
            <CustomSelect
              options={uniqueSubjects}
              placeholder={subjectFilter || "All Subjects"}
              onChange={(selectedOption) => setSubjectFilter(selectedOption)}
            />

          </div>




          {/* module Filter */}
          <div>
            <label htmlFor="moduleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>
            <CustomSelect
              options={uniqueModules}
              placeholder={moduleFilter || "All Modules"}
              onChange={(selectedOption) => setModuleFilter(selectedOption)}

            />
          </div>

          {/* Semester Filter */}
          <div>
            <label htmlFor="semesterFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <CustomSelect

              options={uniqueSemesters}
              placeholder={semesterFilter || "All Semesters"}
              onChange={(selectedOption) => setSemesterFilter(selectedOption)}

            />
          </div>

          {/* Reset Filters Button */}
          <div className="mt-4 p-3 text-center">
            <button
              onClick={resetFilters}
              className="bg-red-100 text-gray-800 py-2 px-4 rounded font-semibold hover:bg-red-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading && <div className='flex justify-center mt-32'><span className="loader"></span></div>}
      {error && <p className="text-red-500">Error fetching notes: {error}</p>}

      {/* Notes Grid */}
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


              <div className='flex flex-row justify-start gap-3 items-center'>

                <a
                  href={note.fileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-white bg-black py-2 px-3 rounded-lg hover:rounded-2xl transition-all duration-300"
                >
                  View Note
                </a>

                <div className='flex flex-row'>
                  <Heart style={{
                    cursor: "pointer",
                    marginRight: "5px",
                    color: "gray", // Toggle color based on the `liked` state
                  }} onClick={() => handleLike(note.id)} className="hover:bg-red-400 rounded-md hover:p-1 transition-all" />

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
                  <div className="bg-slate-200 rounded-lg md:p-2 p-1 hover:rounded-xl transition-all duration-300">
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
              <p className='opacity-40 bottom-0'>Dt: {note.uploadedAt.toDate().toLocaleDateString('en-GB')}</p>


            </div>



          </div>




        ))}

        {/* No results message */}
        {filteredNotes.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No notes found. Try adjusting your filters.
          </div>
        )}
      </div>
      <div className='text-center opacity-90 pt-14 flex flex-col'>
        <a href="https://talaganarajesh.vercel.app/" target='_blank' rel="noopener noreferrer" className='hover:-rotate-3 transition-all duration-300'>
          <span className='text-green-700 font-bold'><span className='text-black'>~ by</span> Rajesh</span>
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
