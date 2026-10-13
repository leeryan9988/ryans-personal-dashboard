import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyNotesBoard } from '../components/sticky-notes-board';
function TestBoard() {
  const [search, setSearch] = useState('');
  return <div style={{padding:20}}>
    <input aria-label="顶部搜索待办" value={search} onChange={(event) => setSearch(event.target.value)} />
    <StickyNotesBoard userId="00000000-0000-4000-8000-000000000001" active searchQuery={search} onSearchChange={setSearch} />
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><TestBoard /></React.StrictMode>);
