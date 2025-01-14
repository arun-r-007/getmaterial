import { useState } from 'react';
// import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { auth, addNote } from '../firebase';

import './loader.css'

import { useEffect } from 'react';
import { getNotes } from '../firebase';

import CustomSelect from './CustomSelect';

function Upload() {
  const [subjects, setSubjects] = useState([]);
  


    useEffect(() => {

      
      const fetchNotes = async () => {
        try {
          const fetchedNotes = await getNotes();

          // Normalize subject names
        const normalizedNotes = fetchedNotes.map(note => ({
          ...note,
          subject: note.subject.trim().toUpperCase(), // Normalize subject jjjjjjjjsjust test comment
        }));

  
          // Extract unique subjects
          const fetchedsubjects = [...new Set(normalizedNotes.map(note => note.subject))];

          fetchedsubjects.sort();
          fetchedsubjects.push('Not mentioned');

          setSubjects(fetchedsubjects);

        } catch (error) {
          console.error('Error fetching subjects:', error);
          setError(error.message);
        }
      };
  
      fetchNotes();


    }, []);

    
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setContributorName(user.displayName);
        } else {
          setContributorName("");
        }
      });
  
      // Cleanup the listener on unmount
      return () => unsubscribe();
    }, []);



  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('');
  // const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [contributorName, setContributorName] = useState('');

  const [module, setModule] = useState('');

  const messages = [
    "Uploading... slower than my grandma's Wi-Fi!",
    "Hold up, the bytes are arguing.",
    "Almost there... if 'there' is still far!",
    "Loading... as reliable as my alarm clock.",
    "Hang tight... I bribed the server with cookies!",
    "This upload is practicing yoga. Namaste!",
    "Loading... because teleportation is not an option!",
    "Uploading... one byte at a time, literally!",
    "Oops, the pixels went on a coffee break!",
    "Patience, the file’s catching its breath!",
    "99% done... like my eternal procrastination!",
    "Uploading... like it’s dragging its feet home.",
    "Relax, the file's just stuck in traffic!",
    "Loading... it’s in no rush, unlike you.",
    "Uploading... fueled by hopes and prayers.",
    "Processing... with the speed of a sloth!",
    "Just a sec... or maybe an eternity.",
    "Uploading... trying to find the right vibe!",
    "Loading... it's waiting for applause!",
    "Uploading... slower than me on a treadmill.",
    "Oops, the bytes took a wrong turn!",
    "This upload’s in the queue behind a snail.",
    "Almost done... or am I lying?",
    "Uploading... because teleporting bytes is illegal.",
    "Waiting... because why not?",
    "Hold on, it’s buffering its confidence.",
    "Uploading... powered by hamster wheels!",
    "Relax, it’s on bytecation.",
    "Loading... slower than my last breakup.",
    "This upload’s stuck in existential dread!",
    "Uploading... we’re counting sheep, too!",
    "Hold up... the bytes are stretching first.",
    "Uploading... not running, just strolling.",
    "Bytes loading... but first, a selfie!",
    "Processing... the bytes are shy today.",
    "Uploading... slower than a dial-up modem.",
    "Relax, the bytes are on union break!",
    "Almost there... on a cosmic timeline.",
    "Uploading... the file’s learning patience.",
    "Oops, it took the scenic route!",
    "Loading... it's meditating on life choices.",
    "Uploading... like it’s writing a novel.",
    "Pixels stuck in a philosophical debate.",
    "Uploading... slower than me before coffee.",
    "Processing... powered by wishful thinking!",
    "Hold tight... the bytes are gossiping!",
    "Uploading... powered by good vibes only.",
    "Almost done... just redefining 'almost.'",
    "Uploading... even turtles are laughing!",
    "Loading... it’s probably napping!",
    "Uploading... let’s just hope for the best.",
    "Relax... the bytes are on their way!"
];




  const [message, setMessage] = useState(messages[0]);


  const [uploadedFileLink, setUploadedFileLink] = useState('');
const [uploadedFileId, setUploadedFileId] = useState('');



  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 500 * 1024 * 1024) { // 500MB limit
        setError('File size must be less than 500MB');
        return;
      }
  
      if (selectedFile.type.startsWith('video/')) {
        setError('Video files are not allowed');
        return;
      }
  
      if (selectedFile.type.startsWith('audio/')) {
        setError('Audio files are not allowed');
        return;
      }
  
      setFile(selectedFile);
      setError(null);
  
      try {
  
        // Upload file to Google Drive
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('file', selectedFile);
  
        const response = await axios.post(
          'https://getmaterial-fq27.onrender.com',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
  
        const { fileLink, fileId } = response.data;
  
        // Save the uploaded file's link and ID to state
        setUploadedFileLink(fileLink);
        setUploadedFileId(fileId);
  
        console.log('File uploaded successfully:', fileLink);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError('Failed to upload file. Please try again.');
      }
    }
  };
  



  const [selectedSubject, setSelectedSubject] = useState('');
  const [newSubject, setNewSubject] = useState('');


  const handleAddSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setSelectedSubject(newSubject);
      setNewSubject('');
    } else {
      setError('Subject already exists or is empty'); // Use state instead of alert
    }
  };








  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
  
    if (!user) {
      setError('You must be authenticated to submit the form.');
      alert('Redirecting to login page...');
      navigate('/auth');
      return;
    }
  
    if (!uploadedFileLink || !uploadedFileId) {
      setError('Please select and upload a file before submitting.');
      return;
    }
  
    setUploading(true);
    setError(null);
  
    try {
      // Prepare the note data with pre-uploaded file details
      const noteData = {
        name: title,
        semester,
        subject: selectedSubject,
        contributorName,
        module,
        fileUrl: uploadedFileLink,
        fileId: uploadedFileId,
        likes: 0,
      };
  
      // Add note to Firestore
      await addNote(noteData);
  
      console.log('Form submitted successfully.');
      alert('Note uploaded successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  

  return (
    <div className="container mx-auto px-4 pt-2">
      <h1 className="text-3xl font-bold mb-3 text-center">Upload Note</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="upload-container max-w-md bg-gradient-to-r px-6 py-5 rounded-lg mx-auto space-y-4">


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border-dashed border-black border rounded-xl focus:ring-2 focus:ring-green-500"
            required
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject (if not mentioned, select 'Not mentioned')
          </label>

          <CustomSelect
            options={subjects}
            placeholder={selectedSubject || "Select a subject"}
            onChange={(selectedOption)=> setSelectedSubject(selectedOption)}
          />

          {/* Conditionally render the input field when 'Not mentioned' is selected */}
          {selectedSubject === 'Not mentioned' && (
            <div className="mt-2 flex">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add new subject"
                className="w-full p-2 border rounded-l-lg focus:ring-1 focus:ring-green-500"
              />
              <button
                onClick={handleAddSubject}
                className="bg-green-500 text-white px-4 rounded-r-lg"
              >
                Add
              </button>
            </div>
          )}
        </div>







        <div className='flex gap-5'>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select Module</option>
              {["Module: 1", "Module: 2", "Module: 3", "Module: 4", "Module: 5", "assignments", "questions", "others"].map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details/Teacher name/Section
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Shankar sir , sec-D , handwritten notes"
            className="w-full p-2 border rounded-lg focus:ring-1 font-semibold"
            required
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name (optional)
          </label>
          <input
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 border rounded-lg focus:ring-1"
          />
        </div>


        <button
          type="submit"
          disabled={uploading || !file}
          className={`w-full ${uploading || !file
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
            } text-black font-semibold  p-2 rounded transition duration-200`}
        >
          {uploading ? 'Uploading...' : 'Upload Note'}
        </button>
      </form>

      {uploading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-50">
          <div className="p-3 bg-yellow-100 border flex-col flex border-yellow-400 text-yellow-700 rounded transition-all duration-300 text-center w-[300px] md:right-10 right-3">
            <span className="text-green-600 text-center pb-2">uploading...</span>
            {message}
          </div>
        </div>
      )}





    </div>
  );
}

export default Upload;