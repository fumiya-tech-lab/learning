"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, Trash2, Upload, Save } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'karte' | 'analysis' | 'settings'>('karte');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    const m = localStorage.getItem("karte_final_v13");
    if (m) setMaterials(JSON.parse(m));
    const n = localStorage.getItem("note_final_v13");
    if (n) setStoredReportNote(n);
    const a = localStorage.getItem("ai_final_v13");
    if (a) setAiExplanations(JSON.parse(a));
  }, []);

  const saveAllData = (updatedMaterials?: Material[]) => {
    const dataToSave = updatedMaterials || materials;
    localStorage.setItem("karte_final_v13", JSON.stringify(dataToSave));
    localStorage.setItem("note_final_v13", storedReportNote);
    localStorage.setItem("ai_final_v13", JSON.stringify(aiExplanations));
  };

  if (!mounted) return null;

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const runAiAnalysis = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return alert("Gemini APIキーを設定してください。");
    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const today = new Date().toLocaleDateString('ja-JP');
      const prompt = `
        エビングハウスの忘却曲線に基づき、長期記憶を最大化する「復習処方箋」を日本語で作成してください。
        本日（${today}）学習した範囲を分析し、以下を出力してください。
        ● [復習予定日: 〇月〇日] / [復習範囲: p.〇-〇]
        要点: [簡潔な解説]
        復習日は今日から1日後、3日後、7日後を割り当ててください。
      `;
      const result = await model.generateContent(selectedImage ? [prompt, { inlineData: { data: selectedImage.split(",")[1], mimeType: "image/jpeg" } }] : [prompt]);
      setAiExplanations((await result.response).text().split('\n').filter(l => l.trim().startsWith('●') || l.trim().startsWith('要点')));
      setStoredReportNote(inputNote);
      saveAllData(); 
      setActiveTab('karte');
    } catch (e) { alert("Analyse-Fehler."); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-serif">
      
      {/* 1. Navigation */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden shadow-sm">
        <button onClick={() => setActiveTab('karte')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'karte' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Karte</button>
        <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
        <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10 pb-32 print:p-0">
        
        {/* --- KARTE (学習カルテ) --- */}
        {activeTab === 'karte' && (
          <div className="bg-white border border-slate-200 p-10 md:p-16 print:border-none print:p-0 min-h-[290mm] animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-slate-950 pb-6 mb-12">
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">ID: {new Date().getTime().toString().slice(-4)}</p>
                <h1 className="text-xl font-bold tracking-[0.3em] uppercase not-italic text-slate-950">学習カルテ</h1>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Täglicher Lernbericht <br /> {new Date().toLocaleDateString('de-DE')}
              </div>
            </header>

            <div className="space-y-12">
              {/* ZIEL (今日の計画) */}
              <section className="space-y-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-950 border-b border-slate-100 pb-2">Ziel (Heutige Planung)</h3>
                <div className="grid grid-cols-1 gap-10 pl-6 border-l-2 border-slate-950">
                  {materials.map((m, idx) => (
                    <div key={m.id} className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-slate-950 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px]">{idx + 1}</span>
                        {m.name}
                      </p>
                      <p className="text-2xl font-black tracking-tight leading-none text-slate-950 not-italic uppercase">
                        SEITE {m.currentPage + 1} <br /> 
                        <span className="text-slate-300 text-sm">BIS</span> {Math.min(m.totalPages, m.currentPage + m.dailyPace)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rückblick (昨日の気づき) */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-1">Rückblick von gestern</h3>
                <div className="text-[12px] leading-relaxed italic text-slate-700 whitespace-pre-wrap pl-6 border-l border-slate-50 min-h-[100px]">
                  {storedReportNote || ""}
                </div>
              </section>

              {/* AI復習ポイント */}
              <section className="p-8 bg-slate-50 border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" /> AI復習ポイント
                </h3>
                <ul className="space-y-6 text-[12px] leading-relaxed text-slate-900 pl-6 border-l border-slate-300 font-serif">
                  {aiExplanations.map((t, i) => (
                    <li key={i} className={t.startsWith('●') ? "font-bold mt-4" : "italic ml-4 text-slate-600"}>{t}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* --- ANALYSIS (記録・分析) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500 font-sans">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2">Dokumentation ＆ Analyse</h2>
            <section className="bg-white border border-slate-200 p-8 md:p-12 space-y-12 shadow-sm">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 h-64 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-sm">
                {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full object-contain p-2" /> : <p className="text-[9px] text-slate-300 uppercase font-bold text-center tracking-widest">Screenshot hochladen</p>}
                <input type="file" ref={fileInputRef} onChange={(e) => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-8">
                {materials.map(m => (
                  <div key={m.id} className="space-y-4 bg-slate-50/50 p-6 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" value={m.currentPage} onChange={(e) => updateMaterial(m.id, 'currentPage', Number(e.target.value))} className="w-16 bg-white border border-slate-200 text-center font-bold text-xs p-1 outline-none" />
                        <span className="text-[9px] text-slate-300">/ {m.totalPages}</span>
                      </div>
                    </div>
                    <input type="range" min="0" max={m.totalPages} value={m.currentPage} onChange={(e) => updateMaterial(m.id, 'currentPage', Number(e.target.value))} className="w-full h-[1px] bg-slate-200 accent-black appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>

              <textarea value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="Notizen..." className="w-full h-48 p-6 text-sm italic bg-[#FDFDFD] border border-slate-50 outline-none resize-none font-serif" />

              <button onClick={runAiAnalysis} disabled={isAnalyzing} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all">
                {isAnalyzing ? "Analysiere..." : "Sichern ＆ Analyse"}
              </button>
            </section>
          </div>
        )}

        {/* --- SETUP --- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 font-sans">
            <header className="border-b border-slate-100 pb-2 flex justify-between items-end">
               <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Setup</h2>
               <button onClick={() => { saveAllData(); alert("Gespeichert."); }} className="bg-slate-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black">
                 <Save className="w-3 h-3 inline mr-2" /> Speichern
               </button>
            </header>
            <div className="grid grid-cols-1 gap-6">
              {materials.map((m, idx) => (
                <div key={m.id} className="bg-white border border-slate-200 p-10 flex flex-col gap-8 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <div className="flex-grow">
                      <span className="text-[9px] font-mono text-slate-300 uppercase">Material 0{idx+1}</span>
                      <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, 'name', e.target.value)} className="block w-full text-lg font-bold bg-transparent outline-none not-italic" />
                    </div>
                    <button onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-slate-200 hover:text-red-500 ml-4"><Trash2 className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Seiten gesamt</label>
                      <input type="number" value={m.totalPages} onChange={(e) => updateMaterial(m.id, 'totalPages', Number(e.target.value))} className="w-full text-2xl font-black border-b border-slate-100 outline-none bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Tagesziel</label>
                      <input type="number" value={m.dailyPace} onChange={(e) => updateMaterial(m.id, 'dailyPace', Number(e.target.value))} className="w-full text-2xl font-black border-b border-slate-100 outline-none bg-transparent" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setMaterials([...materials, { id: Date.now().toString(), name: "Material", totalPages: 100, currentPage: 0, dailyPace: 5 }])} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase hover:border-slate-950 transition-all">+ Hinzufügen</button>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-5 rounded-full shadow-2xl text-slate-950"><Printer className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
