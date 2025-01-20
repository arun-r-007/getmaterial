import React, { useState, useEffect, useRef } from "react";

const CustomSelect = ({ options, placeholder, onChange, value }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  const inputRef = useRef(null); // Ref for the input element


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {


    setFilteredOptions(
      options.filter((option) =>
        typeof option === "string" && option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);


  useEffect(() => {
    // Focus the input when the dropdown is opened and the device is not mobile
    if (isOpen && inputRef.current) {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches; // Adjust min-width as needed
      if (isDesktop) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);
  

  const handleSelect = (option) => {
    setSearchTerm("");
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="border border-gray-400 md:hover:bg-yellow-50 transition-all rounded-lg p-3 bg-white cursor-pointer shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || placeholder || "Select an option"}
        <span className="float-right">&#9662;</span>
      </div>
      {isOpen && (
        <div className="absolute z-10 bg-white border rounded-lg w-full mt-1 shadow-lg">
          <input
            type="text"
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="p-2 w-full border-b text-green-700 font-semibold focus:outline-none"
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
