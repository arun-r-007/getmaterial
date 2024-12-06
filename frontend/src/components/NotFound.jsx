import React from "react";
import logo from "../assets/GM logo 2.png"; // Replace with the correct path to your logo

function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-green-400 to-emerald-300 text-white text-center">
      <img src={logo} alt="GM Logo" className="w-24 h-auto mb-6" />
      <h1 className="text-4xl text-black font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6 text-red-800 font-bold max-w-lg mx-auto">
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <a href="/" className="bg-black text-white px-6 py-3 text-xl rounded-md hover:bg-gray-700 transition duration-300">
        Go Back to Home
      </a>
    </div>
  );
}

export default NotFound;
