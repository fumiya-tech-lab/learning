// app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
  }

  try {
    const { image } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // 【修正】より広範囲な環境に対応する "latest" エイリアスを使用します
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const base64Data = image.split(",")[1];

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
      { text: "今日の学習成果を1.達成内容、2.気づき、3.明日へのアドバイスとして、3行で日本語で要約してください。" },
    ]);

    const response = await result.response;
    return NextResponse.json({ summary: response.text() });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // エラーメッセージから原因を切り分け
    let errorMessage = "AI解析に失敗しました。";
    if (error.message.includes("404")) {
      errorMessage = "モデルが見つかりません。APIの利用可能地域やモデル設定を確認してください。";
    } else if (error.message.includes("403")) {
      errorMessage = "APIキーの権限がありません。";
    }

    return NextResponse.json({ error: `${errorMessage} (${error.message})` }, { status: 500 });
  }
}