import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, Expand, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { auth } from "../firebase";

import whatsapplogo from '../assets/whatsapp-logo.png'

function NotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const noteUrl = searchParams.get("url");
  const noteId = searchParams.get("id");
  const decodedUrl = noteUrl ? decodeURIComponent(noteUrl) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);




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
    const message = `Check out the notes on GetMaterial 📚\n\n📄 ${fileName}\n🔗 ${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank"); // Open WhatsApp with the message
  };
  


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
            onClick={handleShare}
          >
            <img src={whatsapplogo} alt="share" className="rounded-md hover:border-2 border-gray-300 size-10" />
          </button>


          <button
            onClick={handleDownload}
            disabled={isDownloading || urlFetching}
            className=" border downloadButton border-black rounded transition-all text-black px-4 py-2 duration-300 flex items-center gap-2"
          >
            {isDownloading || urlFetching ? <div className="loader2 transition-all duration-300"></div> : <Download size={20} />}
            {isDownloading || urlFetching ? <h1 className="hidden md:flex">processing..</h1> : <h1 className="hidden md:flex">Download</h1>}
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


      <div className="max-w-5xl mx-auto gap-4">
        {/* Preview Section - 8 columns on desktop */}
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



    </div>
  );
}

export default NotePage;
