import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Linkedin } from 'lucide-react';

import { Button } from '@headlessui/react';

import './loader.css'

function Navbar({ user }) {


 const handleSignOut = async () => {
  const userConfirmed = window.confirm("Are you sure you want to sign out?");
  
  if (userConfirmed) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  } else {
    console.log("Sign out canceled by the user.");
  }
};




  return (
    <nav className="bg-black">
      <div className="container mx-auto flex justify-between p-4 items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          Get <span className='text-green-400'>Material</span>
        </Link>
        <div>
          {user ? (
            <>
              <Link to="/upload" className="text-black md:text-base bg-white md:py-2 md:px-5 text-sm px-1 mr-2 border-white border-4 rounded-3xl md:mr-4 font-semibold hover:rounded-xl transition-all duration-300">
                Upload
              </Link>
              <button onClick={handleSignOut} className="text-white md:text-base bg-black opacity-80 text-xs font-semibold md:py-2 md:px-4 rounded-lg hover:text-red-500 transition-colors duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <div className='flex justify-center'>
              <Link to="/auth" className="text-black font-bold text-sm w-1/2 text-center md:w-full md:text-base bg-gradient-to-r from-cyan-400 to-green-500 md:py-3 md:px-4 rounded-lg hover:underline">
                Become a Contributor
              </Link>

              {/* LinkedIn Button */}
              <Button className="px-2 md:px-3">
                <a
                  href="https://www.linkedin.com/in/talagana-rajesh-75a546289/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex group relative bg-gray-100 hover:bg-blue-500 transition-colors duration-300 p-3 rounded-lg items-center gap-1 text-white"
                >
                  <Linkedin size={16} className="md:size-6 text-black" />
                </a>
              </Button>

            </div>

          )}
        </div>
      </div>
      <div className='border-gray-300 border-2 '></div>
    </nav>
  );
}

export default Navbar;