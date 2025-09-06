import development from '../assets/developement.png';


import arrow from '../assets/curvedarrow.png';
import ownerPhoto from '../assets/myphoto.png';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

import { Linkedin, Github, Globe } from 'lucide-react';

export default function About() {
    // useEffect(() => {
    //     window.scrollTo(0, 0);
    // }, []);

    return (
        <section className="py-20 relative">
            {/* Decorative dots */}
            <div
                className="absolute top-0 right-0 rounded-full w-32 md:w-48 h-32 md:h-48 bg-[#FFE5B4] opacity-20"
                style={{
                    backgroundImage: "radial-gradient(#B8860B 2px, transparent 2px)",
                    backgroundSize: "10px 10px",
                }}
            />
            <div
                className="absolute top-32 -left-10 md:-left-20 rounded-full w-32 md:w-48 h-32 md:h-48 bg-[#FFE5B4] opacity-20"
                style={{
                    backgroundImage: "radial-gradient(#B8860B 2px, transparent 2px)",
                    backgroundSize: "10px 10px",
                }}
            />

            <div className="container mx-auto px-0 pt-5 md:pt-10">
                {/* Hero Section */}
                <div className="flex flex-col justify-center md:flex-row gap-8 md:gap-12 items-center mb-16 md:mb-32">
                    {/* Text Content */}
                    <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-5xl leading-tight font-bold px-4 md:px-0"
                            style={{ fontPalette: 'Raleway' }}
                        >
                            <span className="text-black">Hey </span>
                            <span className="text-gray-500">there, I'm </span>
                            <span className="text-black">Rajesh. </span>
                            <br className="hidden md:block" />
                            <span className="text-gray-600">A programer / </span>
                            <span className="text-gray-500">Website </span>
                            <span className="text-[#FFB800]">Developer</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-amber-900 font-semibold pt-4 md:pt-10 max-w-xl text-sm md:text-base px-4 md:px-0"
                        >
                            Building smart web solutions with React, AI, and modern tech. Freelancer, innovator, and problem solver.
                        </motion.p>

                        <a href="https://talaganarajesh.vercel.app/" target="_blank" rel="noopener noreferrer">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#362C00] text-white px-6 mt-5 md:px-8 py-4 md:py-5 font-bold rounded-full hover:bg-[#60461c] transition-colors text-sm md:text-base"
                            >
                                Discover My Work
                            </motion.button>
                        </a>
                    </div>

                    {/* Profile Image */}
                    <div className="w-[280px] md:w-[400px] px-4 md:px-0">
                        <div className="bg-[#FFFCE6] rounded-[32px] md:rounded-[48px] aspect-square overflow-hidden shadow-lg">
                            <motion.img
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                src={ownerPhoto}
                                alt="Talagana Rajesh"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="max-w-6xl mx-auto px-4 md:px-0">
                    {/* Year and Started Text */}
                    <div className="md:mb-8 mb-2 flex flex-col items-center md:items-start gap-2 md:gap-8">
                        <div className="items-baseline flex gap-3 md:gap-5" style={{ fontPalette: 'Oxanium' }}>
                            <span className="text-transparent font-bold text-4xl md:text-6xl" style={{ WebkitTextStroke: "1px #000" }}>IN </span>
                            <span className="font-bold text-6xl md:text-9xl">2022</span>
                        </div>
                        <div className="text-3xl md:text-7xl text-transparent font-bold text-center md:text-left"
                            style={{ fontPalette: 'Oxanium', WebkitTextStroke: "1px #000" }}>
                            I STARTED
                        </div>
                    </div>

                    {/* Arrow and Logo - Hidden on mobile */}
                    <div className="hidden md:flex relative justify-start items-center ml-72 gap-20 mb-16">
                        <img src={arrow} alt="Arrow pointing to logo" className="size-60 rotate-[60deg]" />
                        <img src={development} alt="development" className="w-64" />
                    </div>

                    <img src={arrow} alt="Arrow pointing to logo" className="size-16 flex md:hidden ml-10 rotate-[110deg]" />

                    {/* Logo only - Visible on mobile */}
                    <div className="flex md:hidden justify-center mb-8">
                        <img src={development} alt="development" className="w-48" />
                    </div>

                    {/* Stats */}
                    <div className="space-y-4 text-base md:text-xl px-4 md:px-0">
                        <div className="flex items-start flex-col justify-center gap-4">
                            <a href="https://www.linkedin.com/in/talagana-rajesh-75a546289/" target="_blank" rel="noopener noreferrer" className='flex gap-5 flex-row hover:text-green-500 transition-all'>
                                <Linkedin size={24} />
                                <h1>www.linkedin.com/in/talagana-rajesh-75a546289</h1>
                            </a>
                            <a href="https://github.com/talaganaRajesh" target="_blank" rel="noopener noreferrer" className='flex gap-5 flex-row hover:text-green-500 transition-all'>
                                <Github size={24} />
                                <h1>github.com/talaganaRajesh</h1>
                            </a>
                            <a href="https://talaganarajesh.vercel.app/" target="_blank" rel="noopener noreferrer" className='flex gap-5 hover:text-green-500 transition-all flex-row'>
                                <Globe size={24} />
                                <h1>talaganarajesh.vercel.app</h1>
                            </a>
                        </div>
                    </div>
                </div>

                <div className='text-center flex flex-col items-center gap-5 md:px-32 px-5 mt-28 justify-center'>
                    <h1 className='md:text-sm text-xs font-semibold'>Short Description</h1>
                    <p className='font-semibold md:text-base text-xs'>Hey, I’m <span className='bg-yellow-200 px-1'>Talagana Rajesh</span>! I’m a tech enthusiast who loves building innovative solutions with code and creativity. Whether it’s designing websites, exploring AI, or working on unique side projects, I enjoy solving real-world problems with technology.
                        Beyond coding, I’m always eager to learn new things, experiment with ideas, and take on exciting challenges. If I’m not working on a project, you’ll probably find me exploring new trends in tech or brainstorming my next big idea! 🚀 . I am currently pursuing my B.Tech in NIST University berhampur and working as a <span className='bg-yellow-200 px-1'>freelancer</span>.</p>
                </div>

            </div>
        </section>
    );
}