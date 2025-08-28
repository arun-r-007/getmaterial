import React, { useState } from "react";
import qrImage from "../assets/PhonePeQR_GM.png";
import phonePeLogo from "../assets/phonepe.png";
import gpayLogo from "../assets/googlepay.jpeg";
import paytmLogo from "../assets/paytm.png";
import { FiCheck, FiCopy } from "react-icons/fi";

const Donate = () => {
  const upiID = "9692544587@ibl";
  const [copied, setCopied] = useState(false);

  const copyUPI = () => {
    navigator.clipboard.writeText(upiID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen mt-14 md:p-10 p-5 w-full">
      <div className="bg-white w-full shadow-lg rounded-2xl p-6 md:p-8 max-w-md text-center">
        {/* Heading */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Support Our Mission</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          Our <span className="text-amber-600 font-semibold">database costs</span> are increasing, and we need your{" "}
          <span className="text-green-600 font-semibold">support</span> to keep our services{" "}
          <span className="text-green-600 font-semibold">free</span> forever.
        </p>

        {/* QR Code */}
        <div className="mt-6">
          <img
            src={qrImage}
            alt="Donate QR Code"
            className="mx-auto w-36 md:w-48 border p-2 rounded-lg shadow-md"
          />
        </div>

        {/* OR Separator */}
        <div className="flex items-center justify-center my-4">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>

        {/* UPI ID Copy Section */}
        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg shadow-md mt-4">
          <span className="text-xs md:text-base font-semibold flex-1 text-left pl-2">{upiID}</span>
          <button
            onClick={copyUPI}
            className="bg-blue-500 text-xs hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1"
          >
            {copied ? <FiCheck className="text-white" /> : <FiCopy className="text-white" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Payment App Icons */}
        <div className="mt-6">
          <p className="text-sm text-gray-700 mb-3">Copy above ID and Open your payment app:</p>
          <div className="flex justify-center items-center gap-4 md:gap-8">

            {/* Google Pay Button */}
            <a
              href="gpay://upi/pay?pa=9692544587@ibl&pn=RecipientName"
              className="w-10 rounded-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 shadow-md transition duration-300"
            >
              <img src={gpayLogo} alt="Google Pay" className="w-8 p-1 md:w-10 h-8 md:h-10 object-contain" />
            </a>

            {/* PhonePe Button */}
            <a
              href="phonepe://search?query=9692544587@ibl"
              className="w-10 rounded-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 shadow-md transition duration-300"
            >
              <img src={phonePeLogo} alt="PhonePe" />
            </a>

            {/* Paytm Button */}
            <a
              href="paytmmp://upi/pay?pa=9692544587@ibl"
              className="w-10 rounded-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 shadow-md transition duration-300"
            >
              <img src={paytmLogo} alt="Paytm" />
            </a>


          </div>
        </div>

        {/* Small Note */}
        <p className="text-gray-500 text-xs mt-6">
          Copy the UPI ID and paste it in your preferred payment app to complete your donation.
        </p>
      </div>

      {/* Thank You Message */}
      <p className="text-gray-500 text-sm text-center mt-8 mb-4">
        Every contribution helps us grow. Thank you for your support! ❤️
      </p>
    </div>
  );
};

export default Donate;
