"use client";

import React, { useState, useEffect } from 'react';
import { Printer, BookOpen, Upload, Settings, BarChart3, FileText, Trash2, Sparkles, Plus } from "lucide-react";

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('report');

  // --- 状態管理 (Initial State) ---
  const [materials, setMaterials] = useState([
    { id: 'default', name: "Hauptlehrgang", totalPages: 300, currentPage: 0, dailyPace: 10 }
  ]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('default');
  const [dailyNote, setDailyNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [studyLogs, setStudyLogs] = useState([]);

  // --- ブラウザ起動時のデータ復元 (Client-side only) ---
  useEffect(() => {
    setMounted(true); // 描画を許可
    try {
      const m = localStorage.getItem("studyMaterials");
      if (m) setMaterials(JSON.parse(m));
      const a = localStorage.getItem("aiAnalysis");
      if (a) setAiAnalysis(JSON.parse(a));
      const n = localStorage.getItem("currentDailyNote");
      if (n) setDailyNote(n);
      const l = localStorage.getItem("studyLogs");
      if (l) setStudyLogs(JSON.parse(l));
    } catch (e) {
      console.error("Datenwiederherstellung fehlgeschlagen", e);
    }
  }, []);

  // --- 自動保存 ---
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("studyMaterials", JSON.stringify(materials));
      localStorage.setItem("currentDailyNote", dailyNote);
    }
  }, [materials, dailyNote, mounted]);

  // --- 計算ロジック ---
  const current = materials.find(m => m.id === selectedMaterialId) || materials[0];
  const progressPercent = Math.min(100, Math.floor((current.currentPage / current.totalPages) * 100));
  const remainingPages = current.totalPages - current.currentPage;
  const daysToFinish = current.dailyPace > 0 ? Math.ceil(remainingPages / current.dailyPace) : 0;
  const finishDate = new Date();
  if (daysToFinish > 0) finishDate.setDate(finishDate.getDate() + daysToFinish);

  // --- 操作関数 ---
  const updateMaterial = (id: string, updates: any) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleSave = () => {
    const newLog = {
      date: new Date().toLocaleString('de-DE'),
      material: current.name,
      note: dailyNote
    };
    const updated = [newLog, ...studyLogs];
    setStudyLogs(updated);
    localStorage.setItem("studyLogs", JSON.stringify(updated));
    alert("Gespeichert.");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-serif selection:bg-slate-200">
      
      {/* 1. Header (Static Title) */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center print:hidden shadow-sm">
        <h1 className="text-xl font-black tracking-[0.3em] uppercase italic">学習カルテ</h1>
        <div className="flex gap-10">
          <button onClick={() => setActiveTab('report')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Setup</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        
        {/* --- REPORT TAB --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-20 shadow-sm print:border-none print:p-0">
            <div className="flex justify-between items-end border-b-2 border-slate-950 pb-8 mb-12">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-slate-300 uppercase">Fall-Nr. 001-B</p>
                <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold">{current.name}</p>
                <p className="text-[10px] text-slate-400 font-mono italic">{new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            {/* AI復習ポイント (Japanese Title) */}
            <section className="mb-16 p-10 bg-slate-50/50 border border-slate-100 rounded-sm">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-slate-400">
                <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
              </h3>
              {aiAnalysis ? (
                <ul className="space-y-8 text-sm italic leading-relaxed text-slate-800">
                  {aiAnalysis.explanations.map((text: string, i: number) => (
                    <li key={i} className="flex gap-6 border-l border-slate-200 pl-6">
                      <span className="font-mono text-[10px] text-slate-300">0{i+1}</span>{text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] italic text-slate-300">Keine Daten zur Analyse verfügbar.</p>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-16 border-b border-slate-50 pb-16">
              <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fortschritt</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-8xl font-black tracking-tighter">{current.currentPage}</span>
                  <span className="text-2xl text-slate-200 italic font-light">/ {current.totalPages}</span>
                </div>
                <div className="w-full bg-slate-50 h-[2px] overflow-hidden"><div className="bg-slate-950 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} /></div>
              </div>
              <div className="space-y-6 bg-[#F9F9F9] p-8 border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Prognose</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight">{daysToFinish} Tage verbleibend</p>
                  <p className="text-[10px] text-slate-400 italic">Erwarteter Abschluss: {finishDate.toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </div>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tagesnotizen</h3>
              <div className="min-h-[200px] text-sm leading-relaxed italic text-slate-700 whitespace-pre-wrap font-serif">
                {dailyNote || "Keine Notizen erfasst."}
              </div>
            </section>
          </div>
        )}

        {/* --- ANALYSIS TAB --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header className="border-b border-slate-200 pb-2"><h2 className="text-xl font-bold italic uppercase tracking-widest text-slate-400">Analyse</h2></header>
            <section className="bg-white border border-slate-200 p-12 space-y-12 shadow-sm">
              <div className="space-y-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                  Aktueller Fortschritt (S.) <span>{current.currentPage} / {current.totalPages}</span>
                </label>
                <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                  onChange={(e) => updateMaterial(selectedMaterialId, { currentPage: Number(e.target.value) })}
                  className="w-full h-[2px] bg-slate-100 accent-black appearance-none cursor-pointer" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tagesnotizen</label>
                <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="Heute gelernt..." className="w-full h-80 p-8 text-sm italic border-none bg-slate-50/50 focus:ring-1 focus:ring-slate-200 outline-none transition-all resize-none" />
              </div>
              <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all">Speichern</button>
            </section>
          </div>
        )}

        {/* --- SETUP TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <header className="border-b border-slate-200 pb-2 flex justify-between items-end">
              <h2 className="text-xl font-bold italic uppercase tracking-widest text-slate-400">Setup</h2>
              <button onClick={() => {
                const n = { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 };
                setMaterials([...materials, n]);
              }} className="bg-slate-950 text-white p-2 rounded-full hover:scale-105 transition-all shadow-md"><Plus className="w-4 h-4" /></button>
            </header>
            <div className="space-y-4">
              {materials.map(m => (
                <div key={m.id} className={`bg-white border p-10 flex flex-col gap-6 transition-all ${selectedMaterialId === m.id ? 'border-slate-950 shadow-md' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-center">
                    <input value={m.name} onChange={(e) => updateMaterial(m.id, { name: e.target.value })} className="text-lg font-bold italic bg-transparent border-b border-transparent focus:border-slate-900 outline-none w-full" />
                    <button onClick={() => setSelectedMaterialId(m.id)} className={`text-[9px] px-4 py-1 font-bold uppercase border ml-4 ${selectedMaterialId === m.id ? 'bg-black text-white' : 'text-slate-300'}`}>Aktiv</button>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div><label className="text-[9px] font-bold text-slate-300 uppercase">Gesamtseiten</label><input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, { totalPages: Number(e.target.value) })} className="w-full text-2xl font-black border-b border-slate-50 bg-transparent outline-none" /></div>
                    <div><label className="text-[9px] font-bold text-slate-300 uppercase">Tagesziel</label><input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, { dailyPace: Number(e.target.value) })} className="w-full text-2xl font-black border-b border-slate-50 bg-transparent outline-none" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-10 right-10 print:hidden flex flex-col gap-4">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-full shadow-xl hover:bg-slate-50 transition-all"><Printer className="w-5 h-5 text-slate-900" /></button>
      </div>
    </div>
  );
}
