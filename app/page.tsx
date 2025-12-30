"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, Trash2, BookOpen, Home, Upload, CheckCircle2, Clock, Edit3 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 状態管理
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Material 1", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [inputNote, setInputNote] = useState("");
  const [storedReportNote, setStoredReportNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("karte_v10");
    if (m) setMaterials(JSON.parse(m));
    const n = localStorage.getItem("note_v10");
    if (n) setStoredReportNote(n);
    const a = localStorage.getItem("ai_v10");
    if (a) setAiExplanations(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_v10", JSON.stringify(materials));
      localStorage.setItem("note_v10", storedReportNote);
      localStorage.setItem("ai_v10", JSON.stringify(aiExplanations));
    }
  }, [materials, storedReportNote, aiExplanations, mounted]);

  if (!mounted) return null;

  // 教材更新用の汎用関数（バグ修正済み）
  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // AI分析処理
  const runAiAnalysis = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return alert("Gemini API-Key fehlt.");
    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `学習進捗と画像を分析し、忘却曲線に基づいた復習ポイントを3つ、日本語で「● [内容]」の形式で出力してください。`;
      const result = await model.generateContent(selectedImage ? [prompt, { inlineData: { data: selectedImage.split(",")[1], mimeType: "image/jpeg" } }] : [prompt]);
      setAiExplanations((await result.response).text().split('\n').filter(l => l.trim().startsWith('●')));
      setStoredReportNote(inputNote);
      alert("Analyse abgeschlossen. Plan wurde aktualisiert.");
      setInputNote("");
      setSelectedImage(null);
      setActiveTab('report');
    } catch (e) { alert("Fehler bei der Analyse."); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-serif">
      
      {/* 1. Navigation */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden">
        {['report', 'analysis', 'settings'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === t ? 'text-black border-b border-black' : 'text-slate-300'}`}>
            {t === 'report' ? 'Bericht' : t === 'analysis' ? 'Analyse' : 'Setup'}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10 pb-32 print:p-0">
        
        <div className="mb-8 flex items-center gap-2 print:hidden cursor-pointer" onClick={() => setActiveTab('report')}>
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-900">学習カルテ</h2>
        </div>

        {/* --- REPORT (Bericht) --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-16 print:border-none print:p-0 min-h-[290mm] animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-slate-950 pb-6 mb-12">
              <div className="space-y-0.5 text-slate-950">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. {new Date().getTime().toString().slice(-4)}</p>
                <h1 className="text-xl font-bold tracking-[0.3em] uppercase">学習カルテ</h1>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Daily Medical Record <br /> {new Date().toLocaleDateString('de-DE')}
              </div>
            </header>

            <div className="space-y-12">
              {/* ご提案の「目標 (ZIEL)」メイン構造 */}
              <section className="space-y-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-950 border-b border-slate-100 pb-2">Ziel (Heutige Planung)</h3>
                <div className="grid grid-cols-1 gap-8 pl-6 border-l-2 border-slate-950">
                  {materials.map((m, idx) => (
                    <div key={m.id} className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-slate-950 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px]">{idx + 1}</span>
                        {m.name}
                      </p>
                      <p className="text-2xl font-black tracking-tight leading-none text-slate-950">
                        SEITE {m.currentPage + 1} — {Math.min(m.totalPages, m.currentPage + m.dailyPace)}
                      </p>
                      <div className="flex gap-4 text-[9px] text-slate-300 font-mono italic">
                        <span>Stand: {m.currentPage}p</span>
                        <span>Gesamt: {m.totalPages}p</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rückblick (昨夜の気づき) */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-1">Rückblick von gestern</h3>
                <div className="text-[12px] leading-relaxed italic text-slate-700 whitespace-pre-wrap pl-6 border-l border-slate-50 min-h-[100px]">
                  {storedReportNote || "Keine Aufzeichnungen vorhanden."}
                </div>
              </section>

              {/* AI復習ポイント */}
              <section className="p-8 bg-slate-50 border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" /> AI復習ポイント
                </h3>
                <ul className="space-y-5 text-[12px] italic leading-relaxed text-slate-900 pl-6 border-l border-slate-300">
                  {aiExplanations.length > 0 ? aiExplanations.map((t, i) => <li key={i}>{t}</li>) : <li className="text-slate-300 text-[9px]">Warten auf Analyse...</li>}
                </ul>
                <div className="mt-8 flex items-center gap-2 text-[8px] text-slate-300 font-mono uppercase tracking-[0.2em] border-t pt-4">
                   <Clock className="w-2.5 h-2.5" /> Ebbinghaus-Gedächtniskurve Algorithmus
                </div>
              </section>
            </div>
            <footer className="mt-20 pt-4 border-t border-slate-100 text-[8px] font-mono uppercase tracking-widest opacity-20">Studienakte Parallel v3.8</footer>
          </div>
        )}

        {/* --- ANALYSIS (入力ページ) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2 italic">Phase A: Input ＆ Dokumentation</h2>
            <section className="bg-white border border-slate-200 p-8 md:p-12 space-y-12 shadow-sm">
              
              {/* スクショ */}
              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Upload className="w-3 h-3" /> Screenshot</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 h-64 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-sm overflow-hidden">
                  {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full object-contain p-2" /> : <p className="text-[9px] text-slate-300 uppercase font-bold">Bild auswählen</p>}
                  <input type="file" ref={fileInputRef} onChange={(e) => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* 進捗入力 (数値入力＋スライダー) */}
              <div className="space-y-8">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Fortschritt (Aktuelle Seite)</label>
                <div className="grid grid-cols-1 gap-8">
                  {materials.map(m => (
                    <div key={m.id} className="space-y-3 bg-slate-50/50 p-6 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold uppercase text-slate-900">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={m.currentPage} 
                            onChange={(e) => updateMaterial(m.id, 'currentPage', Math.min(m.totalPages, Number(e.target.value)))}
                            className="w-16 bg-white border border-slate-200 text-center font-bold text-xs p-1 outline-none" 
                          />
                          <span className="text-[9px] text-slate-300">/ {m.totalPages}</span>
                        </div>
                      </div>
                      <input type="range" min="0" max={m.totalPages} value={m.currentPage} onChange={(e) => updateMaterial(m.id, 'currentPage', Number(e.target.value))} className="w-full h-[1px] bg-slate-200 accent-black appearance-none cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Erkenntnisse / Notizen</label>
                <textarea value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="今日の内容、難所、明日のためのメモ..." className="w-full h-48 p-6 text-sm italic bg-[#FDFDFD] border border-slate-50 outline-none resize-none font-serif" />
              </div>

              <button onClick={runAiAnalysis} disabled={isAnalyzing} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all">
                {isAnalyzing ? "Analysiere..." : "Sichern ＆ Analyse"}
              </button>
            </section>
          </div>
        )}

        {/* --- SETUP (編集機能修正版) --- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 font-sans">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2 italic">Konfiguration</h2>
            <div className="grid grid-cols-1 gap-6">
              {materials.map((m, idx) => (
                <div key={m.id} className="bg-white border border-slate-200 p-10 flex flex-col gap-8 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <div className="flex-grow">
                      <span className="text-[9px] font-mono text-slate-300 uppercase">Material ID: 0{idx+1}</span>
                      <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, 'name', e.target.value)} className="block w-full text-lg font-bold bg-transparent outline-none focus:text-slate-950" />
                    </div>
                    <button onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-slate-200 hover:text-red-500 transition-colors ml-4"><Trash2 className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Seiten gesamt</label>
                      <input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, 'totalPages', Number(e.target.value))} className="w-full text-2xl font-black border-b border-slate-100 outline-none bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Tagesziel (P)</label>
                      <input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, 'dailyPace', Number(e.target.value))} className="w-full text-2xl font-black border-b border-slate-100 outline-none bg-transparent" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setMaterials([...materials, { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 }])} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase hover:border-slate-950 hover:text-slate-950 transition-all">+ Material Hinzufügen</button>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-5 rounded-full shadow-2xl hover:bg-slate-50 transition-all text-slate-950"><Printer className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
