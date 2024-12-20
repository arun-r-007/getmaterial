import { useState, useEffect } from 'react';
import axios from 'axios';

import { getNotes } from '../firebase';

import './loader.css'


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

  // Find the contributor with the most notes
  let topContributor = null;
  let maxNotes = 0;

  for (const [contributor, count] of Object.entries(contributorCounts)) {
    if (count > maxNotes) {
      maxNotes = count;
      topContributor = contributor;
    }
  }

  return {
    name: topContributor,
    noteCount: maxNotes
  };
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

  //top contributor
  const [topContributor, setTopContributor] = useState(null);


  useEffect(() => {

    document.getElementById('titleFilter')?.focus();

    const fetchNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await getNotes();


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
      (moduleFilter === '' || note.module === moduleFilter) && // Filter by contributor name
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



  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Nist Notes</h1>

      {/* Updated rendering of top contributor */}
      <h1 className="text-lg text-gray-600 mb-0 font-semibold flex-row flex cursor-pointer gap-1 relative group">
        Top Contributor:
        <h1 className='text-green-700 shining-text'>
          {topContributor
            ? `${topContributor.name} (${topContributor.noteCount} notes)`
            : 'Loading...'}
        </h1>

        {/* Tooltip */}
        {/* <span className="tooltip absolute left-44 bottom-10 transform -translate-x-1/2 mt-2 py-3 px-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Thank you {topContributor ? topContributor.name : 'loading'}
        </span> */}
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
            <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <select
              id="subjectFilter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>


          {/* module Filter */}
          <div>
            <label htmlFor="moduleFilter" className="block text-sm font-medium text-gray-700">
              Module
            </label>
            <select
              id="moduleFilter"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Modules</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label htmlFor="semesterFilter" className="block text-sm font-medium text-gray-700">
              Semester
            </label>
            <select
              id="semesterFilter"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Semesters</option>
              {uniqueSemesters.map(semester => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="mt-4 p-3 text-center">
            <button
              onClick={resetFilters}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
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


              <div className='flex flex-row justify-between items-center'>

                <a
                  href={note.fileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-white bg-black py-2 px-3 rounded-lg hover:rounded-2xl transition-all duration-300"
                >
                  View Note
                </a>

              </div>


            </div>

            <div className='flex flex-col items-center justify-between'>
              <img
                src={getPDFPreviewUrl(extractFileIdFromUrl(note.fileUrl))}
                alt="PDF Preview"
                className="md:w-40 md:h-48 w-28 h-36  object-cover rounded-lg  ml-2 border-2 border-gray-300"
              />
              <p className='opacity-40 bottom-0'>NIST: {note.uploadedAt.toDate().toLocaleDateString('en-GB')}</p>
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
        <a href="https://talaganarajesh.vercel.app/" target='_blank' rel="noopener noreferrer" >
          <span className='opacity-60 hover:opacity-100 transition-opacity duration-300'>Built with 💖 by</span> <span className='text-green-700 hover:text-green-600 transition-colors duration-300 font-bold'>Rajesh</span>
        </a>
        {!loading && <a href="https://forms.gle/pA75Prd8ku7t2n9n6" className='mt-3 text-black hover:text-blue-600 hover:underline' target='_blank' rel="noopener noreferrer">Feedback</a>}
      </div>
    </div>
  );
}

export default Dashboard;
