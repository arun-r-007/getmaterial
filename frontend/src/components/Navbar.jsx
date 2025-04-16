import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { BookOpen, Handshake } from 'lucide-react';
import { LogOutIcon } from 'lucide-react';
import { UserIcon } from 'lucide-react';
import { User } from 'lucide-react';
import { MessageCircle } from 'lucide-react';

import { HandHeart} from "lucide-react";


import myPhoto3 from '../assets/myphoto3.jpg';
import placeholder from '../assets/placeholder.svg';

import { Button } from '@headlessui/react';

import './loader.css'

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from 'react';


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
    <nav className="shadow-md fixed border border-amber-200 mt-2 flex items-center z-50 bg-yellow-50 rounded-full w-full max-w-7xl px-5">
      <div className="container  mx-auto flex justify-between md:py-3 p-2 items-center">
        <Link to="/" className="text-black md:text-2xl text-lg font-bold">
          Get <span className='text-[#25d366]'>Material</span>
        </Link>
        <div>
          {user ? (
            <div className='flex  justify-center items-center'>
              <div className="relative group">
                <a
                  className="font-semibold md:block hidden hover:animate-none duration-1000 mx-4 border-green-400 border p-2 rounded text-green-500 hover:bg-green-100 transition-all"
                  href="https://oroom.vercel.app/study"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask Doubts
                </a>
                <span className="absolute left-1/2 md:block hidden -translate-x-1/2 bottom-full w-max bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  OpenRoom
                </span>
              </div>

              <Link to="/upload" className="text-black md:text-base uploadButton md:py-2 md:px-5 text-sm px-3 py-1 mr-2 border-black border-[1px] rounded-3xl md:mr-4 font-semibold hover:rounded-xl transition-all duration-300">
                Upload
              </Link>
              <div className='relative' ref={menuRef}>

                <button
                  onClick={toggleMenu}
                  className='text-black rounded-full size-7 mt-0.5 md:size-10 md:hover:opacity-90 transition-all font-semibold'
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL || placeholder} alt="Profile" className="md:w-9 md:h-9 rounded-full" />
                  ) : (
                    <User className="w-9 rounded-full p-1 h-9 bg-gray-300 text-gray-500" />
                  )}
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
                      <ul className="pb-2 px-1 bg-amber-50 rounded-xl">
                        <li className=" py-2 border-b border-gray-400 rounded-sm hover:bg-amber-100 transition-all font-semibold cursor-pointer">
                          <Link to="/userpage" onClick={toggleMenu} className='flex px-4 justify-start items-center' >
                            <UserIcon size={20} className='mr-2' />
                            <h1 className=' pr-0 py-2'>Your Profile</h1>

                          </Link>
                        </li>

                        <li className=' mt-2 py-0 rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer'>
                          <Link to="/donate" onClick={toggleMenu} className='flex px-4 justify-start items-center '>
                            <HandHeart size={20} className='mr-2' />
                            <h1 className='py-2'>Donate us</h1>
                          </Link>
                        </li>

                        <li className=' mt-2 py-0 rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer'>
                          <Link to="/about" onClick={toggleMenu} className='flex px-4 justify-start items-center '>
                            <BookOpen size={20} className='mr-2' />
                            <h1 className='py-2'>About us</h1>
                          </Link>
                        </li>

                        <li>
                          <a className='font-semibold flex items-center duration-1000 mx-4 border-b-2 py-2 rounded text-green-500 hover:bg-green-100 transition-all' href="https://oroom.vercel.app/study" target="_blank" rel="noopener noreferrer">
                            <MessageCircle size={20} className='mr-2' />
                            OpenRoom
                          </a>
                        </li>

                        <li className="px-4 pt-3 py-2 text-red-500 flex justify-start items-center rounded-2xl hover:bg-amber-100 transition-all font-semibold cursor-pointer" onClick={handleSignOut}>
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
            <div className='flex justify-end items-center md:gap-3 gap-2'>

              <div className="relative group">
                <a
                  className="font-semibold md:block hidden hover:animate-none duration-1000 border-green-300 border p-2 rounded text-green-500 hover:bg-green-100 transition-all"
                  href="https://oroom.vercel.app/study"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask Doubts
                </a>
                <span className="absolute left-1/2 md:block hidden -translate-x-1/2 bottom-full w-max bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  OpenRoom
                </span>
              </div>

              <Link to="/auth" className="text-black bg-[#25d366] hover:text-white delay-200 transition-all contributeButton font-semibold text-xs w-full text-center md:w-fit md:text-sm  md:py-3 px-1 py-2 md:px-4 rounded-full border-[1px] border-black">
                Upload notes
              </Link>

              <Link
                to="/about"
              >
                <img src={myPhoto3} alt="rajesh" className=' h-[30px] w-[50px] md:h-[40px] md:w-fit hover:brightness-90 transition-all rounded-full ' />
              </Link>

            </div>

          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;