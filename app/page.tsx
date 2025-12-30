"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Calculator, Calendar, BookOpen, Upload, Settings, BarChart3, FileText, History, Trash2, Sparkles, Plus, ChevronDown } from "lucide-react";

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'settings'>('report');

  // 状態管理
  const [materials, setMaterials] = useState([{ id: 'default', name: "Hauptmaterial", totalPages: 100, currentPage: 0, dailyPace: 5 }]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('default');
  const [dailyNote, setDailyNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // 初回読み込み（真っ白画面防止のため、マウント後に実行）
  useEffect(() => {
    try {
      const savedM = localStorage.getItem("studyMaterials");
      if (savedM) setMaterials(JSON.parse(savedM));
      
      const savedAi = localStorage.getItem("aiAnalysis");
      if (savedAi) setAiAnalysis(JSON.parse(savedAi));

      const savedNote = localStorage.getItem("currentDailyNote");
      if (savedNote) setDailyNote(savedNote);
    } catch (e) {
      console.error("Datenfehler:", e);
    }
    setMounted(true);
  }, []);

  // 保存処理
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("studyMaterials", JSON.stringify(materials));
      localStorage.setItem("currentDailyNote", dailyNote);
    }
  }, [materials, dailyNote, mounted]);

  if (!mounted) return null;

  const current = materials.find(m => m.id === selectedMaterialId) || materials[0];
  const progressPercent = Math.min(100, Math.floor((current.currentPage / current.totalPages) * 100));
  const remainingPages = current.totalPages - current.currentPage;
  const daysToFinish = current.dailyPace > 0 ? Math.ceil(remainingPages / current.dailyPace) : 0;
  const finishDate = new Date();
  if (daysToFinish > 0) finishDate.setDate(finishDate.getDate() + daysToFinish);

  // 関数
  const updateMaterial = (id: string, updates: any) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addMaterial = () => {
    const newM = { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 };
    setMaterials([...materials, newM]);
    setSelectedMaterialId(newM.id);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-serif">
      {/* Navigation - Chic & Minimal */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
        <h1 className="text-lg font-black tracking-widest uppercase italic">学習カルテ</h1>
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('report')} className={`text-[10px] uppercase tracking-widest font-bold ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-400'}`}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={`text-[10px] uppercase tracking-widest font-bold ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-400'}`}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] uppercase tracking-widest font-bold ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-400'}`}>Setup</button>
        </div>
      </nav>

      <main className="p-6 md:p-12 max-w-4xl mx-auto pb-32">
        
        {/* 1. KArte (Bericht) */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white border border-slate-300 p-10 md:p-16 shadow-sm print:border-none print:p-0">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. 001-A</span>
                  <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-bold uppercase">{current.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 italic">Stand: {new Date().toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              {/* AI Section (Japanese internal content) */}
              <section className="mb-12 border border-slate-100 bg-slate-50/30 p-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3" /> AI復習ポイント
                </h3>
                {aiAnalysis ? (
                  <ul className="space-y-6 text-sm italic leading-relaxed text-slate-700">
                    {aiAnalysis.explanations.map((line, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="font-mono text-[10px] opacity-30 italic">0{i+1}</span>{line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] italic text-slate-300">Keine Analysedaten vorhanden.</p>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12 border-b border-slate-100 pb-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktueller Status</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tracking-tighter">{current.currentPage}</span>
                    <span className="text-2xl text-slate-200 italic">/ {current.totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1 border border-slate-200">
                    <div className="bg-slate-900 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="bg-slate-50/50 p-6 border border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prognose</h3>
                  <div className="space-y-2">
                    <p className="text-xs italic text-slate-500 flex justify-between">Fortschritt: <span>{progressPercent}%</span></p>
                    <p className="text-2xl font-black pt-2 border-t border-slate-100">Restlich: {daysToFinish} Tage</p>
                    <p className="text-[10px] font-mono italic text-slate-400">Ziel: {finishDate.toLocaleDateString('de-DE')}</p>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tagesnotizen</h3>
                <div className="min-h-[150px] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap italic">
                  {dailyNote || "---"}
                </div>
              </section>
            </div>
            <div className="fixed bottom-8 right-8 print:hidden">
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">
                Drucken / PDF
              </button>
            </div>
          </div>
        )}

        {/* 2. Analyse */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-black italic uppercase tracking-widest">Analyse & Dokumentation</h2>
            </header>
            
            <section className="bg-white border border-slate-200 p-10 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                  Fortschritt (Seite) <span>{current.currentPage} / {current.totalPages}</span>
                </label>
                <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                  onChange={(e) => updateMaterial(selectedMaterialId, { currentPage: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-100 accent-slate-900 appearance-none cursor-pointer" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Tagesnotizen
                </label>
                <textarea 
                  value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="Inhalte, Erkenntnisse, Hindernisse..."
                  className="w-full border border-slate-200 h-64 p-6 text-sm italic outline-none focus:border-slate-950 bg-slate-50/20 transition-all resize-none font-serif"
                />
              </div>

              <button onClick={() => alert("Gespeichert")} className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all">
                Dokumentation Speichern
              </button>
            </section>
          </div>
        )}

        {/* 3. Setup */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-200 pb-2 flex justify-between items-end">
              <h2 className="text-xl font-black italic uppercase tracking-widest">Konfiguration</h2>
              <button onClick={addMaterial} className="bg-slate-900 text-white p-2 rounded-full hover:scale-105 transition-all shadow-lg"><Plus className="w-4 h-4" /></button>
            </header>
            
            <div className="space-y-4">
              {materials.map(m => (
                <div key={m.id} className={`bg-white border p-8 transition-all ${selectedMaterialId === m.id ? 'border-slate-900 shadow-md' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, { name: e.target.value })} className="text-lg font-bold italic bg-transparent border-b border-transparent focus:border-slate-900 outline-none w-full mr-4" />
                    <button onClick={() => setSelectedMaterialId(m.id)} className={`text-[9px] px-3 py-1 font-black uppercase border ${selectedMaterialId === m.id ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-300 border-slate-100'}`}>
                      Aktiv
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Seiten gesamt</label>
                      <input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, { totalPages: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Tagesziel</label>
                      <input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, { dailyPace: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
