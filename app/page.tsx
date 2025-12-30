"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, Trash2, BookOpen, Home, Upload, CheckCircle2, Clock } from "lucide-react";
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
    { id: '1', name: "Material A", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [inputNote, setInputNote] = useState(""); // 分析ページでの入力
  const [storedReportNote, setStoredReportNote] = useState(""); // レポートに表示される確定ノート
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("karte_materials_v9");
    if (m) setMaterials(JSON.parse(m));
    const n = localStorage.getItem("karte_report_note_v9");
    if (n) setStoredReportNote(n);
    const a = localStorage.getItem("karte_ai_v9");
    if (a) setAiExplanations(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_materials_v9", JSON.stringify(materials));
      localStorage.setItem("karte_report_note_v9", storedReportNote);
      localStorage.setItem("karte_ai_v9", JSON.stringify(aiExplanations));
    }
  }, [materials, storedReportNote, aiExplanations, mounted]);

  if (!mounted) return null;

  // --- AI分析（夜の処理） ---
  const runAiAnalysis = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return alert("Gemini APIキーをVercelの環境変数に設定してください。");
    
    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let promptParts: any[] = [`
        学習記録と進捗を分析してください。
        
        【昨夜の気づき】: ${inputNote}
        
        指示:
        1. 忘却曲線に基づき、明日重点的に復習すべきポイントを3つ、日本語で「● [内容]」の形式で抽出してください。
        2. 学習者の気づきを整理し、明日の学習への具体的なアドバイスを1つ添えてください。
      `];

      if (selectedImage) {
        const base64Data = selectedImage.split(",")[1];
        promptParts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();
      
      // 分析結果を翌朝のレポート用に格納
      setAiExplanations(text.split('\n').filter(l => l.trim().startsWith('●')));
      setStoredReportNote(inputNote); // 分析時のメモをレポートに反映
      
      alert("分析が完了しました。翌朝のカルテに反映されます。");
      setInputNote("");
      setSelectedImage(null);
      setActiveTab('report');
    } catch (e) {
      console.error(e);
      alert("分析エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-serif">
      
      {/* Navigation (Menu only) */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden shadow-sm">
        {['report', 'analysis', 'settings'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === t ? 'text-black border-b border-black' : 'text-slate-300'}`}>
            {t === 'report' ? 'Bericht' : t === 'analysis' ? 'Analyse' : 'Setup'}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10 pb-32 print:p-0">
        
        {/* ホームに戻るタイトル（正体） */}
        <div className="mb-8 flex items-center gap-2 print:hidden cursor-pointer" onClick={() => setActiveTab('report')}>
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-[12px] font-bold tracking-[0.3em] uppercase text-slate-900">学習カルテ</h2>
        </div>

        {/* --- REPORT (翌朝の指示書) --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-200 p-10 md:p-16 print:border-none print:p-0 min-h-[290mm] animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-10">
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Fall-Nr. {new Date().getTime().toString().slice(-4)}</p>
                <h1 className="text-lg font-bold tracking-[0.3em] uppercase text-slate-950">学習カルテ</h1>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400">STAND: {new Date().toLocaleDateString('de-DE')}</div>
            </header>

            <div className="space-y-12">
              {/* Fortschritt Section */}
              <section className="space-y-6">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-300 border-b pb-1">Aktueller Fortschritt</h3>
                <div className="grid grid-cols-2 gap-8">
                  {materials.map(m => (
                    <div key={m.id} className="border-l border-slate-100 pl-4 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{m.name}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black">{m.currentPage}</span>
                        <span className="text-[10px] text-slate-200">/ {m.totalPages}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tagesnotizen (朝に確認する今日の計画) */}
              <section className="space-y-8">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-300 border-b pb-1">Tagesnotizen ＆ Ziele</h3>
                <div className="space-y-10 pl-6 border-l border-slate-100">
                  {/* 今日の目標範囲（改行して強調） */}
                  <div className="space-y-6">
                    {materials.map(m => (
                      <div key={m.id}>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">{m.name}</p>
                        <p className="text-xl font-black tracking-tight leading-tight mt-1 text-slate-900">
                          ZIEL: <br />
                          SEITE {m.currentPage + 1} — {Math.min(m.totalPages, m.currentPage + m.dailyPace)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* 昨夜の気づき（記録ページから引き継がれたもの） */}
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[9px] font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
                      <Clock className="w-2.5 h-2.5" /> Rückblick von gestern
                    </p>
                    <div className="text-[12px] leading-relaxed italic text-slate-700 whitespace-pre-wrap">
                      {storedReportNote || "Keine Aufzeichnungen vorhanden."}
                    </div>
                  </div>
                </div>
              </section>

              {/* AI復習ポイント（昨夜の分析結果） */}
              <section className="p-8 bg-slate-50/50 border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-slate-900" /> AI復習ポイント
                </h3>
                <ul className="space-y-4 text-[12px] italic leading-relaxed text-slate-800 pl-6 border-l border-slate-200 font-serif">
                  {aiExplanations.length > 0 ? (
                    aiExplanations.map((t, i) => <li key={i}>{t}</li>)
                  ) : (
                    <li className="text-slate-300 text-[9px]">Die Analyse für heute wurde noch nicht durchgeführt.</li>
                  )}
                </ul>
              </section>
            </div>

            <footer className="mt-20 pt-4 border-t border-slate-50 opacity-20 text-[8px] font-mono uppercase tracking-widest">Studienakte System v3.7</footer>
          </div>
        )}

        {/* --- ANALYSIS (夜の記録ページ) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Abendliche Dokumentation</h2>
              <div className="flex gap-2 text-[9px] font-bold text-slate-400">
                 PHASE A: INPUT ＆ ANALYSIS
              </div>
            </div>

            <section className="bg-white border border-slate-200 p-8 md:p-12 space-y-10 shadow-sm">
              {/* スクショ投稿 */}
              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">1. Lerninhalt Screenshot</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-sm overflow-hidden">
                  {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full w-full object-contain p-2" /> : <Upload className="w-6 h-6 text-slate-200" />}
                  <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* 今日の進捗更新 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {materials.map(m => (
                  <div key={m.id} className="space-y-2">
                    <label className="text-[9px] font-bold uppercase text-slate-400 flex justify-between">{m.name} <span>p.{m.currentPage}</span></label>
                    <input type="range" min="0" max={m.totalPages} value={m.currentPage} onChange={(e) => setMaterials(materials.map(mat => mat.id === m.id ? {...mat, currentPage: Number(e.target.value)} : mat))} className="w-full h-[1px] bg-slate-100 accent-black appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>

              {/* 今日の気づき入力（これが翌朝のレポートに載る） */}
              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">2. Heutige Erkenntnisse (Notizen)</label>
                <textarea 
                  value={inputNote} 
                  onChange={(e) => setInputNote(e.target.value)} 
                  placeholder="今日学んだこと、難しかったこと、明日に残したいメモ..." 
                  className="w-full h-48 p-6 text-sm italic bg-[#FDFDFD] border border-slate-50 focus:border-slate-200 outline-none resize-none font-serif" 
                />
              </div>

              <button 
                onClick={runAiAnalysis} 
                disabled={isAnalyzing} 
                className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all flex items-center justify-center gap-4"
              >
                {isAnalyzing ? "Analysiere..." : "Sichern ＆ Analyse starten"} <Sparkles className="w-3.5 h-3.5" />
              </button>
            </section>
          </div>
        )}

        {/* SETUP */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-100 pb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest font-sans">Material Konfiguration</header>
            {materials.map(m => (
              <div key={m.id} className="bg-white border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                <input value={m.name} onChange={(e) => setMaterials(materials.map(mat => mat.id === m.id ? {...mat, name: e.target.value} : mat))} className="text-lg font-bold bg-transparent outline-none w-full" />
                <div className="flex gap-6 text-[9px] font-bold uppercase text-slate-400">
                  <span>S:{m.totalPages}</span>
                  <span>T:{m.dailyPace}</span>
                  <button onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button onClick={() => setMaterials([...materials, { id: Date.now().toString(), name: "Material", totalPages: 100, currentPage: 0, dailyPace: 5 }])} className="w-full py-4 border border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase hover:border-slate-900 transition-all">+ Hinzufügen</button>
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
