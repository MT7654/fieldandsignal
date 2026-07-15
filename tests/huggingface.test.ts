import { describe,expect,it } from "vitest";
import { extractJson,hfStatus } from "@/lib/huggingface";
describe("Hugging Face adapter",()=>{
  it("extracts plain JSON",()=>expect(extractJson('{"ready":true}')).toEqual({ready:true}));
  it("extracts fenced JSON",()=>expect(extractJson('```json\n{"ready":true}\n```')).toEqual({ready:true}));
  it("pins Qwen to Featherless",()=>{const status=hfStatus();expect(status.model).toContain("Qwen/Qwen3.6-35B-A3B");expect(status.routing).toBe("featherless-ai")});
});
