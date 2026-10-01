import { createFileRoute } from "@tanstack/react-router";

export const Route=createFileRoute("/api/affiliates/offers")({
  // @ts-expect-error
  server:{handlers:{
    GET:async({request}:any)=>{
      try{
        const {getSessionUser}=await import("@/lib/auth/verify.server");
        const {listActiveAffiliateOffers}=await import("../../../../../HDmaster/src/lib/orderking/affiliate/affiliate-engine.server");
        const user=await getSessionUser();
        if(!user) return Response.json({error:"Unauthorized"},{status:401});
        const category=new URL(request.url).searchParams.get("category")||undefined;
        return Response.json({offers:await listActiveAffiliateOffers(category)});
      }catch(error:any){
        return Response.json({error:error?.message||"Affiliate service unavailable"},{status:503});
      }
    }
  }}
});
