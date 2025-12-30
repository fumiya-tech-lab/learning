"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Calculator, Calendar, BookOpen } from "lucide-react";

export default function StudyKarte() {
  // 状態管理
  const [totalPages, setTotalPages] = useState(300);
  const [currentPage, setCurrentPage] = useState(0);
  const [dailyPace, setDailyPace] = useState(10); // 1日の目標ページ数

  // 計算ロジック: 残りページ数から完了までの日数を算出
  const remainingPages = totalPages - currentPage;
  const daysToFinish = dailyPace > 0 ? Math.ceil(remainingPages / dailyPace) : 0;
  
  // 完了予定日の計算
  const finishDate = new Date();
  if (daysToFinish > 0) {
    finishDate.setDate(finishDate.getDate() + daysToFinish);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-0">
        
        {/* 【設定パネル】 印刷時には完全に非表示 */}
        <Card className="print:hidden shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" /> 学習計画の入力
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">総ページ数</label>
              <Input 
                type="number" 
                value={totalPages} 
                onChange={(e) => setTotalPages(Number(e.target.value))}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">現在の完了ページ</label>
              <Input 
                type="number" 
                value={currentPage} 
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">1日のペース (p/日)</label>
              <Input 
                type="number" 
                value={dailyPace} 
                onChange={(e) => setDailyPace(Number(e.target.value))}
                className="bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* 【学習カルテ本体】 */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-lg p-6 md:p-12 print:shadow-none print:border-none print:p-8 print:m-0 print:w-full print:rounded-none">
          
          {/* ヘッダー部分 */}
          <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-gray-800">学 習 カ ル テ</h1>
            <div className="text-right text-[10px] md:text-xs text-gray-500 font-mono space-y-0.5">
              <p>DATE: {new Date().toLocaleDateString('ja-JP')}</p>
              <p>STATUS: {currentPage >= totalPages ? 'COMPLETED' : 'IN PROGRESS'}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* 上段：進捗と予測の2カラム（スマホでは縦並び、印刷では横並び） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-8 border-b pb-6">
              
              {/* 進捗状況 */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold border-l-4 border-black pl-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> 進捗状況
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-light">{currentPage}</span>
                  <span className="text-gray-400 text-sm">/ {totalPages} ページ</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-black h-full transition-all duration-700" 
                    style={{ width: `${Math.min(100, (currentPage / totalPages) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">達成率: {Math.floor((currentPage / totalPages) * 100)}%</p>
              </div>

              {/* 完了予測 */}
              <div className="bg-gray-50 p-4 rounded print:bg-white print:border print:p-3 space-y-2">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" /> 完了予測
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p>目標ペース: <span className="font-semibold">{dailyPace} p/日</span></p>
                  <p>残りページ: <span className="font-semibold">{remainingPages} p</span></p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-[10px] text-gray-500">完了予定まであと</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{daysToFinish}</span>
                    <span className="text-xs font-normal">日</span>
                    <span className="text-xs text-gray-600 ml-2">({finishDate.toLocaleDateString('ja-JP')} 予定)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 本日の学習内容：2枚目に行かないようコンパクトに */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold border-l-4 border-black pl-2">本日の学習内容</h2>
              <div className="border border-dashed border-gray-300 rounded p-3 min-h-[60px] text-sm text-gray-700">
                <p className="font-medium">教材：メイン教材 (現在 {currentPage} ページまで完了)</p>
                <p className="text-xs text-gray-500 mt-1">※ 本日の具体的な範囲や課題をここに記入してください。</p>
              </div>
            </section>

            {/* 振り返り・メモ：高さを柔軟にし、印刷時のはみ出しを防止 */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold border-l-4 border-black pl-2">振り返り・メモ</h2>
              <div className="border border-gray-300 rounded w-full p-4 min-h-[180px] print:min-h-[250px] bg-gray-50/30 print:bg-white">
                <p className="text-xs text-gray-300 print:hidden italic">（印刷後、こちらに手書きで記入できます）</p>
              </div>
            </section>
          </div>

          <footer className="mt-8 pt-4 border-t border-gray-100 text-[9px] text-gray-400 flex justify-between items-center print:mt-12">
            <p>© 2025 Study Karte System - Focus on your goals.</p>
            <p className="font-mono uppercase">Reference: SK-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
          </footer>
        </div>

        {/* 【印刷ボタン】 スマホでも押しやすいサイズ */}
        <div className="flex justify-center pb-12 print:hidden">
          <Button 
            onClick={() => window.print()} 
            className="gap-2 px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all bg-black hover:bg-gray-800 rounded-full"
          >
            <Printer className="w-6 h-6" /> カルテを印刷する
          </Button>
        </div>
      </div>
    </div>
  );
}
