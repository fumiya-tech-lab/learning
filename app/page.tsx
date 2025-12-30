"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Calculator, Calendar, BookOpen, Upload, Settings, BarChart3, FileText, History, Trash2, Sparkles, Plus, ChevronDown } from "lucide-react";

export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('report');

  // 初期データ（LocalStorage読み込み前）
  const [materials, setMaterials] = useState([
    { id: 'default', name: "メイン教材", totalPages: 300, currentPage: 0, dailyPace: 10 }
  ]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('default');
  const [dailyNote, setDailyNote] = useState("");
  const [studyLogs, setStudyLogs] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // マウント後の処理
  useEffect(() => {
    try {
      const savedMaterials = localStorage.getItem("studyMaterials");
      if (savedMaterials) setMaterials(JSON.parse(savedMaterials));

      const savedLogs = localStorage.getItem("studyLogs");
      if (savedLogs) setStudyLogs(JSON.parse(savedLogs));

      const savedNote = localStorage.getItem("currentDailyNote");
      if (savedNote) setDailyNote(savedNote);

      const savedAi = localStorage.getItem("aiAnalysis");
      if (savedAi) setAiAnalysis(JSON.parse(savedAi));
    } catch (e) {
      console.error("Data loading error:", e);
    }
    setMounted(true);
  }, []);

  // データ保存
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("studyMaterials", JSON.stringify(materials));
      localStorage.setItem("currentDailyNote", dailyNote);
    }
  }, [materials, dailyNote, mounted]);

  if (!mounted) return <div className="min-h-screen bg-white" />; // 読み込み中は真っ白を防ぐ

  const currentMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];
  const progressPercent = Math.min(100, Math.floor((currentMaterial.currentPage / currentMaterial.totalPages) * 100));
  const remainingPages = currentMaterial.totalPages - currentMaterial.currentPage;
  const daysToFinish = currentMaterial.dailyPace > 0 ? Math.ceil(remainingPages / currentMaterial.dailyPace) : 0;
  const finishDate = new Date();
  if (daysToFinish > 0) finishDate.setDate(finishDate.getDate() + daysToFinish);

  // 教材追加
  const addMaterial = () => {
    const newM = { id: Date.now().toString(), name: "新しい教材", totalPages: 100, currentPage: 0, dailyPace: 5 };
    setMaterials([...materials, newM]);
    setSelectedMaterialId(newM.id);
  };

  const updateMaterial = (id, updates) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-950">
      <nav className="sticky top-0 z-20 bg-slate-950 text-white px-2 py-4 flex justify-around print:hidden">
        <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === 'report' ? 'text-white border-b' : 'text-slate-500'}`}>
          <FileText className="w-5 h-5" /><span>カルテ</span>
        </button>
        <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === 'analysis' ? 'text-white border-b' : 'text-slate-500'}`}>
          <BarChart3 className="w-5 h-5" /><span>記録</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === 'settings' ? 'text-white border-b' : 'text-slate-500'}`}>
          <Settings className="w-5 h-5" /><span>設定</span>
        </button>
      </nav>

      <main className="p-4 md:p-12 max-w-5xl mx-auto pb-32">
        {activeTab === 'report' && (
          <div className="bg-white border p-8 md:p-16 print:border-none">
            <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
              <div><p className="text-[10px] text-gray-400">FALL NR. 001</p><h1 className="text-2xl font-black italic">学習カルテ</h1></div>
              <div className="text-right text-xs"><b>{currentMaterial.name}</b><p>{new Date().toLocaleDateString('ja-JP')}</p></div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
              <div className="space-y-4">
                <h2 className="text-xs font-bold bg-black text-white px-2 py-1 inline-block">進捗</h2>
                <p className="text-6xl font-black">{currentMaterial.currentPage}<span className="text-xl text-gray-300"> / {currentMaterial.totalPages}</span></p>
                <div className="w-full bg-gray-100 h-2 border border-black"><div className="bg-black h-full" style={{ width: `${progressPercent}%` }} /></div>
              </div>
              <div className="border border-black p-4"><p className="text-xs text-gray-400">完了予測</p><p className="text-2xl font-bold">残り {daysToFinish} 日</p></div>
            </div>
            <section className="space-y-4">
              <h2 className="text-sm font-bold border-l-8 border-black pl-2">本日のメモ</h2>
              <div className="border p-4 min-h-[100px] italic bg-gray-50">{dailyNote || "なし"}</div>
            </section>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-8">
            <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0_0_#000]">
              <label className="text-xs font-bold uppercase">進捗更新</label>
              <input type="range" min="0" max={currentMaterial.totalPages} value={currentMaterial.currentPage} 
                onChange={(e) => updateMaterial(selectedMaterialId, { currentPage: Number(e.target.value) })}
                className="w-full mt-2" />
              <textarea value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                placeholder="今日の振り返り..." className="w-full mt-4 border p-2 h-32 outline-none" />
              <button onClick={() => alert("保存しました")} className="w-full mt-4 bg-black text-white py-3 font-bold">保存</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <button onClick={addMaterial} className="bg-black text-white p-2 rounded-full"><Plus /></button>
            {materials.map(m => (
              <div key={m.id} className={`p-4 border-2 ${selectedMaterialId === m.id ? 'border-black' : 'border-gray-100'}`}>
                <input value={m.name} onChange={(e) => updateMaterial(m.id, { name: e.target.value })} className="font-bold border-b w-full outline-none" />
                <button onClick={() => setSelectedMaterialId(m.id)} className="text-[10px] mt-2 border px-2">選択</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
