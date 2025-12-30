"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Calculator, Calendar, BookOpen, Upload, Settings, BarChart3, FileText, History, Trash2, Sparkles, Plus } from "lucide-react";
// AIライブラリの読み込み
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function StudyKarteApp() {
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'history' | 'settings'>('report');
  const [mounted, setMounted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 教材・メモ・分析データの管理
  const [materials, setMaterials] = useState([{ id: 'default', name: "メイン教材", totalPages: 300, currentPage: 0, dailyPace: 10 }]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('default');
  const [dailyNote, setDailyNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [studyLogs, setStudyLogs] = useState([]);

  const currentMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];

  useEffect(() => {
    setMounted(true);
    // 保存データの復元（省略せずLocalStorageから読み込み）
    const saved = localStorage.getItem("studyMaterials");
    if (saved) setMaterials(JSON.parse(saved));
    const savedAi = localStorage.getItem("aiAnalysis");
    if (savedAi) setAiAnalysis(JSON.parse(savedAi));
  }, []);

  // --- 本物のAI解析関数 ---
  const handleAiAnalysis = async () => {
    // APIキーの取得（Vercelの環境変数 GEMINI_API_KEY を使用）
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
    if (!apiKey) return alert("APIキーが設定されていません。Vercelの環境変数を確認してください。");

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 日本語での指示（プロンプト）
      const prompt = `
        教材名: ${currentMaterial.name}
        現在の進捗: ${currentMaterial.currentPage}ページ
        
        上記の学習状況、および今後入力される教材内容を想定し、
        明日の復習において最も重要なポイントを3つ、必ず日本語で抽出してください。
        
        回答は以下の形式で、各ポイント100文字以内で簡潔に出力してください：
        1. [解説]
        2. [解説]
        3. [解説]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 改行で区切って配列化
      const explanations = text.split('\n').filter(line => line.trim() !== "").slice(0, 3);

      const newAnalysis = {
        materialName: currentMaterial.name,
        explanations: explanations,
        timestamp: new Date().toLocaleDateString('ja-JP')
      };

      setAiAnalysis(newAnalysis);
      localStorage.setItem("aiAnalysis", JSON.stringify(newAnalysis));
      alert("AI解析が完了しました。");
    } catch (error) {
      console.error(error);
      alert("AI解析中にエラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!mounted) return null;

  // ... (残りのUI部分は、前回の日本語表示・FALL NR.対応版を維持)
  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans">
      {/* 以前の修正通り、日本語化された各タブのUIコードがここに入ります */}
      {/* 分析画面のボタンで handleAiAnalysis を呼び出すように設定 */}
    </div>
  );
}
