"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Plus, FileText, BarChart3, Settings, BookOpen, ChevronDown } from "lucide-react";

export default function StudyKarteApp() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'settings'>('report');

  // 初期データ（データがない場合のデフォルト）
  const [materials, setMaterials] = useState([
    { id: 'default', name: "Hauptmaterial", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [selectedId, setSelectedId] = useState('default');
  const [dailyNote, setDailyNote] = useState("");
  const [aiData, setAiData] = useState(null);

  // マウント後の処理（真っ白画面を回避するため、UI表示後にデータを読み込む）
  useEffect(() => {
    setIsClient(true);
    try {
      const m = localStorage.getItem("studyMaterials");
      if (m) setMaterials(JSON.parse(m));
      const a = localStorage.getItem("aiAnalysis");
      if (a) setAiData(JSON.parse(a));
      const n = localStorage.getItem("currentDailyNote");
      if (n) setDailyNote(n);
    } catch (e) {
      console.error("Datenfehler", e);
    }
  }, []);

  // データ保存
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("studyMaterials", JSON.stringify(materials));
      localStorage.setItem("currentDailyNote", dailyNote);
    }
  }, [materials, dailyNote, isClient]);

  const current = materials.find(m => m.id === selectedId) || materials[0];
  const progress = Math.min(100, Math.floor((current.currentPage / current.totalPages) * 100));
  const remaining = current.totalPages - current.currentPage;
  const days = current.dailyPace > 0 ? Math.ceil(remaining / current.dailyPace) : 0;
  const finishDate = new Date();
  if (days > 0) finishDate.setDate(finishDate.getDate() + days);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-serif selection:bg-slate-200">
      
      {/* 画面上部のナビゲーション（即座に表示される） */}
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
        <h1 className="text-lg font-black tracking-[0.2em] italic uppercase">学習カルテ</h1>
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('report')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Bericht</button>
          <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Analyse</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300 hover:text-slate-500'}`}>Setup</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        
        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-20 shadow-sm print:border-none print:p-0">
            {/* カルテヘッダー */}
            <div className="flex justify-between items-end border-b-2 border-slate-950 pb-8 mb-12">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-slate-300 uppercase">Case-Nr. {current.id.slice(-4).toUpperCase()}</p>
                <h2 className="text-3xl font-black italic tracking-widest">学習カルテ</h2>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold uppercase">{current.name}</p>
                <p className="text-[10px] text-slate-400 font-mono italic">Datum: {new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            {/* AI復習ポイント（日本語） */}
            <section className="mb-16 p-10 bg-[#FAFAFA] border border-slate-100 rounded-sm">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-slate-400">
                <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
              </h3>
              {isClient && aiData ? (
                <ul className="space-y-8 text-sm italic leading-relaxed text-slate-800 border-l border-slate-100 pl-8">
                  {aiData.explanations.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              ) : (
                <p className="text-[10px] italic text-slate-300">Keine Daten verfügbar.</p>
              )}
            </section>

            {/* 進捗・予測 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-16 border-b border-slate-50 pb-16 font-sans">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Fortschritt</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-8xl font-black tracking-tighter">{isClient ? current.currentPage : '--'}</span>
                  <span className="text-2xl text-slate-200 italic font-light">/ {current.totalPages}</span>
                </div>
                <div className="w-full bg-slate-100 h-[1px]"><div className="bg-slate-950 h-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="bg-[#FDFDFD] p-8 border border-slate-100 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Prognose</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight">{days} Tage</p>
                  <p className="text-[10px] text-slate-400 italic">Geplanter Abschluss: {finishDate.toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </div>

            {/* ノートセクション */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Tagesnotizen</h3>
              <div className="min-h-[150px] text-sm leading-relaxed italic text-slate-700 whitespace-pre-wrap">
                {isClient ? dailyNote : 'Laden...'}
              </div>
            </section>
          </div>
        )}

        {/* ANALYSE TAB */}
        {activeTab === 'analysis' && (
          <section className="bg-white border border-slate-200 p-12 space-y-10 shadow-sm animate-in fade-in duration-300 font-sans">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 border-b pb-4 mb-8">Dokumentation</h2>
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex justify-between">Fortschritt (Seite)</label>
              <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaterials(materials.map(m => m.id === selectedId ? {...m, currentPage: val} : m));
                }}
                className="w-full h-[2px] bg-slate-100 accent-black appearance-none cursor-pointer" />
              <div className="text-center text-4xl font-black">{current.currentPage}</div>
            </div>
            <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
              placeholder="Gelerntes heute..." className="w-full h-80 p-8 text-sm italic border-none bg-slate-50/50 focus:ring-1 focus:ring-slate-100 outline-none transition-all resize-none" />
            <button onClick={() => alert("Gespeichert")} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all">Speichern</button>
          </section>
        )}

        {/* SETUP TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 font-sans">
            <button onClick={() => {
              const n = { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 };
              setMaterials([...materials, n]);
            }} className="bg-black text-white p-3 rounded-full shadow-lg mb-8 hover:scale-105 transition-all"><Plus /></button>
            {materials.map(m => (
              <div key={m.id} className={`bg-white border p-10 flex flex-col gap-6 transition-all ${selectedId === m.id ? 'border-slate-950 shadow-md' : 'border-slate-100 opacity-50'}`}>
                <input value={m.name} onChange={(e) => {
                  setMaterials(materials.map(mat => mat.id === m.id ? {...mat, name: e.target.value} : mat));
                }} className="text-lg font-bold italic bg-transparent border-b border-transparent focus:border-slate-900 outline-none w-full" />
                <div className="flex gap-4">
                  <button onClick={() => setSelectedId(m.id)} className={`text-[10px] px-4 py-1 font-bold uppercase border ${selectedId === m.id ? 'bg-black text-white' : 'text-slate-300'}`}>Aktiv</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* 印刷ボタン */}
      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-full shadow-2xl hover:bg-slate-50 transition-all">
          <Printer className="w-5 h-5 text-slate-950" />
        </button>
      </div>
    </div>
  );
}
