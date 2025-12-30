"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, FileText, Settings, BarChart3, Trash2, BookOpen, Clock, Home, Upload, ImageIcon } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Material {
  id: string;
  name: string;
  totalPages: number;
  currentPage: number;
  dailyPace: number;
  lastStudyDate?: string;
}

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'settings'>('report');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 状態管理
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Material A", totalPages: 100, currentPage: 0, dailyPace: 5 }
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [dailyNote, setDailyNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const m = localStorage.getItem("karte_materials_v6");
    if (m) setMaterials(JSON.parse(m));
    const s = localStorage.getItem("karte_selectedId_v6");
    if (s) setSelectedId(s);
    const n = localStorage.getItem("karte_note_v6");
    if (n) setDailyNote(n);
    const a = localStorage.getItem("karte_ai_v6");
    if (a) setAiExplanations(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("karte_materials_v6", JSON.stringify(materials));
      localStorage.setItem("karte_selectedId_v6", selectedId);
      localStorage.setItem("karte_note_v6", dailyNote);
      localStorage.setItem("karte_ai_v6", JSON.stringify(aiExplanations));
    }
  }, [materials, selectedId, dailyNote, aiExplanations, mounted]);

  if (!mounted) return null;

  const current = materials.find(m => m.id === selectedId) || materials[0];
  const progress = Math.min(100, Math.floor((current.totalPages > 0 ? current.currentPage / current.totalPages : 0) * 100));
  const daysLeft = current.dailyPace > 0 ? Math.ceil((current.totalPages - current.currentPage) / current.dailyPace) : 0;
  const finishDate = new Date();
  if (daysLeft > 0) finishDate.setDate(finishDate.getDate() + daysLeft);

  // 今日やるべき範囲の計算
  const startPage = current.currentPage + 1;
  const endPage = Math.min(current.totalPages, current.currentPage + current.dailyPace);

  // 画像選択
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Gemini API 連携 (本物のAI分析) ---
  const runAiAnalysis = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return alert("APIキーが設定されていません。");
    if (!selectedImage) return alert("分析するスクリーンショットを選択してください。");

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = selectedImage.split(",")[1];
      const imagePart = { inlineData: { data: base64Data, mimeType: "image/jpeg" } };

      const prompt = `
        この教材のスクリーンショットと現在の学習状況を分析してください。
        教材名: ${current.name}
        現在のページ: ${current.currentPage}
        
        タスク:
        1. 画像内の重要コンセプトを抽出してください。
        2. エビングハウスの忘却曲線に基づき、次にいつこの範囲を復習すべきか、および復習のポイントを3つ日本語で提示してください。
        3. 回答は「ポイント1: [内容]」という形式で3つ出力してください。
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      const points = text.split('\n').filter(l => l.includes('ポイント')).slice(0, 3);
      
      setAiExplanations(points.length > 0 ? points : [text]);
      alert("AI分析が完了しました。レポートを確認してください。");
      setActiveTab('report');
    } catch (error) {
      console.error(error);
      alert("AI分析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-serif">
      
      {/* 共通ナビゲーション */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden">
        <button onClick={() => setActiveTab('report')} className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === 'report' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Bericht</button>
        <button onClick={() => setActiveTab('analysis')} className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
        <button onClick={() => setActiveTab('settings')} className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32 print:p-0">
        
        {/* ホームに戻るタイトル（非イタリック） */}
        <div className="mb-6 flex items-center gap-2 print:hidden cursor-pointer" onClick={() => setActiveTab('report')}>
          <Home className="w-3 h-3 text-slate-400" />
          <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-900">学習カルテ</h2>
        </div>

        {/* --- REPORT (Bericht) --- */}
        {activeTab === 'report' && (
          <div className="bg-white border border-slate-100 p-10 md:p-14 print:border-none print:p-0 min-h-[285mm] flex flex-col shadow-sm">
            <header className="flex justify-between items-end border-b border-slate-900 pb-4 mb-8">
              <div className="space-y-0.5">
                <p className="text-[8px] font-mono text-slate-400">Fall-Nr. 00{materials.findIndex(m => m.id === selectedId) + 1}</p>
                <h2 className="text-sm font-bold tracking-[0.2em] text-slate-900">学習カルテ</h2>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] font-bold uppercase">{current.name}</p>
                <p className="text-[8px] font-mono text-slate-400">Stand: {new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </header>

            <div className="flex-grow space-y-10">
              {/* Status */}
              <div className="grid grid-cols-2 gap-10 pb-8 border-b border-slate-50">
                <div className="space-y-4">
                  <h3 className="text-[8px] font-bold uppercase text-slate-300 tracking-widest">Status</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{current.currentPage}</span>
                    <span className="text-sm text-slate-200">/ {current.totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-[1px]"><div className="bg-slate-900 h-full" style={{ width: `${progress}%` }} /></div>
                </div>
                <div className="bg-slate-50/50 p-5 border border-slate-100">
                  <h3 className="text-[8px] font-bold uppercase text-slate-300 mb-2">Voraussicht</h3>
                  <p className="text-lg font-bold">{daysLeft} Tage</p>
                  <p className="text-[8px] text-slate-400 uppercase font-mono tracking-tighter">Enddatum: {finishDate.toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              {/* 今日の学習目標 (Tagesnotizen) */}
              <section className="space-y-4">
                <h3 className="text-[8px] font-bold uppercase text-slate-300 tracking-widest">Tagesnotizen</h3>
                <div className="min-h-[220px] text-xs leading-relaxed border-l border-slate-100 pl-6 space-y-4">
                  <div className="bg-slate-50 p-3 text-[10px] font-bold border-l-2 border-slate-950">
                    Heutiges Lernziel: Seite {startPage} bis {endPage}
                  </div>
                  <div className="italic text-slate-700 whitespace-pre-wrap">{dailyNote || "---"}</div>
                </div>
              </section>

              {/* AI復習ポイント */}
              <section className="p-6 bg-slate-50/30 border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-2.5 h-2.5 text-slate-900" /> AI復習ポイント
                  </h3>
                  <span className="text-[7px] text-slate-300 font-mono flex items-center gap-1 uppercase tracking-tighter">
                    <Clock className="w-2 h-2" /> Ebbinghaus-Kurve
                  </span>
                </div>
                {aiExplanations.length > 0 ? (
                  <ul className="space-y-3 text-[11px] italic leading-relaxed text-slate-800">
                    {aiExplanations.map((text, i) => <li key={i} className="flex gap-4 border-l border-slate-100 pl-4">{text}</li>)}
                  </ul>
                ) : (
                  <p className="text-[9px] italic text-slate-300">Analyse ausstehend...</p>
                )}
              </section>
            </div>
            
            <footer className="mt-10 pt-4 border-t border-slate-50 flex justify-between items-center opacity-20 text-[7px] font-mono uppercase tracking-widest">
              <span>Studienakte System v3.4</span>
              <div className="w-10 h-px bg-slate-900" />
            </footer>
          </div>
        )}

        {/* --- ANALYSIS (Analyse) --- */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Analyse ＆ Dokumentation</h2>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="bg-white border border-slate-100 text-[8px] font-bold uppercase p-1">
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <section className="bg-white border border-slate-200 p-8 space-y-10 shadow-sm">
              {/* スクリーンショット投稿欄 */}
              <div className="space-y-4">
                <label className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                  <ImageIcon className="w-3 h-3" /> Screenshot hochladen
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-100 h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-sm"
                >
                  {selectedImage ? (
                    <img src={selectedImage} alt="Preview" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                      <p className="text-[9px] text-slate-300 uppercase font-bold">Klicken zum Hochladen</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* 進捗入力 */}
              <div className="space-y-6">
                <label className="text-[8px] font-bold uppercase text-slate-400 flex justify-between tracking-widest">Fortschritt (S.) <span>{current.currentPage} / {current.totalPages}</span></label>
                <input type="range" min="0" max={current.totalPages} value={current.currentPage} 
                  onChange={(e) => setMaterials(materials.map(m => m.id === selectedId ? {...m, currentPage: Number(e.target.value)} : m))}
                  className="w-full h-[1px] bg-slate-100 accent-black appearance-none" />
              </div>

              {/* メモ入力 */}
              <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                placeholder="Heutige Aufzeichnungen..." className="w-full h-48 p-6 text-sm italic bg-slate-50/20 outline-none border-none resize-none font-serif" />

              <button 
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-4 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                {isAnalyzing ? "Analysiere..." : "Analyse & Speichern"} <Sparkles className="w-3 h-3" />
              </button>
            </section>
          </div>
        )}

        {/* SETUP */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
             <header className="border-b border-slate-100 pb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Setup</header>
             <div className="grid grid-cols-1 gap-4">
               {materials.map((m) => (
                 <div key={m.id} className={`bg-white border p-6 transition-all ${selectedId === m.id ? 'border-slate-950 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                   <div className="flex justify-between items-center mb-4">
                     <input type="text" value={m.name} onChange={(e) => setMaterials(materials.map(item => item.id === m.id ? {...item, name: e.target.value} : item))} className="text-md font-bold bg-transparent border-b border-transparent focus:border-slate-950 outline-none w-full mr-4" />
                     <button onClick={() => setSelectedId(m.id)} className={`text-[8px] px-3 py-1 font-bold uppercase border ${selectedId === m.id ? 'bg-black text-white' : 'text-slate-200'}`}>Aktiv</button>
                   </div>
                   <div className="grid grid-cols-2 gap-8 text-[8px] font-bold text-slate-300 uppercase">
                     <div><label>Seiten</label><input type="number" value={m.totalPages} onChange={(e) => setMaterials(materials.map(item => item.id === m.id ? {...item, totalPages: Number(e.target.value)} : item))} className="w-full text-md font-black border-b border-slate-50 bg-transparent outline-none text-slate-950" /></div>
                     <div><label>Tempo (p/T)</label><input type="number" value={m.dailyPace} onChange={(e) => setMaterials(materials.map(item => item.id === m.id ? {...item, dailyPace: Number(e.target.value)} : item))} className="w-full text-md font-black border-b border-slate-50 bg-transparent outline-none text-slate-950" /></div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-100 p-4 rounded-full shadow-lg text-slate-900"><Printer className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
