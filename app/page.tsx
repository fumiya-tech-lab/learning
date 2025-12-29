"use client";

import { useEffect, useState } from "react";

// 環境変数からパスワードを読み込み（NEXT_PUBLIC_ をつけているのでブラウザ側で読み込めます）
const SECRET_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "SET_PASSWORD_IN_ENV";

interface Material {
  name: string;
  totalAmount: number;
  days: number;
}

interface ReviewTask {
  date: string;
  content: string;
  id: number;
}

interface StudyLog {
  date: string;
  summary: string;
}

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([{ name: "", totalAmount: 0, days: 0 }]);
  const [savedData, setSavedData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"form" | "schedule" | "history">("form");

  // 認証用
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // AI & ログ
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);

  useEffect(() => {
    setMounted(true);
    const authStatus = localStorage.getItem("isAuthorized");
    if (authStatus === "true") setIsAuthorized(true);

    const saved = localStorage.getItem("studyData");
    const savedReviews = localStorage.getItem("reviewTasks");
    const savedLogs = localStorage.getItem("studyLogs");
    
    if (saved) {
      setSavedData(JSON.parse(saved));
      setView("schedule");
    }
    if (savedReviews) setReviewTasks(JSON.parse(savedReviews));
    if (savedLogs) setStudyLogs(JSON.parse(savedLogs));
  }, []);

  if (!mounted) return null;

  // --- 認証ロジック ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECRET_PASSWORD) {
      setIsAuthorized(true);
      localStorage.setItem("isAuthorized", "true");
    } else {
      alert("Ungültiger Code / 無効なコードです");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthorized");
    setIsAuthorized(false);
  };

  // --- ログ保存 & バックアップ ---
  const saveToLogAndBackup = async (newSummary: string) => {
    const newLog: StudyLog = { date: new Date().toLocaleString('ja-JP'), summary: newSummary };
    const updatedLogs = [newLog, ...studyLogs];
    setStudyLogs(updatedLogs);
    localStorage.setItem("studyLogs", JSON.stringify(updatedLogs));

    try {
      await fetch("/api/sheets", {
        method: "POST",
        body: JSON.stringify(newLog),
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) { console.error("Backup Error", e); }
  };

  // --- AI 解析 ---
  const requestSummary = async () => {
    if (!base64Image) return alert("Bild auswählen / 画像を選択してください");
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSummary(data.summary);
      saveToLogAndBackup(data.summary);
      
      const today = new Date();
      const intervals = [1, 3, 7];
      const newTasks = intervals.map(interval => {
        const d = new Date(); d.setDate(today.getDate() + interval);
        return { id: Date.now() + interval, date: d.toLocaleDateString('ja-JP'), content: data.summary };
      });
      setReviewTasks([...reviewTasks, ...newTasks]);
      localStorage.setItem("reviewTasks", JSON.stringify([...reviewTasks, ...newTasks]));
      alert("Protokoll aktualisiert / 記録を更新しました");
    } catch (err: any) { alert(`Fehler: ${err.message}`); } finally { setLoading(false); }
  };

  const handleSavePlan = () => {
    if (materials.some(m => !m.name || !m.totalAmount || !m.days)) return alert("Bitte Felder ausfüllen");
    const data = { materials, startDate: new Date().toISOString() };
    setSavedData(data);
    localStorage.setItem("studyData", JSON.stringify(data));
    setView("schedule");
  };

  const todayStr = new Date().toLocaleDateString('ja-JP');
  const todaysReviews = reviewTasks.filter(task => task.date === todayStr);
  const lastLog = studyLogs.length > 0 ? studyLogs[0] : null;
  const elapsed = savedData ? Math.floor((new Date().getTime() - new Date(savedData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // --- A4プリント最適化設定 ---
  const printStyle = `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { background: white !important; }
      .no-print { display: none !important; }
      .print-container { 
        width: 210mm !important; height: 297mm !important; 
        padding: 20mm !important; box-shadow: none !important; border: none !important;
        margin: 0 !important; display: flex !important; flex-direction: column !important;
      }
      .print-content { zoom: 0.85; }
    }
  `;

  // --- UI 1: Login (Zugriffsprotokoll) ---
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center p-6 font-serif">
        <div className="bg-white p-12 shadow-2xl border border-slate-200 max-w-sm w-full relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800"></div>
          <h1 className="text-xl font-light tracking-[0.2em] uppercase text-center mb-8 italic">Zugriffsprotokoll</h1>
          <form onSubmit={handleLogin} className="space-y-6 text-center">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border-b border-slate-200 p-2 text-center outline-none focus:border-slate-800 transition-colors"
              placeholder="Passwort"
              autoFocus
            />
            <button type="submit" className="w-full bg-slate-800 text-white py-4 text-[9px] tracking-[0.5em] uppercase hover:bg-slate-700 transition-all">Verifizieren</button>
          </form>
        </div>
      </main>
    );
  }

  // --- UI 2: History (Archiv) ---
  if (view === "history") {
    return (
      <main className="min-h-screen bg-stone-50 p-8 text-slate-800 max-w-2xl mx-auto font-serif">
        <header className="mb-12 border-b border-slate-800 pb-4 flex justify-between items-end">
           <button onClick={() => setView("schedule")} className="text-2xl font-light tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">学習カルテ</button>
           <button onClick={handleLogout} className="text-[8px] text-slate-300 uppercase tracking-widest hover:text-slate-800">Abmelden</button>
        </header>
        <div className="space-y-8">
          <h2 className="text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-4 text-center">Historisches Archiv</h2>
          {studyLogs.map((log, i) => (
            <div key={i} className="border-b border-slate-100 pb-6">
              <p className="text-[10px] text-slate-400 font-mono mb-2">DATUM: {log.date}</p>
              <p className="text-sm leading-relaxed text-slate-600 italic">"{log.summary}"</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // --- UI 3: Karte (Hauptansicht) ---
  if (view === "schedule" && savedData) {
    return (
      <main className="min-h-screen bg-stone-100 p-4 md:p-8 flex flex-col items-center text-slate-800 font-serif">
        <style>{printStyle}</style>
        <div className="flex gap-4 mb-6 no-print w-full max-w-[210mm]">
          <button onClick={() => setView("form")} className="flex-1 bg-white border border-slate-200 py-2 rounded text-[9px] tracking-widest uppercase hover:bg-slate-50 transition-all">Einstellungen</button>
          <button onClick={() => setView("history")} className="flex-1 bg-white border border-slate-200 py-2 rounded text-[9px] tracking-widest uppercase hover:bg-slate-50 transition-all">Archiv</button>
          <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white py-2 rounded text-[9px] tracking-widest uppercase shadow-md hover:bg-slate-700 transition-all">PDF Export</button>
        </div>

        <div className="print-container bg-white shadow-2xl p-16 w-full max-w-[210mm] min-h-[297mm] flex flex-col border border-slate-200 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800"></div>
          
          <header className="flex justify-between items-baseline border-b border-slate-800 pb-6 mb-10">
            <button onClick={() => setView("schedule")} className="hover:opacity-60 transition-opacity text-left">
              <h1 className="text-3xl font-light tracking-[0.3em] text-slate-800 uppercase">学習カルテ</h1>
            </button>
            <div className="text-right font-mono text-[9px] text-slate-400 uppercase">
              <p>Datum: {todayStr}</p>
              <p>Fall Nr: {elapsed.toString().padStart(3, '0')}</p>
            </div>
          </header>

          <div className="flex-1 space-y-12 print-content">
            {lastLog && (
              <section className="p-6 bg-slate-50/50 border-l border-slate-300 italic">
                <h2 className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-3">Vorherige Diagnose / 前回の分析</h2>
                <p className="text-xs leading-relaxed text-slate-500">"{lastLog.summary}"</p>
              </section>
            )}

            <section className="space-y-6">
              <h2 className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-2">Heutiges Protokoll / 本日の計画</h2>
              <div className="grid gap-4">
                {savedData.materials.map((m: Material, i: number) => {
                  const isFinished = elapsed > m.days;
                  return (
                    <div key={i} className={`flex justify-between items-end py-1.5 border-b border-slate-50 ${isFinished ? 'opacity-20' : ''}`}>
                      <div>
                        <p className="text-base text-slate-800">{m.name}</p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter italic">Tag {elapsed} / {m.days}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-light text-slate-800">{isFinished ? "ENDE" : Math.ceil(m.totalAmount / m.days)}</span>
                        {!isFinished && <span className="text-[8px] ml-2 text-slate-300 uppercase font-mono">Seiten</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {todaysReviews.length > 0 && (
               <section className="space-y-4">
                 <h2 className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-2">Wiederholungsaufgaben / 復習要請</h2>
                 <div className="space-y-2">
                   {todaysReviews.map(t => (
                     <p key={t.id} className="text-[11px] text-slate-600 leading-relaxed pl-4 border-l border-slate-200 italic">・{t.content.substring(0, 120)}...</p>
                   ))}
                 </div>
               </section>
            )}

            <section className="mt-12 p-8 border border-slate-100 no-print bg-stone-50/50">
              <h2 className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Beobachtung / 記録と解析</h2>
              <div className="space-y-4">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setBase64Image(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="block w-full text-[9px] text-slate-300 cursor-pointer" />
                
                <button onClick={requestSummary} disabled={loading || !base64Image} className="w-full bg-slate-800 text-white py-3.5 text-[9px] tracking-[0.5em] uppercase hover:bg-slate-700 transition-colors disabled:bg-slate-100">
                  {loading ? "Analysiere..." : "Bestätigen & Speichern"}
                </button>
                {summary && <div className="mt-6 text-[11px] italic leading-relaxed text-slate-400 border-t border-slate-50 pt-6">"{summary}"</div>}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  // --- UI 4: Setup (Initialisierung) ---
  return (
    <main className="min-h-screen p-8 md:p-16 bg-stone-50 text-slate-800 max-w-2xl mx-auto font-serif">
      <header className="mb-20 mt-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <button onClick={() => { if(savedData) setView("schedule") }} className="text-3xl font-light tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">学習カルテ</button>
        <button onClick={handleLogout} className="text-[8px] text-slate-300 uppercase tracking-widest hover:text-slate-800">Abmelden</button>
      </header>

      <div className="space-y-16">
        <section className="space-y-8">
          <div className="flex justify-between items-end border-b border-slate-100 pb-2">
            <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Lernmaterialien / 教材</h2>
            <button onClick={() => setMaterials([...materials, { name: "", totalAmount: 0, days: 0 }])} className="text-[9px] text-slate-800 border-b border-slate-800 hover:opacity-50 transition-all">+ Hinzufügen</button>
          </div>
          <div className="space-y-6">
            {materials.map((m, index) => (
              <div key={index} className="space-y-6 bg-white p-8 border border-slate-100 shadow-sm">
                <input type="text" value={m.name} onChange={(e) => {const c=[...materials]; c[index].name=e.target.value; setMaterials(c);}} className="w-full border-b border-slate-100 p-2 text-sm focus:border-slate-800 outline-none transition-all" placeholder="Name des Lernmaterials" />
                <div className="flex gap-8">
                  <div className="flex-1">
                    <label className="text-[8px] text-slate-300 uppercase block mb-1">Zieltage</label>
                    <input type="number" value={m.days || ""} onChange={(e) => {const c=[...materials]; c[index].days=Number(e.target.value); setMaterials(c);}} className="w-full border-b border-slate-100 p-2 text-sm focus:border-slate-800 outline-none font-mono" placeholder="00" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[8px] text-slate-300 uppercase block mb-1">Gesamtseiten</label>
                    <input type="number" value={m.totalAmount || ""} onChange={(e) => {const c=[...materials]; c[index].totalAmount=Number(e.target.value); setMaterials(c);}} className="w-full border-b border-slate-100 p-2 text-sm focus:border-slate-800 outline-none font-mono" placeholder="000" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <button onClick={handleSavePlan} className="w-full bg-slate-800 text-white py-5 text-[9px] tracking-[0.6em] uppercase hover:bg-slate-700 shadow-2xl transition-all">Karte erstellen / カルテ作成</button>
      </div>
    </main>
  );
}