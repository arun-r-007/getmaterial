import React, { useState } from "react";
import qrImage from "../assets/PhonePeQR_GM.png";
import phonePeLogo from "../assets/phonepe.png";
import gpayLogo from "../assets/googlepay.png";
import paytmLogo from "../assets/paytm.png";
import { FiCheck, FiCopy } from "react-icons/fi"; // Import icons for copy animation

const Donate = () => {
  const upiID = "9398377748@axl";
  const [copied, setCopied] = useState(false);

  const copyUPI = () => {
    navigator.clipboard.writeText(upiID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen mt-10 p-10 w-full">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
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

        {/* UPI ID Copy Section */}
        <div className="flex items-center gap-2 bg-gray-100 p-3 mt-5 rounded-lg shadow-md">
          <span className="text-lg font-semibold">{upiID}</span>
          <button
            onClick={copyUPI}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
          >
            {copied ? <FiCheck className="text-white" /> : <FiCopy className="text-white" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>



        {/* Payment Buttons with Logos */}
        <div className="flex flex-row items-center gap-4 mt-5">
          <a
            href="phonepe://search?query=9398377748@axl"
            className="w-20 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-md shadow-md p-3 transition duration-300"
          >
            <img src={phonePeLogo} alt="PhonePe" className="w-8 h-8" />
          </a>

          <a
            href="tez://upi/pay?pa=9398377748@axl"
            className="w-20 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-md shadow-md p-3 transition duration-300"
          >
            <img src={gpayLogo} alt="Google Pay" className="w-fit h-8" />
          </a>

          <a
            href="paytmmp://upi/pay?pa=9398377748@axl"
            className="w-20 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-md shadow-md p-3 transition duration-300"
          >
            <img src={paytmLogo} alt="Paytm" className="w-fit h-8" />
          </a>
        </div>
      </div>

      {/* Thank You Message */}
      <p className="text-gray-500 text-sm text-center mt-10">
        Every contribution helps us grow. Thank you for your support! ❤️
      </p>
    </div>
  );
};

export default Donate;
