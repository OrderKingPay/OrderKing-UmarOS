import { createFileRoute } from "@tanstack/react-router";
// Do not claim live flight/boarding data without an authorized aviation feed.
export const Route = createFileRoute("/api/travel/flight-tracker")({server:{handlers:{GET:async ({request}:{request:Request})=>{
  const code=(new URL(request.url).searchParams.get("flightNumber")||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(code.length<3||code.length>9)return new Response(JSON.stringify({error:"Invalid flight number."}),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  return new Response(JSON.stringify({code:"PROVIDER_NOT_CONNECTED",error:"Verified flight status is currently unavailable. Please check your airline."}),{status:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}}}});
