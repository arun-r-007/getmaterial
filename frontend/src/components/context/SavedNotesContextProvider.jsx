import { React, useState } from "react";
import SavedNotesContext from "./SavedNotesContext";

export default function SavedNotesProvider({ children }) {
  const [savedNotes, setSavedNotes] = useState({});
  const [isSavedNotesLoading, setIsSavedNotesLoading] = useState(true);
  
  return (
    <SavedNotesContext.Provider value={{ 
      savedNotes, 
      setSavedNotes,
      isSavedNotesLoading,
      setIsSavedNotesLoading 
    }}>
      {children}
    </SavedNotesContext.Provider>
  );
}