import { describe,expect,it } from "vitest";
import { extractJson,hfStatus,structuredRetryInstruction } from "@/lib/huggingface";
describe("Hugging Face adapter",()=>{
  it("extracts plain JSON",()=>expect(extractJson('{"ready":true}')).toEqual({ready:true}));
  it("extracts fenced JSON",()=>expect(extractJson('```json\n{"ready":true}\n```')).toEqual({ready:true}));
  it("identifies a response cut off before the outer object closes",()=>expect(()=>extractJson('{"items":[{"ready":true}]')).toThrow("cut off"));
  it("tells Qwen to regenerate a compact object after malformed JSON",()=>{const instruction=structuredRetryInstruction(new SyntaxError("Expected ',' or ']' after array element"));expect(instruction).toContain("may have been truncated");expect(instruction).toContain("Regenerate the complete object");expect(instruction).toContain("2-4 concise items")});
  it("pins Qwen to Featherless",()=>{const status=hfStatus();expect(status.model).toContain("Qwen/Qwen3.6-35B-A3B");expect(status.routing).toBe("featherless-ai")});
});
