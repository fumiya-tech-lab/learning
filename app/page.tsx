"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BookOpen } from "lucide-react";

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('report');
  const [materials, setMaterials] = useState([{ id: '1', name: "Hauptmaterial", totalPages: 100, currentPage: 0, dailyPace: 5 }]);
  const [dailyNote, setDailyNote] = useState("");

  // マウント後にのみブラウザ機能を実行（真っ白画面防止の鉄則）
  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("studyMaterials");
    if (m) setMaterials(JSON.parse(m));
    const n = localStorage.getItem("currentDailyNote");
    if (n) setDailyNote(n);
  }, []);

  if (!mounted) return <div style={{ background: '#f8f9fa', minHeight: '100vh' }} />;

  const current = materials[0]; // 簡略化してエラーを防ぐ
  const progress = Math.floor((current.currentPage / current.totalPages) * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-serif">
      {/* Navigation - Minimalist style */}
      <nav className="border-b border-slate-200 bg-white px-8 py-4 flex justify-between items-center print:hidden">
        <h1 className="text-lg font-black tracking-widest uppercase italic">学習カルテ</h1>
        <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <button onClick={() => setActiveTab('report')} className={activeTab === 'report' ? 'text-black border-b border-black' : ''}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={activeTab === 'analysis' ? 'text-black border-b border-black' : ''}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-black border-b border-black' : ''}>Setup</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8 md:p-16">
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-12 md:p-20 shadow-sm print:border-none">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-12">
              <div>
                <p className="text-[9px] font-mono text-slate-400">REF: 001-B</p>
                <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400 italic">
                {new Date().toLocaleDateString('de-DE')}
              </div>
            </header>

            {/* AI復習ポイント (Japanese Title) */}
            <section className="mb-12 p-8 bg-slate-50 border-l-4 border-slate-900">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI復習ポイント
              </h3>
              <p className="text-xs italic text-slate-500">Keine aktuellen Analysedaten verfügbar.</p>
            </section>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <h4 className="text-[9px] font-bold uppercase text-slate-300 mb-2">Fortschritt</h4>
                <p className="text-6xl font-black">{current.currentPage}<span className="text-xl text-slate-200"> / {current.totalPages}</span></p>
              </div>
              <div className="border-l border-slate-100 pl-8">
                <h4 className="text-[9px] font-bold uppercase text-slate-300 mb-2">Prognose</h4>
                <p className="text-lg font-bold italic">Status: In Bearbeitung</p>
              </div>
            </div>

            <section>
              <h4 className="text-[9px] font-bold uppercase text-slate-300 mb-4 tracking-widest">Tagesnotizen</h4>
              <div className="min-h-[150px] text-sm italic leading-relaxed whitespace-pre-wrap">{dailyNote || "Keine Einträge."}</div>
            </section>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="bg-white border border-slate-200 p-12 space-y-8 animate-in fade-in duration-300">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Dokumentation</h2>
            <textarea 
              value={dailyNote} 
              onChange={(e) => setDailyNote(e.target.value)}
              className="w-full h-64 p-6 text-sm italic border-none bg-slate-50 focus:ring-1 focus:ring-slate-100 outline-none resize-none"
              placeholder="Notizen für heute..."
            />
            <button onClick={() => alert("Gespeichert")} className="w-full py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black">Speichern</button>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 right-8 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-full shadow-lg hover:bg-slate-50">
          <Printer className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
