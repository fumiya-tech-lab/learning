"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BarChart3, Trash2, BookOpen } from "lucide-react";

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

  // 初期データ (Default State)
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Hauptlehrgang", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [dailyNote, setDailyNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);

  // 1. マウント処理 (Hydration Guard)
  useEffect(() => {
    try {
      const m = localStorage.getItem("karte_materials");
      if (m) {
        const parsed = JSON.parse(m);
        if (Array.isArray(parsed) && parsed.length > 0) setMaterials(parsed);
      }
      const s = localStorage.getItem("karte_selectedId");
      if (s) setSelectedId(s);
      const n = localStorage.getItem("karte_note");
      if (n) setDailyNote(n);
      const a = localStorage.getItem("karte_ai");
      if (a) setAiExplanations(JSON.parse(a));
    } catch (e) {
      console.error("Local Storage Error", e);
    }
    setMounted(true);
  }, []);

  // 2. 保存処理
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_materials", JSON.stringify(materials));
      localStorage.setItem("karte_selectedId", selectedId);
      localStorage.setItem("karte_note", dailyNote);
      localStorage.setItem("karte_ai", JSON.stringify(aiExplanations));
    }
  }, [materials, selectedId, dailyNote, aiExplanations, mounted]);

  // マウント前は何も表示しない (クライアントサイドエラー防止)
  if (!mounted) return null;

  // 現在の教材を安全に取得
  const currentMaterial = materials.find(m => m.id === selectedId) || materials[0] || {
    id: '1', name: "---", totalPages: 1, currentPage: 0, dailyPace: 1
  };

  // 計算ロジック
  const progress = Math.min(100, Math.floor((currentMaterial.currentPage / currentMaterial.totalPages) * 100));
  const remaining = Math.max(0, currentMaterial.totalPages - currentMaterial.currentPage);
  const days = currentMaterial.dailyPace > 0 ? Math.ceil(remaining / currentMaterial.dailyPace) : 0;
  const finishDate = new Date();
  if (days > 0) finishDate.setDate(finishDate.getDate() + days);

  // 操作
  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addMaterial = () => {
    const newM: Material = { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 };
    setMaterials(prev => [...prev, newM]);
    setSelectedId(newM.id);
  };

  const deleteMaterial = (id: string) => {
    if (materials.length <= 1) return;
    const filtered = materials.filter(m => m.id !== id);
    setMaterials(filtered);
    setSelectedId(filtered[0].id);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#2C2C2C] font-serif">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
        <h1 className="text-lg font-black tracking-[0.2em] italic uppercase">学習カルテ</h1>
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('report')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        
        {/* 教材選択 (Report/Analyse時) */}
        {activeTab !== 'settings' && (
          <div className="mb-6 flex items-center gap-2 text-slate-400 bg-white p-2 border border-slate-100 rounded-sm w-fit print:hidden">
            <BookOpen className="w-3 h-3" />
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer">
              {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        {/* --- REPORT (Bericht) --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-20 shadow-sm print:border-none print:p-0">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-8 mb-12">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase">Fall-Nr. 00{materials.findIndex(m => m.id === selectedId) + 1}</p>
                <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold uppercase">{currentMaterial.name}</p>
                <p className="text-[10px] font-mono text-slate-400 italic">Stand: {new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </header>

            {/* AI復習ポイント */}
            <section className="mb-16 border border-slate-100 bg-slate-50/50 p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400">
                <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
              </h3>
              {aiExplanations.length > 0 ? (
                <ul className="space-y-6 text-sm italic leading-relaxed text-slate-700">
                  {aiExplanations.map((text, i) => (
                    <li key={i} className="flex gap-4 border-l border-slate-200 pl-4">
                      <span className="text-[10px] font-mono opacity-30">0{i+1}</span>{text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] italic text-slate-300">Keine Analysedaten verfügbar.</p>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 border-b border-slate-50 pb-16">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Status</h3>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-black">{currentMaterial.currentPage}</span>
                  <span className="text-xl text-slate-200 italic">/ {currentMaterial.totalPages}</span>
                </div>
                <div className="w-full bg-slate-50 h-[1px]"><div className="bg-slate-950 h-full" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="bg-[#FCFCFC] p-8 border border-slate-100 flex flex-col justify-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-3">Prognose</h3>
                <p className="text-2xl font-bold tracking-tight mb-1 italic">{days} Tage</p>
                <p className="text-[9px] text-slate-400 uppercase font-mono tracking-tighter">Abschluss am: {finishDate.toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Tagesnotizen</h3>
              <div className="min-h-[250px] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap italic opacity-80 border-l border-slate-50 pl-6">
                {dailyNote || "---"}
              </div>
            </section>
          </div>
        )}

        {/* --- ANALYSIS (Analyse) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header className="border-b border-slate-200 pb-2"><h2 className="text-xl font-bold italic uppercase text-slate-400">Analyse</h2></header>
            <section className="bg-white border border-slate-200 p-12 space-y-12 shadow-sm">
              <div className="space-y-6">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex justify-between tracking-widest">Fortschritt (S.) <span>{currentMaterial.currentPage} / {currentMaterial.totalPages}</span></label>
                <input type="range" min="0" max={currentMaterial.totalPages} value={currentMaterial.currentPage} 
                  onChange={(e) => updateMaterial(selectedId, { currentPage: Number(e.target.value) })}
                  className="w-full h-[1px] bg-slate-100 accent-black appearance-none cursor-pointer" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Dokumentation</label>
                <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="Inhalte, Erkenntnisse, Notizen..."
                  className="w-full h-80 p-8 text-sm italic bg-slate-50/30 outline-none border-none focus:ring-1 focus:ring-slate-100 resize-none" />
              </div>
              <button onClick={() => alert("Daten wurden gesichert.")} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all">Speichern</button>
            </section>
          </div>
        )}

        {/* --- SETUP --- */}
        {activeTab === 'settings' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <header className="border-b border-slate-200 pb-2 flex justify-between items-end">
              <h2 className="text-xl font-bold italic uppercase text-slate-400">Setup</h2>
              <button onClick={addMaterial} className="bg-slate-950 text-white p-2 rounded-full hover:scale-110 shadow-lg"><Plus className="w-4 h-4" /></button>
            </header>
            <div className="grid grid-cols-1 gap-6">
              {materials.map((m, idx) => (
                <div key={m.id} className={`bg-white border p-10 transition-all ${selectedId === m.id ? 'border-slate-900 shadow-sm' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex-grow">
                      <span className="text-[8px] font-mono text-slate-300">FALL-ID: {m.id.slice(-4)}</span>
                      <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, { name: e.target.value })} className="block w-full text-xl font-bold italic border-b border-transparent focus:border-slate-900 outline-none" />
                    </div>
                    <div className="flex gap-4 items-center">
                      <button onClick={() => setSelectedId(m.id)} className={`text-[9px] px-4 py-1 font-bold uppercase border ${selectedId === m.id ? 'bg-black text-white' : 'text-slate-200'}`}>Aktiv</button>
                      <button onClick={() => deleteMaterial(m.id)} className="text-slate-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div><label className="text-[9px] font-bold text-slate-300 uppercase">Seiten</label><input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, { totalPages: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none" /></div>
                    <div><label className="text-[9px] font-bold text-slate-300 uppercase">Ziel/Tag</label><input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, { dailyPace: Number(e.target.value) })} className="w-full text-xl font-black border-b border-slate-50 outline-none" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-full shadow-2xl hover:bg-slate-50 transition-all"><Printer className="w-5 h-5 text-slate-900" /></button>
      </div>
    </div>
  );
}
