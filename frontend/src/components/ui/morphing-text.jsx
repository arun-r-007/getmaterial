"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const MorphingText = ({ texts = [], className, speed = 0.5 }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const combinedText = texts.join("     •    ");

  useEffect(() => {
    if (!scrollRef.current) return;
    
    // Clone the content for seamless looping
    const scrollWidth = scrollRef.current.scrollWidth / 2;
    
    const scroll = () => {
      if (!scrollRef.current) return;
      
      // Increment scroll position with reduced speed
      // Using a lower value than 1 to slow down the scrolling
      scrollRef.current.scrollLeft += speed;
      
      // Reset position when we've scrolled through the first clone
      // This creates the illusion of infinite scrolling
      if (scrollRef.current.scrollLeft >= scrollWidth) {
        scrollRef.current.scrollLeft = 0;
      }
      
      animationRef.current = requestAnimationFrame(scroll);
    };
    
    animationRef.current = requestAnimationFrame(scroll);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full overflow-hidden h-8", className)}
    >
      {/* Gradient edges */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-10 z-10 bg-gradient-to-r from-amber-50 via-transparent to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-gradient-to-l from-amber-50 via-transparent to-transparent" />

      {/* Scrolling text wrapper */}
      <div
        ref={scrollRef}
        className="flex items-center text-zinc-500 whitespace-nowrap text-xs md:text-sm font-bold tracking-wide overflow-hidden"
      >
        {/* Duplicate text content for seamless loop */}
        <div className="flex min-w-max">
          <span className="mx-2">{combinedText}</span>
          <span className="mx-2">{combinedText}</span>
          <span className="mx-2">{combinedText}</span>
          <span className="mx-2">{combinedText}</span>
        </div>
      </div>
    </div>
  );
};