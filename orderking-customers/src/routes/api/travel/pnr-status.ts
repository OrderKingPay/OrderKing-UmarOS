import { createFileRoute } from "@tanstack/react-router";
// Genuine railway status requires an authorized upstream service.
export const Route = createFileRoute("/api/travel/pnr-status")({server:{handlers:{GET:async ({request}:{request:Request})=>{
  const pnr=(new URL(request.url).searchParams.get("pnr")||"").replace(/\D/g,"");
  if(pnr.length!==10)return new Response(JSON.stringify({error:"PNR must contain 10 digits."}),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  return new Response(JSON.stringify({code:"PROVIDER_NOT_CONNECTED",error:"Live Indian Railways PNR verification is temporarily unavailable. Please check the official railway enquiry service."}),{status:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}}}});
