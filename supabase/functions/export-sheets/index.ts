// Supabase Edge Function export-sheets
// Server secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// OAuth refresh token must belong to a Google account authorized for Sheets and Drive.
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const reply = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:cors});
const fields = ["englishTerm","koreanMeaning","specialization","notebookName","englishDefinition","koreanDefinition","exampleSentence"];
const headers = ["영어 용어","한국어 뜻","전공","과목명","영어 정의","한국어 정의","예문"];
function safeCell(value: unknown) {
  const s = String(value ?? "").slice(0, 4000);
  // When a string starts with formula sigils, prevent spreadsheet formula injection.
  return /^[=+@\-\t\r]/.test(s) ? "'" + s : s;
}
Deno.serve(async (req) => {
  if(req.method === "OPTIONS") return new Response(null, {headers:cors});
  if(req.method !== "POST") return reply({error:"POST only"},405);
  try {
    const body = await req.json();
    const records = body.records;
    if(!Array.isArray(records) || records.length < 1 || records.length > 500)
      return reply({error:"한 번에 1~500개를 출력할 수 있습니다."},400);
    if(records.some((r: unknown) => !r || typeof r !== "object" ||
      typeof (r as Record<string, unknown>).englishTerm !== "string"))
      return reply({error:"단어 데이터 형식 오류"},400);
    const id = Deno.env.get("GOOGLE_CLIENT_ID");
    const secret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const refresh = Deno.env.get("GOOGLE_REFRESH_TOKEN");
    if(!id || !secret || !refresh)
      return reply({error:"Google OAuth 서버 설정이 완료되지 않았습니다."},503);
    const tokenRequest = await fetch("https://oauth2.googleapis.com/token", {
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({client_id:id,client_secret:secret,
        refresh_token:refresh,grant_type:"refresh_token"}),
      signal:AbortSignal.timeout(15000),
    });
    if(!tokenRequest.ok) return reply({error:"Google 계정 인증 실패"},502);
    const tokenData = await tokenRequest.json();
    const accessToken = String(tokenData.access_token ?? "");
    if(!accessToken) return reply({error:"Google 액세스 토큰 없음"},502);
    const authHeaders = {"Authorization":"Bearer " + accessToken,"Content-Type":"application/json"};
    const sheetResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method:"POST",headers:authHeaders,
      body:JSON.stringify({properties:{title:"Word Collector - " +
        new Date().toISOString().slice(0,16).replace("T"," ")},
        sheets:[{properties:{title:"단어 분석",gridProperties:{frozenRowCount:1}}}]}),
      signal:AbortSignal.timeout(20000),
    });
    if(!sheetResponse.ok) {
      console.error("Sheets create failed",sheetResponse.status);
      return reply({error:"Google 스프레드시트 생성 실패"},502);
    }
    const spreadsheet = await sheetResponse.json();
    const sheetId = spreadsheet.spreadsheetId;
    if(!sheetId) return reply({error:"Google Sheets 식별자 누락"},502);
    const values = [headers, ...records.map((r: Record<string,unknown>) =>
      fields.map((f) => safeCell(r[f])))];
    const valueUrl = "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(sheetId) + "/values/" +
      encodeURIComponent("'단어 분석'!A1:G" + values.length) +
      "?valueInputOption=RAW";
    const writeResponse = await fetch(valueUrl, {
      method:"PUT",headers:authHeaders,body:JSON.stringify({values}),
      signal:AbortSignal.timeout(20000),
    });
    if(!writeResponse.ok) {
      console.error("Sheets write failed",writeResponse.status);
      return reply({error:"문서는 생성되었으나 데이터 기록에 실패했습니다."},502);
    }
    return reply({spreadsheetUrl:"https://docs.google.com/spreadsheets/d/" +
      encodeURIComponent(sheetId) + "/edit", count:records.length});
  } catch(e) {
    console.error("export-sheets",e instanceof Error ? e.message : "unknown");
    return reply({error:"스프레드시트 출력 오류"},500);
  }
});
