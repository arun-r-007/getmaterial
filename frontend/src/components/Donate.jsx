import React from "react";

import qrImage from "../assets/PhonePeQR_GM.png"

const Donate = () => {
  return (
    <div className="flex flex-col items-center justify-center md:mt-16 mt-5 min-h-screen p-6">
      <div className="bg-white shadow-lg rounded-2xl md:p-8 p-5 max-w-md text-center">
        <h1 className="md:text-2xl text-lg font-bold text-zinc-700">Support Our Mission</h1>
        <p className="text-gray-600 mt-2 md:text-lg text-xs">
          Our <span className="text-amber-600 font-semibold">database costs</span> are increasing, and we need your <span className="text-green-600 font-semibold">support</span> to keep our services <span className="text-green-600 font-semibold">free</span> forever.
        </p>
        
        {/* QR Code Section */}
        <div className="mt-6">
          <img 
            src={qrImage}
            alt="Donate QR Code" 
            className=" mx-auto border p-2 rounded-lg shadow-md" 
          />
          <p className="text-gray-500 md:text-sm text-xs mt-2">Scan the QR code to donate via UPI</p>
        </div>

        

        {/* Thank You Message */}
        <p className="text-gray-500 md:text-sm text-xs mt-4">Every contribution helps us grow. Thank you for your support!</p>
      </div>
    </div>
  );
};

export default Donate;
