"use client";

import React, { useState, useRef } from 'react';
import { Printer, Calculator, Calendar, BookOpen, Upload, Settings, BarChart3, FileText, ChevronRight } from "lucide-react";

export default function StudyKarteApp() {
  // 画面遷移（タブ）管理
  const [activeTab, setActiveTab] = useState<'settings' | 'analysis' | 'report'>('settings');

  // 共通データ管理
  const [materialName, setMaterialName] = useState("メイン教材");
  const [totalPages, setTotalPages] = useState(300);
  const [currentPage, setCurrentPage] = useState(0);
  const [dailyPace, setDailyPace] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ロジック計算
  const remainingPages = totalPages - currentPage;
  const daysToFinish = dailyPace > 0 ? Math.ceil(remainingPages / dailyPace) : 0;
  const finishDate = new Date();
  if (daysToFinish > 0) finishDate.setDate(finishDate.getDate() + daysToFinish);
  const progressPercent = Math.min(100, Math.floor((currentPage / totalPages) * 100));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 print:bg-white p-0">
      
      {/* 【ナビゲーション】 印刷時は非表示 */}
      <nav className="sticky top-0 z-10 bg-black text-white px-4 py-3 flex justify-around shadow-lg print:hidden">
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'settings' ? 'text-blue-400' : 'text-gray-400'}`}>
          <Settings className="w-5 h-5" /> 教材設定
        </button>
        <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'analysis' ? 'text-blue-400' : 'text-gray-400'}`}>
          <BarChart3 className="w-5 h-5" /> 記録・分析
        </button>
        <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'report' ? 'text-blue-400' : 'text-gray-400'}`}>
          <FileText className="w-5 h-5" /> カルテ表示
        </button>
      </nav>

      <main className="p-4 md:p-8 max-w-4xl mx-auto pb-24 print:p-0 print:max-w-none">
        
        {/* 1. 教材設定画面 */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <header className="flex items-center gap-2 mb-2">
              <Settings className="text-blue-600" />
              <h2 className="text-xl font-bold">教材設定</h2>
            </header>
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Material Name</label>
                <input type="text" value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="w-full text-lg p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="例: 数学I・A 基礎問題精講" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Total Pages</label>
                <input type="number" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} className="w-full text-lg p-3 border rounded-xl bg-gray-50" />
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-green-600">
                <Upload className="w-4 h-4" /> 教材データ連携
              </h3>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-white transition-colors">
                <input type="file" ref={fileInputRef} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center mx-auto text-gray-400 hover:text-blue-600">
                  <FileText className="w-12 h-12 mb-3" />
                  <span className="text-sm font-medium">教材PDFやスケジュール画像をアップロード</span>
                  <span className="text-xs mt-1 text-gray-300">※スマホのカメラからも選択可能</span>
                </button>
              </div>
            </section>

            <button onClick={() => setActiveTab('analysis')} className="w-full py-4 bg-black text-white rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all">
              記録・分析へ進む <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 2. 記録・分析画面 */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <header className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-blue-600" />
              <h2 className="text-xl font-bold">本日の記録と分析</h2>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700">{materialName}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">{progressPercent}% 完了</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">現在の完了ページ数</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max={totalPages} value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                    <input type="number" value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="w-20 p-2 border rounded-lg font-bold text-center" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">残りページ</p>
                    <p className="text-2xl font-black">{remainingPages} p</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">推定完了日</p>
                    <p className="text-lg font-black">{finishDate.toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveTab('report')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg">
              カルテ（印刷用）を生成 <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 3. カルテ表示画面（印刷用） */}
        {activeTab === 'report' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="bg-white shadow-2xl p-8 md:p-16 print:shadow-none print:p-8 print:w-full print:m-0 min-h-[297mm] border border-gray-100 print:border-none">
              <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-10">
                <h1 className="text-3xl font-black tracking-tighter italic">PROGRESS REPORT</h1>
                <div className="text-right font-mono text-xs">
                  <p>DATE: {new Date().toLocaleDateString('ja-JP')}</p>
                  <p>MATERIAL: {materialName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 print:grid-cols-2">
                <section className="space-y-4">
                  <h2 className="text-sm font-black bg-black text-white px-2 py-0.5 inline-block">VISUAL PROGRESS</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tabular-nums">{currentPage}</span>
                    <span className="text-2xl text-gray-300 font-light">/ {totalPages}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-6 border-2 border-black p-0.5">
                    <div className="bg-black h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </section>

                <section className="border-2 border-black p-6 space-y-4">
                  <h2 className="font-bold border-b-2 border-black pb-1">FORECAST</h2>
                  <div className="space-y-2 text-sm font-medium">
                    <p className="flex justify-between">現在の進捗率: <span>{progressPercent}%</span></p>
                    <p className="flex justify-between">1日のペース: <span>{dailyPace} ページ</span></p>
                    <p className="flex justify-between border-t border-gray-200 pt-2 text-lg font-black">完了まであと: <span>{daysToFinish} 日</span></p>
                  </div>
                </section>
              </div>

              <section className="space-y-4">
                <h2 className="font-bold text-lg border-l-8 border-black pl-3">NOTES & FEEDBACK</h2>
                <div className="w-full border-2 border-gray-300 h-96 print:h-[130mm] p-6 relative">
                  <span className="text-gray-200 font-serif italic absolute top-4 left-6 print:hidden underline">Memo details here...</span>
                </div>
              </section>

              <footer className="mt-20 pt-4 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 font-mono">
                <p>© 2025 STUDY KARTE SYSTEM</p>
                <p>CONFIDENTIAL PROGRESS DATA</p>
              </footer>
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 print:hidden">
              <button onClick={() => window.print()} className="bg-black text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" /> PDF保存・印刷
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
