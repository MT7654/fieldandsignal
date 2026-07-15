"use client";
import { Download } from "lucide-react";
export function PrintButton(){return <button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Print / PDF</button>}
