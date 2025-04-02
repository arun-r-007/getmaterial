import React from "react";
import { useState } from "react";

import qrImage from "../assets/PhonePeQR_GM.png"

const Donate = () => {

  const [amount, setAmount] = useState(20); // Default amount is ₹20

  const handlePayment = () => {
    const upiLink = `upi://pay?pa=9692544587@ibl&cu=INR&am=${amount}&tn=GetMaterialDonation`;
    window.location.href = upiLink; // Redirect to UPI payment app
  };

  return (
    <div className="flex flex-col items-center justify-center md:mt-16 mt-20 min-h-full p-6">
      <div className="bg-white shadow-lg rounded-2xl md:p-8 p-5 max-w-md text-center pb-10">
        <h1 className="md:text-2xl text-lg font-bold text-zinc-700">Support Our Mission</h1>
        <p className="text-gray-600 mt-2 md:text-lg text-xs">
          Our <span className="text-amber-600 font-semibold">database costs</span> are increasing, and we need your <span className="text-green-600 font-semibold">support</span> to keep our services <span className="text-green-600 font-semibold">free</span> forever.
        </p>



        {/* QR Code Section */}
        <div className="mt-6">
          <img
            src={qrImage}
            alt="Donate QR Code"
            className=" mx-auto size-48 md:size-full border p-2 rounded-lg shadow-md"
          />
        </div>


          <p className="text-gray-500 md:hidden block md:text-sm text-xs mt-5">OR</p>
        <div className="flex flex-col md:hidden items-center gap-4 mt-5">
          {/* Input field for amount */}
          <div className="flex w-40  flex-row justify-center items-center gap-2">
            <h1>
              Amount :
            </h1>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 px-2 py-1 w-20 rounded-md text-center"
              min="1"
            />
          </div>

          {/* Pay with PhonePe button */}
          <button
            onClick={handlePayment}
            className="bg-green-600 hover:bg-green-700 text-white w-40 px-5 py-3 font-semibold rounded-md shadow-md transition duration-300"
          >
            Pay via UPI
          </button>
        </div>




      </div>
        {/* Thank You Message */}
        <p className="text-gray-500 md:text-sm text-center text-xs mt-10">Every contribution helps us grow. Thank you for your support!</p>
    </div>
  );
};

export default Donate;
