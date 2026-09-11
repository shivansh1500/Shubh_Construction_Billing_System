import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#FFFFFF]">
      {/* Sidebar with Studio Veda aesthetic */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Subtle Ambient Architectural Lighting */}
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[300px] rounded-full pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(184, 117, 79, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <Header />
        <main className="flex-1 overflow-y-auto relative architectural-bg" style={{ background: '#000000' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
