import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Linkedin } from 'lucide-react';
import { LogOutIcon } from 'lucide-react';
import { UserIcon } from 'lucide-react';

import myPhoto3 from '../assets/myphoto3.jpg';


import { Button } from '@headlessui/react';

import './loader.css'

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from 'react';


function Navbar({ user }) {

  const googleColors = [
    "#BF360C",  // Orange
    "#D32F2F",  // Red
    "#388E3C",  // Green
    "#0288D1",  // Light Blue
    "#F57C00",  // Amber
    "#8E24AA",  // Purple
    "#0288D1",  // Cyan
    "#7B1FA2",  // Deep Purple
    "#FF5722",  // Deep Orange
  ];
  

  // Universal hash function
const getHashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Map hash to color
const getColorFromHash = (str) => {
  const hash = getHashCode(str);
  return googleColors[hash % googleColors.length];
};

  



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



  const [userIcon, setUserIcon] = useState(null);
  const [userColor, setUserColor] = useState(null);

  useEffect(() => {
    if (user) {
      setUserIcon(user.displayName[0].toUpperCase());
      const bgColor = getColorFromHash(user.displayName);
      setUserColor(bgColor);
    }
  },[user]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // Ref for the menu

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };


  // Close the menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);





  return (
    <nav className="shadow-md fixed z-50 bg-yellow-50 rounded-full w-full max-w-7xl px-5">
      <div className="container  mx-auto flex justify-between md:py-3 p-2 items-center">
        <Link to="/" className="text-black md:text-2xl text-lg font-bold">
          Get <span className='text-[#25d366]'>Material</span>
        </Link>
        <div>
          {user ? (
            <div className='flex justify-center items-center'>
              <Link to="/upload" className="text-black md:text-base uploadButton md:py-2 md:px-5 text-sm px-3 py-1 mr-2 border-black border-[1px] rounded-3xl md:mr-4 font-semibold hover:rounded-xl transition-all duration-300">
                Upload
              </Link>
              <div className='relative' ref={menuRef}>

                <button
                  onClick={toggleMenu}

                  className='text-black rounded-full size-8 md:size-10 md:hover:opacity-90 transition-all font-semibold'
                  style={{backgroundColor: userColor}}
                >
                  {userIcon}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ul className="py-2 px-1 bg-amber-50 rounded-xl">
                        <li className="px-4 py-0 flex justify-start items-center rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer">
                          <UserIcon size={20} className='mr-2'/>
                          <Link to="/auth" onClick={toggleMenu} className=' pr-0 py-2'>Change Account</Link>
                        </li>
                        <li className="px-4 py-2 flex justify-start items-center rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer" onClick={handleSignOut}>
                          <LogOutIcon size={16} className="mr-2" />
                          <p>Log out</p>
                        </li>
                      </ul>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>
            </div>
          ) : (
            <div className='flex justify-end items-center gap-3'>
              <Link to="/auth" className="text-black bg-[#25d366] hover:text-white delay-200 transition-all contributeButton font-semibold text-xs w-full text-center md:w-full md:text-sm  md:py-3 p-2 md:px-3 rounded-full border-[1px] border-black">
                  Contribute
              </Link>

              {/* LinkedIn Button */}
                <Link
                  to="/about"
                >
                  <img src={myPhoto3} alt="rajesh" className='w-[50px] h-[30px] md:w-[68px] md:h-[40px] hover:brightness-90 transition-all rounded-full ' />
                </Link>

            </div>

          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;