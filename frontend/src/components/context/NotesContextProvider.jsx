// NotesContext.js
import { React, useState } from "react";

import NotesContext from "./NotesContext";

export default function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocSnapshot, setLastDocSnapshot] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [totalNotesCount, setTotalNotesCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    subjects: [],
    modules: []
  });
  
  return (
    <NotesContext.Provider value={{ 
      notes, 
      setNotes,
      loading,
      setLoading,
      loadingMore,
      setLoadingMore,
      hasMore,
      setHasMore,
      lastDocSnapshot,
      setLastDocSnapshot,
      currentFilters,
      setCurrentFilters,
      totalNotesCount,
      setTotalNotesCount,
      filterOptions,
      setFilterOptions
    }}>
      {children}
    </NotesContext.Provider>
  );
}
