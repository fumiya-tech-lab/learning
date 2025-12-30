"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BarChart3, Trash2, BookOpen, Home, Upload, ImageIcon, CheckCircle2 } from "lucide-react";
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
    { id: '1', name: "Physik A", totalPages: 200, currentPage: 10, dailyPace: 5 },
    { id: '2', name: "Mathematik II", totalPages: 150, currentPage: 5, dailyPace: 3 }
  ]);
  const [dailyNote, setDailyNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("karte_parallel_v7");
    if (m) setMaterials(JSON.parse(m));
    const n = localStorage.getItem("karte_note_v7");
    if (n) setDailyNote(n);
    const a = localStorage.getItem("karte_ai_v7");
    if (a) setAiExplanations(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_parallel_v7", JSON.stringify(materials));
      localStorage.setItem("karte_note_v7", dailyNote);
      localStorage.setItem("karte_ai_v7", JSON.stringify(aiExplanations));
    }
  }, [materials, dailyNote, aiExplanations, mounted]);

  if (!mounted) return null;

  // --- 本物のAI分析 (Gemini API) ---
  const runAiAnalysis = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return alert("NEXT_PUBLIC_GEMINI_API_KEY が設定されていません。");
    if (!selectedImage) return alert("分析用のスクリーンショットを選択してください。");

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const base64Data = selectedImage.split(",")[1];
      const imagePart = { inlineData: { data: base64Data, mimeType: "image/jpeg" } };

      const prompt = `
        この教材のスクリーンショットを分析してください。
        
        指示:
        1. 画像から今日学んだ最重要キーワードを抽出してください。
        2. エビングハウスの忘却曲線に基づき、明日以降に復習すべき具体的なポイントを3つ日本語で提示してください。
        3. 回答は簡潔に「● [内容]」という形式で3行で出力してください。
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      setAiExplanations(response.text().split('\n').filter(l => l.trim() !== ""));
      alert("AI分析完了。レポートを確認してください。");
      setActiveTab('report');
    } catch (e) {
      console.error(e);
      alert("AI分析エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2D2D2D] font-serif">
      
      {/* 1. Navigation */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden">
        <button onClick={() => setActiveTab('report')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Bericht</button>
        <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
        <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-10 pb-32 print:p-0">
        
        {/* ホームタイトル（正体・戻りリンク） */}
        <div className="mb-8 flex items-center gap-2 print:hidden cursor-pointer" onClick={() => setActiveTab('report')}>
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-[12px] font-bold tracking-[0.3em] uppercase text-slate-900">学習カルテ</h2>
        </div>

        {/* --- REPORT (A4カルテ画面) --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-16 print:border-none print:p-0 min-h-[290mm] flex flex-col animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-10">
              <div>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. {new Date().getTime().toString().slice(-4)}</p>
                <h1 className="text-xl font-bold tracking-[0.3em] uppercase text-slate-900">学習カルテ</h1>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400">
                STATUS: PARALLEL STUDY<br />STAND: {new Date().toLocaleDateString('de-DE')}
              </div>
            </header>

            <div className="flex-grow space-y-12">
              {/* 複数教材の並列リスト */}
              <section className="space-y-6">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-4 border-b pb-1">Aktueller Fortschritt ＆ Tagesziel</h3>
                <div className="space-y-8">
                  {materials.map(m => {
                    const prog = Math.floor((m.currentPage / m.totalPages) * 100);
                    return (
                      <div key={m.id} className="grid grid-cols-[1fr_2fr] gap-10 items-center border-b border-slate-50 pb-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">{m.name}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black">{m.currentPage}</span>
                            <span className="text-[10px] text-slate-300">/ {m.totalPages}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400">
                            <span>{prog}% Abgeschlossen</span>
                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded-sm">Ziel: p{m.currentPage + 1} - {Math.min(m.totalPages, m.currentPage + m.dailyPace)}</span>
                          </div>
                          <div className="w-full bg-slate-50 h-[1px]"><div className="bg-slate-900 h-full transition-all duration-1000" style={{ width: `${prog}%` }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 今日のメモ */}
              <section className="space-y-4">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-300 border-b pb-1">Tagesnotizen</h3>
                <div className="min-h-[150px] text-[12px] leading-relaxed italic text-slate-700 whitespace-pre-wrap pl-6 border-l border-slate-100">
                  {dailyNote || "---"}
                </div>
              </section>

              {/* AI復習ポイント (計画の下) */}
              <section className="p-8 bg-slate-50/50 border border-slate-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
                </h3>
                {aiExplanations.length > 0 ? (
                  <ul className="space-y-4 text-[12px] italic leading-relaxed text-slate-800 border-l border-slate-200 pl-6">
                    {aiExplanations.map((text, i) => <li key={i}>{text}</li>)}
                  </ul>
                ) : (
                  <p className="text-[9px] italic text-slate-300">AI分析後にここに復習項目が表示されます。</p>
                )}
                <div className="mt-6 flex items-center gap-2 text-[8px] text-slate-300 font-mono uppercase tracking-tighter">
                   <CheckCircle2 className="w-2.5 h-2.5" /> Basierend auf Ebbinghaus-Kurve
                </div>
              </section>
            </div>

            <footer className="mt-12 pt-4 border-t border-slate-50 flex justify-between items-center opacity-20 text-[8px] font-mono uppercase tracking-widest">
              <span>Studienakte Parallel System v3.5</span>
              <div className="w-12 h-px bg-slate-900" />
            </footer>
          </div>
        )}

        {/* --- ANALYSIS (スクショ投稿・進捗更新) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Dokumentation ＆ AI-Analyse</h2>
            <section className="bg-white border border-slate-200 p-8 md:p-12 space-y-10 shadow-sm">
              
              {/* スクショ欄 */}
              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">1. Screenshot des Lernmaterials</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 h-56 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                  {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full object-contain p-4" /> : <div className="text-center text-slate-200"><Upload className="w-8 h-8 mx-auto mb-2" /><p className="text-[9px] font-bold uppercase">Hochladen</p></div>}
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { const r = new FileReader(); r.onloadend = () => setSelectedImage(r.result as string); r.readAsDataURL(f); }
                  }} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* 進捗更新 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {materials.map(m => (
                  <div key={m.id} className="space-y-3 bg-slate-50/50 p-4 border border-slate-100">
                    <label className="text-[9px] font-bold uppercase text-slate-400 flex justify-between italic">{m.name} <span>p.{m.currentPage}</span></label>
                    <input type="range" min="0" max={m.totalPages} value={m.currentPage} onChange={(e) => setMaterials(materials.map(mat => mat.id === m.id ? {...mat, currentPage: Number(e.target.value)} : mat))} className="w-full h-[1px] bg-slate-200 accent-black appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>

              {/* メモ */}
              <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)} placeholder="Tagesnotizen..." className="w-full h-48 p-6 text-sm italic bg-[#FDFDFD] border-none focus:ring-1 focus:ring-slate-100 outline-none resize-none" />

              <button onClick={runAiAnalysis} disabled={isAnalyzing} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all flex items-center justify-center gap-4">
                {isAnalyzing ? "Analysiere..." : "Analyse Starten"} <Sparkles className="w-4 h-4" />
              </button>
            </section>
          </div>
        )}

        {/* --- SETUP --- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2">Material Konfiguration</h2>
            <div className="grid grid-cols-1 gap-6">
              {materials.map(m => (
                <div key={m.id} className="bg-white border border-slate-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-grow space-y-2">
                    <input value={m.name} onChange={(e) => setMaterials(materials.map(mat => mat.id === m.id ? {...mat, name: e.target.value} : mat))} className="text-lg font-bold bg-transparent outline-none border-b border-transparent focus:border-slate-950 w-full" />
                    <div className="flex gap-10 text-[9px] font-bold uppercase text-slate-300">
                      <span>Total: {m.totalPages}p</span>
                      <span>Tempo: {m.dailyPace}p/Tag</span>
                    </div>
                  </div>
                  <button onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
              <button onClick={() => setMaterials([...materials, { id: Date.now().toString(), name: "Neues Material", totalPages: 100, currentPage: 0, dailyPace: 5 }])} className="py-4 border border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase hover:border-slate-900 hover:text-slate-900 transition-all">+ Hinzufügen</button>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-8 right-8 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-5 rounded-full shadow-2xl hover:bg-slate-50 transition-all text-slate-950">
          <Printer className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
