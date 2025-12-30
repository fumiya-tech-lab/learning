"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BarChart3, Trash2, BookOpen, Clock, Home } from "lucide-react";

interface Material {
  id: string;
  name: string;
  totalPages: number;
  currentPage: number;
  dailyPace: number;
}

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'settings'>('report');

  // 複数学習を前提とした初期状態
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Material A", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [dailyNote, setDailyNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);

  useEffect(() => {
    try {
      const m = localStorage.getItem("karte_materials_v5");
      if (m) {
        const parsed = JSON.parse(m);
        if (Array.isArray(parsed) && parsed.length > 0) setMaterials(parsed);
      }
      const s = localStorage.getItem("karte_selectedId_v5");
      if (s) setSelectedId(s);
      const n = localStorage.getItem("karte_note_v5");
      if (n) setDailyNote(n);
      const a = localStorage.getItem("karte_ai_v5");
      if (a) setAiExplanations(JSON.parse(a));
    } catch (e) { console.error(e); }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_materials_v5", JSON.stringify(materials));
      localStorage.setItem("karte_selectedId_v5", selectedId);
      localStorage.setItem("karte_note_v5", dailyNote);
      localStorage.setItem("karte_ai_v5", JSON.stringify(aiExplanations));
    }
  }, [materials, selectedId, dailyNote, aiExplanations, mounted]);

  if (!mounted) return null;

  const current = materials.find(m => m.id === selectedId) || materials[0];
  const progress = Math.min(100, Math.floor((current.totalPages > 0 ? current.currentPage / current.totalPages : 0) * 100));
  const remaining = Math.max(0, current.totalPages - current.currentPage);
  const days = current.dailyPace > 0 ? Math.ceil(remaining / current.dailyPace) : 0;
  const finishDate = new Date();
  if (days > 0) finishDate.setDate(finishDate.getDate() + days);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-serif">
      
      {/* Navigation - メニュー選択のみ */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden shadow-sm">
        <button onClick={() => setActiveTab('report')} className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Bericht</button>
        <button onClick={() => setActiveTab('analysis')} className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
        <button onClick={() => setActiveTab('settings')} className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32 print:p-0">
        
        {/* 各ページ共通の「ホームに戻る」タイトル */}
        <div className="mb-6 flex items-center gap-2 print:hidden cursor-pointer w-fit group" onClick={() => setActiveTab('report')}>
          <Home className="w-3 h-3 text-slate-300 group-hover:text-black transition-colors" />
          <h2 className="text-[11px] font-black tracking-[0.3em] uppercase text-slate-900 not-italic">学習カルテ</h2>
        </div>

        {/* REPORT (Bericht) */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white border border-slate-100 p-10 md:p-14 print:border-none print:p-0 min-h-[280mm] flex flex-col">
              
              <header className="flex justify-between items-end border-b border-slate-900 pb-4 mb-8">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. 00{materials.findIndex(m => m.id === selectedId) + 1}</p>
                  <h2 className="text-sm font-black tracking-[0.2em] text-slate-900 not-italic">学習カルテ</h2>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider">{current.name}</p>
                  <p className="text-[8px] font-mono text-slate-400 italic">Stand: {new Date().toLocaleDateString('de-DE')}</p>
                </div>
              </header>

              <div className="flex-grow space-y-10">
                {/* 1. Status & Voraussicht */}
                <div className="grid grid-cols-2 gap-10 pb-8 border-b border-slate-50">
                  <div className="space-y-4">
                    <h3 className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Status</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">{current.currentPage}</span>
                      <span className="text-sm text-slate-200 italic">/ {current.totalPages}</span>
                    </div>
                    <div className="w-full bg-slate-50 h-[1px]"><div className="bg-slate-900 h-full" style={{ width: `${progress}%` }} /></div>
                  </div>
                  
                  <div className="bg-[#FCFCFC] p-5 border border-slate-100 flex flex-col justify-center">
                    <h3 className="text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-2">Voraussicht</h3>
                    <p className="text-lg font-bold tracking-tight mb-0.5">{days} Tage verbleibend</p>
                    <p className="text-[8px] text-slate-400 uppercase font-mono tracking-tighter">Abschluss: {finishDate.toLocaleDateString('de-DE')}</p>
                  </div>
                </div>

                {/* 2. 今日の計画（Tagesnotizen） */}
                <section className="space-y-4">
                  <h3 className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Tagesnotizen</h3>
                  <div className="min-h-[220px] text-xs leading-relaxed text-slate-800 whitespace-pre-wrap italic opacity-80 border-l border-slate-100 pl-6">
                    {dailyNote || "---"}
                  </div>
                </section>

                {/* 3. AI復習ポイント（指示通り計画の下に配置） */}
                <section className="p-6 bg-slate-50/30 border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.4em] flex items-center gap-2 text-slate-400">
                      <Sparkles className="w-2.5 h-2.5 text-slate-900" /> AI復習ポイント
                    </h3>
                    <span className="text-[7px] text-slate-300 font-mono flex items-center gap-1 uppercase tracking-tighter">
                      <Clock className="w-2 h-2" /> Ebbinghaus-Kurve Algorithmus
                    </span>
                  </div>
                  {aiExplanations.length > 0 ? (
                    <ul className="space-y-3 text-[11px] italic leading-relaxed text-slate-700">
                      {aiExplanations.map((text, i) => (
                        <li key={i} className="flex gap-4 border-l border-slate-200 pl-4">
                          <span className="text-[8px] font-mono opacity-30">0{i+1}</span>{text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[9px] italic text-slate-300">Nächste Wiederholungen werden hier basierend auf Ihrem Fortschritt generiert.</p>
                  )}
                </section>
              </div>

              <footer className="mt-10 pt-4 border-t border-slate-50 flex justify-between items-center opacity-20">
                <p className="text-[7px] font-mono uppercase tracking-widest">Studienakte System v3.3</p>
                <div className="w-10 h-px bg-slate-900" />
              </footer>
            </div>
          </div>
        )}

        {/* ANALYSIS (Analyse) - ここで教材を切り替える */}
        {activeTab === 'analysis' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Analyse</h2>
              <div className="flex items-center gap-2 text-slate-400 bg-white px-3 py-1 border border-slate-100 rounded-sm">
                <BookOpen className="w-3 h-3" />
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="bg-transparent text-[8px] font-bold uppercase outline-none cursor-pointer">
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <section className="bg-white border border-slate-100 p-8 space-y-10">
              <div className="space-y-6">
                <label className="text-[8px] font-bold uppercase text-slate-400 flex justify-between tracking-widest">Fortschritt (S.) <span>{current.currentPage} / {current.totalPages}</span></label>
                <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaterials(prev => prev.map(m => m.id === selectedId ? { ...m, currentPage: val } : m));
                  }}
                  className="w-full h-[1px] bg-slate-100 accent-black appearance-none cursor-pointer" />
              </div>
              <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                placeholder="Heutige Aufzeichnungen..." className="w-full h-80 p-6 text-sm italic bg-slate-50/20 outline-none border-none resize-none font-serif" />
              <button onClick={() => alert("Dokumentation gespeichert.")} className="w-full py-4 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all">Speichern</button>
            </section>
          </div>
        )}

        {/* SETUP */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-100 pb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Setup</header>
            <div className="grid grid-cols-1 gap-4">
              {materials.map((m) => (
                <div key={m.id} className={`bg-white border p-6 transition-all ${selectedId === m.id ? 'border-slate-900 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                  <div className="flex justify-between items-center">
                    <input type="text" value={m.name} onChange={(e) => {
                      const val = e.target.value;
                      setMaterials(prev => prev.map(item => item.id === m.id ? { ...item, name: val } : item));
                    }} className="text-md font-bold bg-transparent border-b border-transparent focus:border-slate-900 outline-none w-full mr-4 not-italic" />
                    <div className="flex gap-4 items-center">
                      <button onClick={() => setSelectedId(m.id)} className={`text-[8px] px-3 py-1 font-bold uppercase border ${selectedId === m.id ? 'bg-black text-white border-black' : 'text-slate-200 border-slate-100'}`}>Aktiv</button>
                      <button onClick={() => { if (materials.length > 1) setMaterials(materials.filter(i => i.id !== m.id)); }} className="ml-2 text-slate-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Gesamtseiten</label>
                      <input type="number" value={m.totalPages} onChange={(e) => {
                        const val = Number(e.target.value);
                        setMaterials(prev => prev.map(item => item.id === m.id ? { ...item, totalPages: val } : item));
                      }} className="w-full text-md font-black border-b border-slate-50 outline-none bg-transparent" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Ziel p/Tag</label>
                      <input type="number" value={m.dailyPace} onChange={(e) => {
                        const val = Number(e.target.value);
                        setMaterials(prev => prev.map(item => item.id === m.id ? { ...item, dailyPace: val } : item));
                      }} className="w-full text-md font-black border-b border-slate-50 outline-none bg-transparent" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newM: Material = { id: Date.now().toString(), name: "Material " + (materials.length + 1), totalPages: 100, currentPage: 0, dailyPace: 5 };
                setMaterials([...materials, newM]);
                setSelectedId(newM.id);
              }} className="w-full py-3 border border-dashed border-slate-200 text-slate-300 text-[8px] uppercase font-bold hover:border-slate-900 hover:text-slate-900 transition-all">
                + Weiteres Material hinzufügen
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Print Floating Button */}
      <div className="fixed bottom-6 right-6 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-100 p-4 rounded-full shadow-lg hover:bg-slate-50 transition-all text-slate-900">
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
