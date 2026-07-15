"use client";
import { useEffect, useState } from "react";
import { Badge } from "./ui";
type Status={configured:boolean;reachable?:boolean;routing?:string};
export function InferenceStatus(){const [status,setStatus]=useState<Status>();useEffect(()=>{fetch("/api/inference-status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({configured:false}))},[]);if(!status)return <Badge tone="gold">Checking AI connection…</Badge>;if(!status.reachable)return <Badge tone="coral">AI offline · demo fallback</Badge>;return <Badge>Qwen 3.6 live · {status.routing}</Badge>}
