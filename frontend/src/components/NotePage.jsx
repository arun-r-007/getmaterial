import { useState, useEffect } from "react";
import { ArrowBigLeftIcon, ArrowDownLeft, ArrowLeft, ArrowLeftCircle, ArrowUpLeft, Download, Expand } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

function NotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const noteUrl = searchParams.get("url");
  const decodedUrl = noteUrl ? decodeURIComponent(noteUrl) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

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


  const handleDownload = async () => {
    if (!embedUrl) return;

    setIsDownloading(true); // Show loader on Download button

    try {
      let finalUrl = embedUrl;

      // 🔹 If the file is from Google Drive, force download
      if (embedUrl.includes("drive.google.com")) {
        const fileIdMatch = embedUrl.match(/[-\w]{25,}/); // Extract file ID
        if (fileIdMatch) {
          const fileId = fileIdMatch[0];
          finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      // 🔹 Create an anchor tag to force download
      const link = document.createElement("a");
      link.href = finalUrl;
      link.setAttribute("download", "note-file"); // Default filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(embedUrl, "_blank"); // Fallback to open in a new tab
    } finally {
      setTimeout(() => setIsDownloading(false), 2000); // Ensures the loader appears before hiding
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
      <div className="max-w-6xl mx-auto">
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
              className=" border downloadButton border-black rounded transition-all text-black px-4 py-2 duration-300 flex items-center gap-2"
            >
              {isDownloading ? <div className="loader2 transition-all duration-300"></div> : <Download size={20} />}
              {isDownloading ? <h1 className="hidden md:flex">Downloading..</h1> : <h1 className="hidden md:flex">Download</h1> }
            </button>

            <div className="">
              <a
                href={decodedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-100 text-black border border-black px-4 py-2 rounded hover:bg-yellow-200 transition-colors flex items-center gap-2"
              >
                <Expand size={20}/>
                <h1 className="hidden md:flex">Full Preview</h1>
              </a>
            </div>

          </div>
        </div>

        {/* Loader for iframe */}
        {isLoading && (
          <div className="h-[calc(100vh-12rem)] flex justify-center items-center">
            <div className="loader"></div>
          </div>
        )}

        {/* File Viewer */}
        <div
          className={`rounded-lg border border-black h-[calc(100vh-11rem)] ${isLoading ? "hidden" : ""
            }`}
        >
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg overflow-auto"
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
