"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Badge } from "./ui";
import { Download, Facebook, QrCode } from "lucide-react";

type Question = { id: string; question: string; position: number };
type Response = { id: string };
type Answer = { response_id: string; question_id: string; answer_json: unknown };
export function SurveyExportTools({ url, title, questions, responses, answers }: { url: string; title: string; questions: Question[]; responses: Response[]; answers: Answer[] }) {
  const [qr, setQr] = useState("");
  useEffect(() => { if (url) QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#132a2a", light: "#fcfaf5" } }).then(setQr); }, [url]);
  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = responses.map((response) => [response.id, ...questions.map((question) => { const answer = answers.find((item) => item.response_id === response.id && item.question_id === question.id)?.answer_json; return Array.isArray(answer) ? answer.join("; ") : answer ?? ""; })]);
    const csv = [["response_id", ...questions.map((question) => `Q${question.position}: ${question.question}`)], ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = href; anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-responses.csv`; anchor.click(); URL.revokeObjectURL(href);
  }
  return <details className="panel survey-export"><summary><QrCode size={17}/> QR code and data export</summary><div><div><Badge>Share in person</Badge>{qr && <Image src={qr} width={180} height={180} unoptimized alt={`QR code for ${title}`}/>}<a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="button button-secondary"><Facebook size={16}/> Share on Facebook</a></div><div><Badge>{responses.length} live responses</Badge><h3>Own the response data</h3><p>Download genuine submissions as CSV. Synthetic preview responses are never included in this export.</p><button className="button button-secondary" disabled={!responses.length} onClick={exportCsv}><Download size={16}/> Export live CSV</button></div></div></details>;
}
