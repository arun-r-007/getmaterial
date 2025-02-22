import { useState, useEffect,useRef } from "react";
import { ArrowLeft, Download, Expand, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";

import { auth } from "../firebase";


import { db } from "../firebase"; // Ensure Firebase is properly configured
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { use } from "react";


const ADMIN_MAIL = "talaganarajesh25@gmail.com";


function NotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const noteUrl = searchParams.get("url");
  const noteId = searchParams.get("id");
  const decodedUrl = noteUrl ? decodeURIComponent(noteUrl) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);



  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const postButtonRef = useRef(null);

  const [urlFetching, setUrlFetching] = useState(true);
  const [finalUrl, setFinalUrl] = useState("");
  const [fileName, setFileName] = useState("GetMaterial-notes.pdf");



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
    const q = query(commentsRef, orderBy("timestamp", "desc"));

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
  },[]);


  const handleKey = (e) => {
    if (e.key === "Enter") {
      postButtonRef.current?.click();
    }
  };





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
            }

            // Construct direct download URL
            tempUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
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
      <div className="container mx-auto p-4">
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

  return (
    <div className="container mx-auto md:mt-24 mt-16">
      {/* Header */}
      <div className="flex justify-between items-center p-4 rounded-lg shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-100 text-black border border-black px-4 py-2 rounded hover:bg-yellow-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading || urlFetching}
            className=" border downloadButton border-black rounded transition-all text-black px-4 py-2 duration-300 flex items-center gap-2"
          >
            {isDownloading ||urlFetching ? <div className="loader2 transition-all duration-300"></div> : <Download size={20} />}
            {isDownloading|| urlFetching ? <h1 className="hidden md:flex">processing..</h1> : <h1 className="hidden md:flex">Download</h1>}
          </button>

          <div className="">
            <a
              href={decodedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-100 text-black border border-black px-4 py-2 rounded hover:bg-yellow-200 transition-colors flex items-center gap-2"
            >
              <Expand size={20} />
              <h1 className="hidden md:flex">Full Preview</h1>
            </a>
          </div>

        </div>
      </div>


      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
        {/* Preview Section - 8 columns on desktop */}
        <div className="col-span-12 lg:col-span-8">
          {isLoading && (
            <div className="h-[calc(100vh-12rem)] flex justify-center items-center">
              <div className="loader"></div>
            </div>
          )}

          <div className={`rounded-lg border mx-8 md:mx-0 border-black h-[calc(100vh-11rem)] ${isLoading ? "hidden" : ""}`}>
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg bg-white"
              title="Note Viewer"
              allow="fullscreen"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* Comments Section - 4 columns on desktop */}
        <div className="col-span-12 lg:col-span-4 border rounded-lg md:h-[calc(100vh-11rem)] max-h-96 md:max-h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Comments</h2>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {comments.length === 0 && (
              <div className="text-center text-gray-500 mt-20">No comments yet</div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex border-b-2 pb-2 flex-col space-y-1">
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
            ))}
          </div>

          {/* Comment Input */}
          {currentUser ? (
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center">
                <input
                  type="text"
                  onKeyDown={handleKey}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border border-gray-400 rounded-l-lg px-3 py-2"
                />
                <button
                  ref={postButtonRef}
                  onClick={addComment}
                  className="bg-black border border-black text-white px-4 py-2 rounded-r-lg hover:bg-gray-800"
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t text-center">
              <p className="text-sm text-gray-500">Please sign in to comment</p>
            </div>
          )}
        </div>
      </div>



    </div>
  );
}

export default NotePage;
