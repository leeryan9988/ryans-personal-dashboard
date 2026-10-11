import React from 'react';
import { createRoot } from 'react-dom/client';
import { StickyNotesBoard } from '../components/sticky-notes-board';
createRoot(document.getElementById('root')!).render(<React.StrictMode><div style={{padding:20}}><StickyNotesBoard userId="00000000-0000-4000-8000-000000000001" active /></div></React.StrictMode>);
