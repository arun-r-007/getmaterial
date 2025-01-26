import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Linkedin } from 'lucide-react';
import { LogOutIcon } from 'lucide-react';
import { UserIcon } from 'lucide-react';


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
    <nav className="bg-black">
      <div className="container mx-auto flex justify-between md:py-3 p-2 items-center">
        <Link to="/" className="text-white md:text-2xl text-lg font-bold">
          Get <span className='text-green-400'>Material</span>
        </Link>
        <div>
          {user ? (
            <div className='flex justify-center items-center'>
              <Link to="/upload" className="text-black md:text-base bg-white md:py-1.5 md:px-5 text-sm px-3 py-1 mr-2 border-white border-4 rounded-3xl md:mr-4 font-semibold hover:rounded-xl transition-all duration-300">
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
            <div className='flex justify-end items-center'>
              <Link to="/auth" className="text-black font-bold text-xs w-full text-center md:w-full md:text-sm bg-gradient-to-r from-green-400 to-green-500 md:py-3 p-2 hover:underline md:px-3 rounded-md">
                Contribute
              </Link>

              {/* LinkedIn Button */}
              <Button className="px-2 md:px-3">
                <a
                  href="https://www.linkedin.com/in/talagana-rajesh-75a546289/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex group relative bg-gray-100 hover:bg-blue-500 transition-colors duration-300 p-2 md:p-2 rounded-lg items-center gap-1 text-white"
                >
                  <Linkedin size={16} className="md:size-6 size-4 text-black" />
                </a>
              </Button>

            </div>

          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;