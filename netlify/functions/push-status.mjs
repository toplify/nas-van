
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store=getStore({name:"push-notification-status",consistency:"strong"});
  if(req.method==="GET"){
    const latest=await store.get("latest",{type:"json",consistency:"strong"});
    return Response.json({ok:true,latest:latest||null});
  }
  if(req.method!=="POST") return new Response("Method not allowed",{status:405});
  try{
    const {id,status}=await req.json();
    if(!id || !["opened","confirmed"].includes(status)) return Response.json({ok:false},{status:400});
    const latest=await store.get("latest",{type:"json",consistency:"strong"});
    if(!latest || latest.id!==id) return Response.json({ok:false,error:"unknown notification"},{status:404});
    const now=new Date().toISOString();
    if(status==="opened" && !latest.openedAt) latest.openedAt=now;
    if(status==="confirmed"){
      if(!latest.openedAt) latest.openedAt=now;
      if(!latest.confirmedAt) latest.confirmedAt=now;
    }
    await store.setJSON("latest",latest);
    return Response.json({ok:true});
  }catch(e){
    console.error(e);
    return Response.json({ok:false},{status:500});
  }
};
