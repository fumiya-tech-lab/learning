"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Calculator, Calendar, BookOpen, Upload, Settings, BarChart3, FileText, History, Trash2, Sparkles, ChevronRight } from "lucide-react";

// 型定義
interface AiAnalysis {
  materialName: string;
  explanations: string[];
  timestamp: string;
}

interface StudyLog {
  date: string;
  summary: string;
}

export default function StudyKarteApp() {
  // 初期画面を「report」に設定
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'history' | 'settings'>('report');
  const [mounted, setMounted] = useState(false);

  // 状態管理
  const [materialName, setMaterialName] = useState("Hauptlehrgang");
  const [totalPages, setTotalPages] = useState(300);
  const [currentPage, setCurrentPage] = useState(0);
  const [dailyPace, setDailyPace] = useState(10);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初回データ読み込み
  useEffect(() => {
    setMounted(true);
    const savedAi = localStorage.getItem("aiAnalysis");
    if (savedAi) setAiAnalysis(JSON.parse(savedAi));
    const savedLogs = localStorage.getItem("studyLogs");
    if (savedLogs) setStudyLogs(JSON.parse(savedLogs));
  }, []);

  // 計算ロジック
  const progressPercent = Math.min(100, Math.floor((currentPage / totalPages) * 100));
  const remainingPages = totalPages - currentPage;
  const daysToFinish = dailyPace > 0 ? Math.ceil(remainingPages / dailyPace) : 0;
  const finishDate = new Date();
  if (daysToFinish > 0) finishDate.setDate(finishDate.getDate() + daysToFinish);

  // AI解析実行（プロンプトに基づく要点抽出）
  const handleAiUpload = () => {
    alert("KI-Analyse der wichtigsten Punkte gestartet...");
    
    // システム内部プロンプト: "Extrahiere 3 zentrale Konzepte für die morgige Wiederholung."
    setTimeout(() => {
      const result: AiAnalysis = {
        materialName: materialName,
        explanations: [
          "Konzept der Intertextualität: Texte existieren nicht isoliert, sondern beziehen sich stets auf andere Diskurse.",
          "Semiotisches Dreieck: Die notwendige Differenzierung zwischen Zeichen, Vorstellung und Realobjekt.",
          "Strukturelle Analyse: Fokus auf die zugrunde liegenden Systeme, die kulturelle Praktiken erst ermöglichen."
        ],
        timestamp: new Date().toLocaleDateString('de-DE')
      };
      setAiAnalysis(result);
      localStorage.setItem("aiAnalysis", JSON.stringify(result));
      alert("KI-Analyse abgeschlossen. Die Erläuterungen wurden in die Karte integriert.");
    }, 1500);
  };

  // 進捗保存
  const handleSaveProgress = () => {
    const newLog = {
      date: new Date().toLocaleString('de-DE'),
      summary: `${materialName}: Stand ${currentPage}p. Noch ${daysToFinish} Tage.`
    };
    const updated = [newLog, ...studyLogs];
    setStudyLogs(updated);
    localStorage.setItem("studyLogs", JSON.stringify(updated));
    alert("Fortschritt gespeichert.");
  };

  const deleteLog = (index: number) => {
    if (confirm("Löschen?")) {
      const updated = studyLogs.filter((_, i) => i !== index);
      setStudyLogs(updated);
      localStorage.setItem("studyLogs", JSON.stringify(updated));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white font-serif text-slate-950 print:bg-white p-0">
      
      {/* ナビゲーション（フッターなし、トップに集約） */}
      <nav className="sticky top-0 z-20 bg-slate-950 text-white px-2 py-4 flex justify-around shadow-2xl print:hidden">
        <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'report' ? 'text-white border-b border-white' : 'text-slate-500'}`}>
          <FileText className="w-5 h-5" /> Karte
        </button>
        <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'analysis' ? 'text-white border-b border-white' : 'text-slate-500'}`}>
          <BarChart3 className="w-5 h-5" /> Analyse
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'history' ? 'text-white border-b border-white' : 'text-slate-500'}`}>
          <History className="w-5 h-5" /> Verlauf
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'settings' ? 'text-white border-b border-white' : 'text-slate-500'}`}>
          <Settings className="w-5 h-5" /> Setup
        </button>
      </nav>

      <main className="p-4 md:p-12 max-w-5xl mx-auto pb-32 print:p-0">
        
        {/* 1. ホーム画面: 学習カルテ */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white border-[1px] border-slate-200 p-8 md:p-16 print:border-none print:p-8 min-h-[297mm]">
              <header className="flex justify-between items-end border-b-2 border-slate-950 pb-6 mb-12">
                <h1 className="text-4xl font-black tracking-[0.2em] italic">学習カルテ</h1>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  <p>DATUM: {new Date().toLocaleDateString('de-DE')}</p>
                </div>
              </header>

              {/* AI要点解説（前日の分析結果をここに表示） */}
              <section className="mb-12 p-8 border-[1px] border-slate-950 bg-slate-50/20">
                <h2 className="text-[11px] font-black mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Erläuterungen zur Wiederholung
                </h2>
                {aiAnalysis ? (
                  <ul className="space-y-6">
                    {aiAnalysis.explanations.map((text, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="font-mono text-xs border-b border-slate-950">0{i+1}</span>
                        <p className="text-sm leading-relaxed italic text-slate-800">{text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-300 italic">Keine Analysedaten verfügbar. Bitte laden Sie Material unter 'Analyse' hoch.</p>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12 print:grid-cols-2">
                <section className="space-y-6">
                  <h2 className="text-[11px] font-black bg-slate-950 text-white px-3 py-1 inline-block uppercase tracking-[0.4em]">Status</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-8xl font-black tracking-tighter">{currentPage}</span>
                    <span className="text-3xl text-slate-200 italic">/ {totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 border border-slate-950">
                    <div className="bg-slate-950 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </section>

                <section className="border-[1px] border-slate-950 p-8 space-y-4">
                  <h3 className="text-xs font-black border-b border-slate-100 pb-2 uppercase tracking-widest text-slate-400">Prognose</h3>
                  <div className="space-y-2 text-sm italic">
                    <p className="flex justify-between">Abgeschlossen: <span>{progressPercent}%</span></p>
                    <p className="flex justify-between border-t border-slate-50 pt-4 text-2xl font-black not-italic">Restzeit: <span>{daysToFinish} Tage</span></p>
                  </div>
                </section>
              </div>

              <section className="space-y-6">
                <h2 className="font-black text-sm border-l-[12px] border-slate-950 pl-4 uppercase tracking-widest">Tagesnotizen</h2>
                <div className="w-full border border-slate-200 h-[100mm] bg-slate-50/10" />
              </section>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 print:hidden">
              <button onClick={() => window.print()} className="bg-slate-950 text-white px-10 py-4 font-bold shadow-2xl flex items-center gap-3 uppercase text-xs tracking-widest hover:invert transition-all">
                <Printer className="w-4 h-4" /> Drucken / PDF
              </button>
            </div>
          </div>
        )}

        {/* 2. 記録・分析画面 (AIアップロード機能) */}
        {activeTab === 'analysis' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <header className="border-b-4 border-slate-950 pb-2">
              <h2 className="text-2xl font-black italic uppercase">Analyse & Upload</h2>
            </header>

            {/* AI解析アップロード */}
            <section className="bg-slate-950 text-white p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <Sparkles className="text-blue-400 w-6 h-6" />
                <h3 className="text-lg font-bold tracking-widest uppercase italic">KI-Analyse</h3>
              </div>
              <div 
                className="border-2 border-dashed border-slate-700 p-12 text-center cursor-pointer hover:border-blue-400 transition-all"
                onClick={handleAiUpload}
              >
                <input type="file" ref={fileInputRef} className="hidden" />
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-sm font-bold uppercase tracking-widest">Inhalt hochladen</p>
                <p className="text-[10px] text-slate-500 mt-2 italic font-mono">Generiert Erläuterungen für morgen</p>
              </div>
            </section>

            {/* 進捗入力 */}
            <section className="bg-white p-10 border-2 border-slate-950 space-y-8 shadow-[12px_12px_0px_0px_rgba(241,245,249,1)]">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Fortschritt (S.)</label>
                <div className="flex items-center gap-10 mt-4">
                  <input type="range" min="0" max={totalPages} value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="flex-grow h-1 bg-slate-100 appearance-none cursor-pointer accent-slate-950" />
                  <span className="text-6xl font-black">{currentPage}</span>
                </div>
              </div>
              <button onClick={handleSaveProgress} className="w-full py-5 bg-slate-950 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                Fortschritt Speichern
              </button>
            </section>
          </div>
        )}

        {/* 3. 学習履歴画面 */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b-4 border-slate-950 pb-2 font-black italic text-2xl uppercase">Verlauf</header>
            <div className="space-y-4">
              {studyLogs.length === 0 ? (
                <p className="text-center py-20 text-slate-300 italic">Noch keine Einträge vorhanden.</p>
              ) : (
                studyLogs.map((log, i) => (
                  <div key={i} className="bg-white p-6 border-l-[12px] border-slate-950 shadow-sm flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 font-mono uppercase">{log.date}</p>
                      <p className="text-lg italic font-serif leading-relaxed text-slate-800">"{log.summary}"</p>
                    </div>
                    <button onClick={() => deleteLog(i)} className="text-slate-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. 教材・計画設定画面 */}
        {activeTab === 'settings' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            <header className="border-b-4 border-slate-950 pb-2 font-black italic text-2xl uppercase">Setup</header>
            <div className="bg-white p-10 border-2 border-slate-100 space-y-10">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Material</label>
                <input type="text" value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="w-full text-2xl py-2 border-b-2 border-slate-950 outline-none font-bold italic" />
              </div>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Seiten gesamt</label>
                  <input type="number" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} className="w-full text-4xl py-2 border-b border-slate-100 outline-none font-black" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Tagesziel</label>
                  <input type="number" value={dailyPace} onChange={(e) => setDailyPace(Number(e.target.value))} className="w-full text-4xl py-2 border-b border-slate-100 outline-none font-black" />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
              }
