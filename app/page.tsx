"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BarChart3, Trash2, ChevronDown } from "lucide-react";

// 型定義
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

  // 教材リストの状態管理
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Hauptlehrgang", totalPages: 300, currentPage: 0, dailyPace: 10 }
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [dailyNote, setDailyNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{explanations: string[]} | null>(null);

  // 現在選択されている教材
  const current = materials.find(m => m.id === selectedId) || materials[0];

  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("studyMaterials_v2");
    if (m) setMaterials(JSON.parse(m));
    const s = localStorage.getItem("selectedId_v2");
    if (s) setSelectedId(s);
    const n = localStorage.getItem("currentDailyNote");
    if (n) setDailyNote(n);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("studyMaterials_v2", JSON.stringify(materials));
      localStorage.setItem("selectedId_v2", selectedId);
      localStorage.setItem("currentDailyNote", dailyNote);
    }
  }, [materials, selectedId, dailyNote, mounted]);

  if (!mounted) return null;

  // 計算ロジック
  const progress = Math.floor((current.currentPage / current.totalPages) * 100);
  const daysLeft = current.dailyPace > 0 ? Math.ceil((current.totalPages - current.currentPage) / current.dailyPace) : 0;
  const finishDate = new Date();
  if (daysLeft > 0) finishDate.setDate(finishDate.getDate() + daysLeft);

  // 操作関数
  const addMaterial = () => {
    const newM: Material = { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 };
    setMaterials([...materials, newM]);
    setSelectedId(newM.id);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMaterial = (id: string) => {
    if (materials.length <= 1) return;
    const filtered = materials.filter(m => m.id !== id);
    setMaterials(filtered);
    setSelectedId(filtered[0].id);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-serif selection:bg-slate-200">
      
      {/* 1. Header & Navigation (Minimalist) */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center print:hidden">
        <h1 className="text-lg font-black tracking-[0.3em] uppercase italic">学習カルテ</h1>
        <div className="flex gap-10">
          <button onClick={() => setActiveTab('report')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        
        {/* 教材セレクター（レポートと分析タブのみ表示） */}
        {activeTab !== 'settings' && (
          <div className="mb-8 flex items-center gap-3 text-slate-400 bg-white/50 p-2 rounded border border-slate-100 print:hidden">
            <BookOpen className="w-3 h-3" />
            <select 
              value={selectedId} 
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
            >
              {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        {/* --- REPORT TAB --- */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white border border-slate-200 p-10 md:p-20 shadow-sm print:border-none print:p-0">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. 00{materials.findIndex(m => m.id === selectedId) + 1}</p>
                  <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest">{current.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 italic">Stand: {new Date().toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              {/* AI Section */}
              <section className="mb-16 border border-slate-100 bg-slate-50/50 p-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3 text-slate-400">
                  <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
                </h3>
                {aiAnalysis ? (
                  <ul className="space-y-6 text-sm italic leading-relaxed text-slate-800">
                    {aiAnalysis.explanations.map((t, i) => (
                      <li key={i} className="flex gap-4 border-l border-slate-200 pl-4">
                        <span className="text-[10px] font-mono text-slate-300">0{i+1}</span>{t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] italic text-slate-300">Keine Daten zur Analyse verfügbar.</p>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 border-b border-slate-50 pb-16">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Status</h3>
                  <div className="flex items-baseline gap-4">
                    <span className="text-8xl font-black tracking-tighter">{current.currentPage}</span>
                    <span className="text-2xl text-slate-200 italic">/ {current.totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-[1px]"><div className="bg-slate-950 h-full" style={{ width: `${progress}%` }} /></div>
                </div>
                <div className="bg-slate-50/50 p-8 border border-slate-100 flex flex-col justify-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">Prognose</h3>
                  <p className="text-2xl font-bold tracking-tight mb-1">{daysLeft} Tage verbleibend</p>
                  <p className="text-[10px] text-slate-400 italic">Erwarteter Abschluss: {finishDate.toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tagesnotizen</h3>
                <div className="min-h-[250px] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap italic font-serif">
                  {dailyNote || "---"}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- ANALYSIS TAB --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-200 pb-2"><h2 className="text-xl font-black italic uppercase tracking-widest text-slate-400">Analyse</h2></header>
            <section className="bg-white border border-slate-200 p-12 space-y-12">
              <div className="space-y-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                  Aktueller Stand (Seite) <span>{current.currentPage} / {current.totalPages}</span>
                </label>
                <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                  onChange={(e) => updateMaterial(selectedId, { currentPage: Number(e.target.value) })}
                  className="w-full h-[1px] bg-slate-100 accent-black appearance-none cursor-pointer" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notizen</label>
                <textarea 
                  value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="Inhalte, Erkenntnisse..."
                  className="w-full h-80 p-8 text-sm italic bg-slate-50/30 outline-none border-none focus:ring-1 focus:ring-slate-100 transition-all resize-none"
                />
              </div>
              <button onClick={() => alert("Dokumentation gespeichert.")} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all">Speichern</button>
            </section>
          </div>
        )}

        {/* --- SETUP TAB (複数教材管理) --- */}
        {activeTab === 'settings' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-200 pb-2 flex justify-between items-end">
              <h2 className="text-xl font-black italic uppercase tracking-widest text-slate-400">Setup</h2>
              <button onClick={addMaterial} className="bg-slate-950 text-white p-2 rounded-full hover:scale-110 shadow-lg transition-all"><Plus className="w-4 h-4" /></button>
            </header>
            
            <div className="grid grid-cols-1 gap-6">
              {materials.map((m, index) => (
                <div key={m.id} className={`bg-white border p-10 transition-all ${selectedId === m.id ? 'border-slate-900 shadow-sm' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex-grow">
                      <span className="text-[9px] font-mono text-slate-300">MATERIAL {index + 1}</span>
                      <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, { name: e.target.value })} className="block w-full text-xl font-bold italic bg-transparent border-b border-transparent focus:border-slate-900 outline-none mt-1" />
                    </div>
                    <div className="flex gap-4 items-center">
                      <button onClick={() => setSelectedId(m.id)} className={`text-[9px] px-4 py-1 font-bold uppercase border ${selectedId === m.id ? 'bg-black text-white' : 'text-slate-200'}`}>Aktiv</button>
                      <button onClick={() => deleteMaterial(m.id)} className="text-slate-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-300 uppercase">Gesamtseiten</label>
                      <input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, { totalPages: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none bg-transparent" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-300 uppercase">Tagesziel (p)</label>
                      <input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, { dailyPace: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none bg-transparent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-full shadow-2xl hover:bg-slate-50 transition-all text-slate-900"><Printer className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
