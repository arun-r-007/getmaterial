import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, Expand, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";


import whatsapplogo from '../assets/whatsapp-logo.png'


import { serverTimestamp } from "firebase/firestore";

import { auth } from "../firebase";


import { db } from "../firebase"; // Ensure Firebase is properly configured
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";


const ADMIN_MAIL = import.meta.env.VITE_ADMIN_MAIL;


function NotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const noteUrl = searchParams.get("url");
  const noteSubject = searchParams.get("subject");
  const noteModule = searchParams.get('module');
  const noteContributorName = searchParams.get("contributor");

  const noteId = searchParams.get("id");

  const decodedUrl = noteUrl ? decodeURIComponent(noteUrl) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);




  const [urlFetching, setUrlFetching] = useState(true);
  const [finalUrl, setFinalUrl] = useState("");
  const [fileName, setFileName] = useState("GetMaterial-notes.pdf");






  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("drive.google.com")) {
      return url.replace("/view", "/preview");
    }
    return url;
  };

  const embedUrl = getEmbedUrl(decodedUrl);

  // Loader for iframe
  useEffect(() => {
    if (embedUrl) {
      setIsLoading(true);
    }
  }, [embedUrl]);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);





  useEffect(() => {
    const fetchUrl = async () => {
      if (!embedUrl) return;
      setUrlFetching(true);

      try {
        let tempUrl = embedUrl;
        let tempFileName = "GetMaterial-notes.pdf";

        if (embedUrl.includes("drive.google.com")) {
          const fileIdMatch = embedUrl.match(/[-\w]{25,}/);
          if (fileIdMatch) {
            const fileId = fileIdMatch[0];
            const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

            // Fetch file metadata to get the actual file name
            const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name&key=${apiKey}`;
            const metadataResponse = await fetch(metadataUrl);
            const metadata = await metadataResponse.json();

            if (metadata && metadata.name) {
              tempFileName = metadata.name;
              setFileName(tempFileName);

            }

            // Construct direct download URL
            tempUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
            setFinalUrl(tempUrl);

          }
        }

        setFinalUrl(tempUrl);
        setFileName(tempFileName);
      } catch (error) {
        console.error("Failed to fetch file URL:", error);
      } finally {
        setUrlFetching(false);
      }
    };

    fetchUrl();
  }, [embedUrl]);



  const handleDownload = async () => {
    if (!finalUrl) return;

    setIsDownloading(true);

    try {
      // Fetch file as a blob
      const response = await fetch(finalUrl);
      const blob = await response.blob();

      // Create a local URL and trigger the download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up after download
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(finalUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };



  if (!decodedUrl) {
    return (
      <div className="container flex flex-col justify-center items-center mt-44 mx-auto p-4">
        <div className="text-red-500 font-medium">No URL provided!</div>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }


  const handleShare = () => {
    const currentUrl = window.location.href; // Get the full URL of the page
    const message = `Check out the notes of *${noteSubject}* | *${noteModule}* by *${noteContributorName}* on *GET MATERIAL* :- \n\n *${fileName}* :\n ${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank"); // Open WhatsApp with the message
  };





  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const postButtonRef = useRef(null);




  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!noteId) return;

    const commentsRef = collection(db, "notes", noteId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text,
            userEmail: data.userEmail,
            userName: data.userName || "Anonymous",
            timestamp: formatDate(data.timestamp?.toDate()),
          };
        })
      );
    });

    return () => unsubscribe();
  }, [noteId]);

  // Function to format timestamp as dd/mm/yyyy
  const formatDate = (date) => {
    if (!date) return "Unknown Date";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Add comment with user details and timestamp
  const addComment = async () => {
    if (!currentUser) {
      alert("Please sign in to comment");
      return;
    }


    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    };

    const commentsRef = collection(db, "notes", noteId, "comments");
    await addDoc(commentsRef, {
      text: newComment,
      timestamp: serverTimestamp(),
      userEmail: currentUser.email,
      userName: currentUser.displayName || currentUser.email.split('@')[0],
    });

    setNewComment("");
  };

  const deleteComment = async (commentId) => {
    const comment = comments.find((c) => c.id === commentId);
    console.log(comment);
    const currentUserEmail = currentUser?.email;

    const isAdmin = currentUserEmail === ADMIN_MAIL;
    const isAuthor = currentUserEmail === comment?.userEmail;

    console.log(currentUserEmail);
    console.log(comment?.userEmail);

    if (!comment) {
      console.error("Comment not found");
      return;
    }

    if (!isAdmin && !isAuthor) {
      alert("Only admins and comment authors can delete comments");
      return;
    }

    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteDoc(doc(db, "notes", noteId, "comments", commentId));
      console.log("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };






  return (
    <div className="container mx-auto md:mt-24 mt-16">

      <div className="flex md:hidden justify-between items-center px-2 py-4 bg-amber-50 z-50 rounded-lg shadow-sm">

        <button
          onClick={() => navigate("/")}
          className="bg-yellow-100 mr-2 text-black border border-black px-2 py-1 rounded hover:bg-yellow-200 transition-colors flex items-center"
        >
          <ArrowLeft size={16} className="size-4" />
        </button>

        <div className="flex justify-start max-w-36 items-center">
          <h1 className=" text-xs md:font-semibold">{noteSubject} </h1>
        </div>

        <div className="flex items-center md:gap-2 gap-2">

          <button
            onClick={handleShare}
          >
            <img src={whatsapplogo} alt="share" className="rounded-md border-gray-300 size-7" />
          </button>


          <button
            onClick={handleDownload}
            disabled={isDownloading || urlFetching}
            className=" border downloadButton border-black rounded transition-all text-black md:px-2 px-2 py-1  duration-300 flex items-center gap-2"
          >
            {isDownloading || urlFetching ? <div className="loader2 transition-all my-0.5 duration-300"></div> : <Download size={16} className="size-4 md:size-auto" />}
          </button>

          <div className="">
            <a
              href={decodedUrl}
              className="bg-yellow-100 text-black border border-black md:px-2 px-2 py-1 rounded hover:bg-yellow-200 transition-colors flex items-center gap-2"
            >
              <Expand size={16} className="size-4 md:size-auto" />
            </a>
          </div>

        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-1">
        {/* Notes Preview - Takes 2/3 width on larger screens */}
        <div className="w-full md:w-2/3  ">
          {isLoading && (
            <div className="h-[calc(100vh-7rem)] flex justify-center items-center">
              <div className="loader"></div>
            </div>
          )}

          <div className={`rounded-lg border mx-4 md:mx-0 border-black h-[calc(100vh-7rem)] ${isLoading ? "hidden" : ""}`}>
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg bg-white"
              title="Note Viewer"
              allow="fullscreen"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* Comment Section - Takes 1/3 width on large screens */}
        <div className="w-full md:w-1/3 flex flex-col border-l relative h-[calc(100vh-11rem)] ">

          {/* Header */}
          <div className="md:flex hidden justify-between items-center p-2 bg-amber-50 z-50 rounded-lg shadow-sm">

            <button
              onClick={() => navigate("/")}
              className="bg-yellow-100 mr-2 text-black border border-black px-2 py-1 rounded hover:bg-yellow-200 transition-colors flex items-center"
            >
              <ArrowLeft className="size-3 md:size-4" />
            </button>

            <div className="flex max-w-52 justify-start md:gap-1 px-2 items-center">
              <h1 className="text-xs md:font-semibold">{noteSubject} </h1>
              <h1 className="text-xs md:font-semibold">|</h1>
              <h1 className=" hidden md:block text-xs md:font-semibold">{noteModule}</h1>
            </div>

            <div className="flex items-center md:gap-2 gap-2">

              <button
                onClick={handleShare}
              >
                <img src={whatsapplogo} alt="share" className="rounded-md hover:scale-110 transition-all duration-300 border-gray-300 md:size-6 size-6" />
              </button>


              <button
                onClick={handleDownload}
                disabled={isDownloading || urlFetching}
                className=" border downloadButton border-black rounded transition-all text-black md:px-2 px-2 py-1  duration-300 flex items-center gap-2"
              >
                {isDownloading || urlFetching ? <div className="loader2 transition-all my-0.5 duration-300"></div> : <Download size={16} className="size-4 md:size-auto" />}
              </button>

              <div className="">
                <a
                  href={decodedUrl}
                  className="bg-yellow-100 text-black border border-black md:px-2 px-2 py-1 rounded hover:bg-yellow-200 transition-colors flex items-center gap-2"
                >
                  <Expand size={16} className="size-4 md:size-auto" />
                </a>
              </div>

            </div>
          </div>

          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">No comments yet</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex border-b pb-2 flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.userName}</span>
                    {(currentUser?.email === comment.userEmail || currentUser?.email === ADMIN_MAIL) && (
                      <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                  <span className="text-xs text-gray-500">{comment.timestamp}</span>
                </div>
              ))
            )}
          </div>

          {/* Sticky Comment Input Bar */}
          <div className="absolute md:-bottom-16 bottom-0  left-0 w-full px-2">
            {currentUser ? (
              <div className="flex items-center">
                <textarea
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask doubt / comment..."
                  className="flex-1 border h-14 border-gray-400 rounded-l-lg px-3 py-2"
                />
                <button
                  ref={postButtonRef}
                  onClick={addComment}
                  className="bg-black h-14 border border-black text-white px-7 rounded-r-lg hover:bg-gray-800"
                >
                  Post
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">Please sign in to comment</div>
            )}
          </div>
        </div>
      </div>



    </div>


  );
}

export default NotePage;
