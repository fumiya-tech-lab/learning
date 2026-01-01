"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, Plus, Trash2, Upload, Save, Bell } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Material {
  id: string;
  name: string;
  totalPages: number;
  currentPage: number;
  targetDate: string;
  needsReview: boolean;
}
interface ReviewPlan {
  id: string;
  date: string;    // "2026-01-05" 形式
  content: string; // "p.20-25の復習" など
}


export default function StudyKarteApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'karte' | 'analysis' | 'settings'>('karte');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 状態管理
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: "Material 1", totalPages: 100, currentPage: 0, targetDate: "2025-12-31", needsReview: true }
  ]);
  const [fallCount, setFallCount] = useState(1);
  const [inputNote, setInputNote] = useState("");
  const [storedReportNote, setStoredReportNote] = useState("");
  const [aiExplanations, setAiExplanations] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviewPlans, setReviewPlans] = useState<ReviewPlan[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // 初回読み込み
useEffect(() => {
    const loadFromServer = async () => {
      try {
        const res = await fetch("http://192.168.1.200:8000/load");
        const data = await res.json();
        
        // サーバーにデータがあれば、それぞれの状態にセットする
        if (data.materials) {
          setMaterials(data.materials);
          setFallCount(data.fallCount || 1);
          setReviewPlans(data.reviewPlans || []);
          setStoredReportNote(data.storedReportNote || "");
          setAiExplanations(data.aiExplanations || []);
        }
      } catch (e) {
        console.error("サーバーからの読み込みに失敗しました:", e);
      }
      
      setMounted(true);
      
      // サービスワーカーの登録（既存のもの）
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => {
          console.log("Service Worker Registered");
        });
      }
    };

    loadFromServer(); // サーバーから読み込み開始
    
    // ★ 毎朝8時の通知チェック（ここは既存のまま残します）
    const checkMorningNotification = () => {
      const now = new Date();
      if (now.getHours() === 8 && Notification.permission === "granted") {
        const lastNotify = localStorage.getItem("last_notify_date");
        const todayStr = now.toDateString();
        if (lastNotify !== todayStr) {
          new Notification("Guten Morgen", {
            body: "今日の学習カルテを確認しましょう。",
            badge: "/icons/icon-192x192.png",
            icon: "/icons/icon-192x192.png"
          });
          localStorage.setItem("last_notify_date", todayStr);
        }
      }
    };

    const notificationInterval = setInterval(checkMorningNotification, 1000 * 60 * 15);
    return () => clearInterval(notificationInterval);
  }, []);

// --- 復習予定を更新する関数 ---
  const updateReviewPlan = (id: string, field: keyof ReviewPlan, value: string) => {
    const updated = reviewPlans.map(rp => rp.id === id ? { ...rp, [field]: value } : rp);
    setReviewPlans(updated);
    // 変更したら即保存
    saveAllData(materials, fallCount, updated);
  };

  // --- 全データを保存する関数 ---
  // 98行目付近：ここから
  const saveAllData = async (updatedMaterials?: Material[], nextFallCount?: number, updatedReviews?: ReviewPlan[]) => {
    const dataToSave = {
      materials: updatedMaterials || materials,
      fallCount: nextFallCount || fallCount,
      reviewPlans: updatedReviews || reviewPlans,
      storedReportNote: storedReportNote,
      aiExplanations: aiExplanations
    };

    try {
      // サーバー（FastAPI）の /save エンドポイントへデータを送る
      await fetch("http://192.168.1.200:8000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      console.log("サーバーへの保存が完了しました。");
    } catch (e) {
      console.error("サーバーへの保存に失敗しました:", e);
    }

    // 念のためブラウザ(localStorage)にもバックアップとして保存しておく
    localStorage.setItem("karte_final_backup", JSON.stringify(dataToSave));
  };
  

  // 1日あたりの勉強量を計算するロジック
  const calculateDailyPace = (m: Material) => {
    const remainingPages = m.totalPages - m.currentPage;
    const today = new Date();
    const target = new Date(m.targetDate || "2025-12-31");
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return remainingPages; 
    return Math.ceil(remainingPages / diffDays);
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
      
      // 復習が必要な教材の名前をリストアップ
      const reviewRequiredNames = materials
        .filter(m => m.needsReview)
        .map(m => m.name)
        .join(", ");
      
      const prompt = `
        あなたは優秀な学習コーチです。アップロードされた学習内容の画像と学習者のメモ（${inputNote}）を統合的に分析してください。

        【タスク1：学習要約 (Rückblick)】
        1. 画像から項目・概念を特定してください。
        2. メモから苦戦した点を読み取ってください。
        3. 日本語2〜3行で核心を記述し、冒頭に [SUMMARY] と付けてください。

        【タスク2：復習処方箋 (Analyse)】
        今回の学習範囲に、以下の「復習対象教材」が含まれている場合のみ復習計画を作成してください。
        復習対象教材：[ ${reviewRequiredNames} ]

        ※対象教材が含まれない場合は、[NO_REVIEW] とだけ出力してください。
        ※対象の場合の形式：
        ● [復習予定日: 〇月〇日] / [復習範囲: p.〇-〇] 
        要点: [復習の着眼点]
      `;

      const result = await model.generateContent(
        selectedImage 
          ? [prompt, { inlineData: { data: selectedImage.split(",")[1], mimeType: "image/jpeg" } }] 
          : [prompt]
      );
      
      const fullResponse = (await result.response).text();
      const lines = fullResponse.split('\n');

      // 1. 要約の抽出
      const summaryLine = lines.find(l => l.includes('[SUMMARY]'));
      const summaryText = summaryLine ? summaryLine.replace('[SUMMARY]', '').trim() : inputNote;
      setStoredReportNote(summaryText);

      // 2. 復習処方箋の判定と抽出
      let newReviews: ReviewPlan[] = [...reviewPlans];

      if (fullResponse.includes("[NO_REVIEW]")) {
        setAiExplanations(["本日の学習範囲は復習予約の必要はありません。"]);
      } else {
        const prescriptionLines = lines.filter(l => l.trim().startsWith('●') || l.trim().startsWith('要点'));
        setAiExplanations(prescriptionLines);

        // 復習プランがある場合のみリストへ追加
        prescriptionLines.forEach(line => {
          const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
          if (dateMatch) {
            const month = parseInt(dateMatch[1]);
            const day = parseInt(dateMatch[2]);
            const now = new Date();
            let year = now.getFullYear();
            if (month < now.getMonth() + 1) year += 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            newReviews.push({
              id: Date.now().toString() + Math.random(),
              date: dateStr,
              content: line
            });
          }
        });
      }

      // 保存と状態更新（復習の有無に関わらず実行）
      const nextCount = fallCount + 1;
      setFallCount(nextCount);
      setReviewPlans(newReviews);
      saveAllData(materials, nextCount, newReviews);
      
      setActiveTab('karte');
      setInputNote("");      
      setSelectedImage(null); 
    } catch (e) { 
      console.error(e);
      alert("Analyse-Fehler."); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-serif">
      
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-3 flex justify-center gap-12 print:hidden shadow-sm">
        <button onClick={() => setActiveTab('karte')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'karte' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Karte</button>
        <button onClick={() => setActiveTab('analysis')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'analysis' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Analyse</button>
        <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeTab === 'settings' ? 'text-black border-b border-black' : 'text-slate-300'}`}>Setup</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10 pb-32 print:p-0">
        
        {activeTab === 'karte' && (
          <div className="bg-white border border-slate-200 p-10 md:p-16 print:border-none print:p-0 min-h-[290mm] animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-slate-950 pb-1 mb-10">
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-slate-950 font-mono">
                  Lernprotokoll
                </h1>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold leading-tight">
                FALL-NR. {fallCount.toString().padStart(4, '0')} <br /> 
                {new Date().toLocaleDateString('de-DE')}
              </div>
            </header>

            <div className="space-y-12">
              {reviewPlans.filter(rp => rp.date === new Intl.DateTimeFormat('sv-SE').format(new Date())).length > 0 && (
            <section className="p-6 bg-red-50/50 border-l-4 border-red-950 animate-in fade-in slide-in-from-top duration-700">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-950 mb-3 font-sans flex items-center gap-2">
                <Bell className="w-3 h-3" /> Dringende Wiederholung (今日の復習指示)
              </h3>
              <div className="space-y-2">
                {reviewPlans.filter(rp => rp.date === new Intl.DateTimeFormat('sv-SE').format(new Date())).map(rp => (
                  <p key={rp.id} className="text-[12px] font-bold text-slate-900 leading-relaxed">{rp.content}</p>
                ))}
              </div>
            </section>
          )}

      <section className="space-y-8">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-950 border-b border-slate-100 pb-2 font-sans">Ziel (Heutige Planung)</h3>
        <div className="grid grid-cols-1 gap-8 pl-6 border-l border-slate-200">
          {materials.map((m, idx) => {
            const dailyGoal = calculateDailyPace(m); 
            return (
              <div key={m.id} className="group">
                {/* 教材ラベル：01, 02... */}
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-sans">
                  <span className="w-3.5 h-3.5 flex items-center justify-center border border-slate-300 rounded-full text-[7px] font-mono text-slate-400">0{idx + 1}</span>
                  {m.name}
                </p>
                
                {/* 数値表示：タイプライター風 */}
                <div className="flex items-baseline gap-6 text-slate-700">
                  {/* 現在地点 (Aktuell) */}
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-300 uppercase font-sans font-bold tracking-tight mb-1">Aktueller Stand</span>
                    <div className="flex items-baseline gap-1 border-b border-slate-100 pb-1">
                      <span className="text-[10px] text-slate-300 font-mono italic">p.</span>
                      <span className="text-xl font-mono tracking-tighter w-12 text-center text-slate-500">
                        {m.currentPage + 1}
                      </span>
                    </div>
                  </div>
      
                  {/* 矢印 */}
                  <div className="text-slate-200 self-end pb-2 font-thin text-xl">→</div>
      
                  {/* 目標地点 (Ziel) */}
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-300 uppercase font-sans font-bold tracking-tight mb-1">Tagesziel</span>
                    <div className="flex items-baseline gap-1 border-b border-slate-100 pb-1">
                      <span className="text-[10px] text-slate-400 font-mono italic">p.</span>
                      <span className="text-xl font-mono tracking-tighter w-12 text-center text-slate-900 font-bold">
                        {Math.min(m.totalPages, m.currentPage + dailyGoal)}
                      </span>
                    </div>
                  </div>
                  
                  {/* ペース表示 (Tempo) */}
                  <div className="ml-2 self-end pb-2">
                     <span className="text-[9px] text-slate-300 font-mono italic tracking-tighter">
                       ( Tempo: +{dailyGoal} )
                     </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-1 font-sans">Rückblick von gestern</h3>
                <div className="text-[12px] leading-relaxed italic text-slate-700 whitespace-pre-wrap pl-6 border-l border-slate-50 min-h-[100px]">
                  {storedReportNote || ""}
                </div>
              </section>

              <section className="p-8 bg-slate-50 border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2 text-slate-400 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" /> AI復習ポイント
                </h3>
                <ul className="space-y-6 text-[12px] leading-relaxed text-slate-900 pl-6 border-l border-slate-300">
                  {aiExplanations.map((t, i) => (
                    <li key={i} className={t.startsWith('●') ? "font-bold mt-4" : "italic ml-4 text-slate-600"}>{t}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2 font-sans">Dokumentation ＆ Analyse</h2>
            <section className="bg-white border border-slate-200 p-8 md:p-12 space-y-12 shadow-sm">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 h-64 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-sm overflow-hidden text-slate-300 text-[9px] font-bold uppercase tracking-widest font-sans">
                {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full object-contain p-2" /> : "Screenshot hochladen"}
                <input type="file" ref={fileInputRef} onChange={(e) => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
              </div>
              <div className="space-y-8 font-sans">
                {materials.map(m => (
                  <div key={m.id} className="space-y-4 bg-slate-50/50 p-6 border border-slate-100">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                      <span>{m.name}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" value={m.currentPage} onChange={(e) => updateMaterial(m.id, 'currentPage', Number(e.target.value))} className="w-16 bg-white border border-slate-200 text-center p-1" />
                        <span className="text-slate-300">/ {m.totalPages}</span>
                      </div>
                    </div>
                    <input type="range" min="0" max={m.totalPages} value={m.currentPage} onChange={(e) => updateMaterial(m.id, 'currentPage', Number(e.target.value))} className="w-full h-[1px] bg-slate-200 accent-black appearance-none" />
                  </div>
                ))}
              </div>
              <textarea value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="Notizen..." className="w-full h-48 p-6 text-sm italic bg-[#FDFDFD] border border-slate-50 outline-none resize-none" />
              <button onClick={runAiAnalysis} disabled={isAnalyzing} className="w-full py-5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all font-sans">
                {isAnalyzing ? "Analysiere..." : "Sichern ＆ Analyse"}
              </button>
            </section>
          </div>
        )}

      {activeTab === 'settings' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
            <header className="border-b border-slate-100 pb-2 flex justify-between items-end text-[10px] font-bold text-slate-300 uppercase tracking-widest font-sans">
              <span>Setup</span>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => {
                    Notification.requestPermission().then(permission => {
                      if (permission === "granted") {
                        alert("Benachrichtigung aktiviert.");
                      }
                    });
                  }}
                  className="text-slate-300 hover:text-slate-950 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button onClick={() => { saveAllData(); alert("Gespeichert."); }} className="bg-slate-900 text-white px-4 py-2 hover:bg-black font-sans">
                  <Save className="w-3 h-3 inline mr-2" /> Speichern
                </button>
              </div>
            </header>

            {/* 教材リスト */}
            <div className="grid grid-cols-1 gap-6 font-sans">
              {materials.map((m, idx) => (
                <div key={m.id} className="bg-white border border-slate-200 p-10 flex flex-col gap-8 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <div className="flex-grow">
                      <span className="text-[9px] font-mono text-slate-300 uppercase font-sans">Material 0{idx+1}</span>
                      <input type="text" value={m.name} onChange={(e) => updateMaterial(m.id, 'name', e.target.value)} className="block w-full text-lg font-bold bg-transparent outline-none" />
                    </div>
                    <button onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-slate-200 hover:text-red-500 ml-4"><Trash2 className="w-5 h-5" /></button>
                  </div>
                  {/* レイアウト修正：スマホでは1列(grid-cols-1)、PCでは2列(md:grid-cols-2) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 text-[9px] font-bold text-slate-300 uppercase tracking-widest font-sans">
                    <div>
                      <label className="block mb-1">Seiten gesamt (全ページ数)</label>
                      <input 
                        type="number" 
                        value={m.totalPages} 
                        onChange={(e) => updateMaterial(m.id, 'totalPages', Number(e.target.value))} 
                        className="w-full text-xl md:text-2xl font-black border-b border-slate-100 outline-none text-slate-900 font-sans bg-transparent" 
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Ziel-Datum (目標期限)</label>
                      <input 
                        type="date" 
                        value={m.targetDate} 
                        onChange={(e) => updateMaterial(m.id, 'targetDate', e.target.value)} 
                        className="w-full text-xl md:text-2xl font-black border-b border-slate-100 outline-none bg-transparent text-slate-900 font-sans" 
                      />
                    </div>
                    {/* 復習対象チェックボックス */}
                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={m.needsReview} 
                          onChange={(e) => updateMaterial(m.id, 'needsReview', e.target.checked)}
                          className="w-4 h-4 accent-slate-900"
                        />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-950 transition-colors uppercase tracking-widest">
                          Wiederholung (復習対象としてAI分析する)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setMaterials([...materials, { id: Date.now().toString(), name: "Material", totalPages: 100, currentPage: 0, targetDate: "2025-12-31", needsReview: true }])} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase hover:border-slate-950 font-sans transition-all">+ Hinzufügen</button>
            </div>

            {/* 復習予定管理セクション */}
            <div className="mt-20 space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2 font-sans">
                Wiederholungsplan (復習予定管理)
              </h3>
              
              <div className="space-y-4">
                {reviewPlans.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic font-sans text-center py-10">Keine geplanten Wiederholungen.</p>
                ) : (
                  reviewPlans.sort((a,b) => a.date.localeCompare(b.date)).map((rp) => (
                    <div key={rp.id} className="bg-white border border-slate-100 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
                      <input 
                        type="date" 
                        value={rp.date} 
                        onChange={(e) => updateReviewPlan(rp.id, 'date', e.target.value)}
                        className="text-[11px] font-mono bg-slate-50 border-none outline-none p-1 text-slate-500 focus:bg-white focus:ring-1 ring-slate-200 transition-all"
                      />
                      <input 
                        type="text" 
                        value={rp.content} 
                        onChange={(e) => updateReviewPlan(rp.id, 'content', e.target.value)}
                        className="flex-grow text-[11px] font-mono text-slate-700 border-b border-transparent focus:border-slate-200 outline-none p-1 w-full"
                        placeholder="Wiederholungsinhalt..."
                      />
                      <button 
                        onClick={() => {
                          const updated = reviewPlans.filter(item => item.id !== rp.id);
                          setReviewPlans(updated);
                          saveAllData(materials, fallCount, updated);
                        }} 
                        className="text-slate-200 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 印刷ボタン */}
      <div className="fixed bottom-10 right-10 print:hidden">
        <button onClick={() => window.print()} className="bg-white border border-slate-200 p-5 rounded-full shadow-2xl text-slate-950"><Printer className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
