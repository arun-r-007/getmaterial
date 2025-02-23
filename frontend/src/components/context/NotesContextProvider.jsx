// NotesContext.js
import { React, useState } from "react";

import NotesContext from "./NotesContext";

export default function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  return (
    <NotesContext.Provider value={{ notes, setNotes }}>
      {children}
    </NotesContext.Provider>
  );
}
