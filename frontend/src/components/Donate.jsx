import React, { useState } from "react";
import qrImage from "../assets/PhonePeQR_GM.png";
import phonePeLogo from "../assets/phonepe.png";
import gpayLogo from "../assets/googlepay.png";
import paytmLogo from "../assets/paytm.png";
import { FiCheck, FiCopy } from "react-icons/fi"; // Import icons for copy animation

const Donate = () => {
  const upiID = "9692544587@ibl";
  const payeeName = "GetMaterial";
  const [copied, setCopied] = useState(false);

  const copyUPI = () => {
    navigator.clipboard.writeText(upiID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen mt-14 md:p-10 p-5 w-full">
      <div className="bg-white w-full shadow-lg rounded-2xl p-8 max-w-md text-center">
        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800">Support Our Mission</h1>
        <p className="text-gray-600 mt-2">
          Our <span className="text-amber-600 font-semibold">database costs</span> are increasing, and we need your{" "}
          <span className="text-green-600 font-semibold">support</span> to keep our services{" "}
          <span className="text-green-600 font-semibold">free</span> forever.
        </p>

        {/* QR Code */}
        <div className="mt-6">
          <img
            src={qrImage}
            alt="Donate QR Code"
            className="mx-auto w-48 border p-2 rounded-lg shadow-md"
          />
        </div>

        {/* OR Separator */}
        <p className="text-gray-500 text-sm mt-4">OR</p>

        {/* Google Pay Button - Takes Full Width */}
        <a
          href={`upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&cu=INR`}
          className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-3xl shadow-md p-3 transition duration-300 mt-4"
        >
          <img src={gpayLogo} alt="Google Pay" className="w-1/2" />
        </a>

        {/* Payment Buttons Row */}
        <div className="flex justify-between items-center md:gap-5 gap-2 mt-8">
          {/* UPI ID Copy Section */}
          <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg shadow-md flex-1">
            <span className="md:text-lg text-xs font-semibold">{upiID}</span>
            <button
              onClick={copyUPI}
              className="bg-blue-500 text-xs hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1"
            >
              {copied ? <FiCheck className="text-white" /> : <FiCopy className="text-white" />}
              {/* {copied ? "Copied!" : "Copy"} */}
            </button>
          </div>

          {/* PhonePe Button */}
          <a
            href={`upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&cu=INR`}
            className="w-10 rounded-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 shadow-md transition duration-300"
          >
            <img src={phonePeLogo} alt="PhonePe"/>
          </a>

          {/* Paytm Button */}
          <a
            href={`upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&cu=INR`}
            className="w-10 rounded-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 shadow-md transition duration-300"
          >
            <img src={paytmLogo} alt="Paytm" />
          </a>
        </div>
        
        {/* Small Note */}
        <p className="text-gray-500 text-xs mt-4">For PhonePe and Paytm, copy UPI ID and paste into the app.</p>
      </div>

      {/* Thank You Message */}
      <p className="text-gray-500 text-sm text-center mt-10">
        Every contribution helps us grow. Thank you for your support! ❤️
      </p>
    </div>
  );
};

export default Donate;