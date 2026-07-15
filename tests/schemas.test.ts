import { describe, expect, it } from "vitest";
import { briefSchema, evidenceLinkSchema, interviewConsentSchema, projectInputSchema, researchPlanSchema, surveySubmissionSchema } from "@/lib/schemas";

describe("critical research workflow contracts",()=>{
  it("validates project creation",()=>expect(projectInputSchema.parse({businessQuestion:"Which market should we enter next?",businessDescription:"A regional service business considering expansion.",industry:"Services",geography:"Singapore",researchMode:"primary_secondary"})).toBeTruthy());
  it("validates a structured plan",()=>expect(researchPlanSchema.parse({decisionStatement:"Choose A or B",objectives:["Understand demand","Compare risks"],hypotheses:["A is stronger"],secondaryWorkstreams:[{title:"Market",evidenceExpected:["Size"]}],evidenceGaps:["Preference"],primaryMethodology:"Survey",targetRespondents:"Customers",sampleSizeRecommendation:"n=150",timeline:"2 weeks",estimatedOperationalCosts:"S$3k",deliverables:["Brief"],limitations:["Sample"]})).toBeTruthy());
  it("requires survey consent",()=>expect(()=>surveySubmissionSchema.parse({token:"northstar-demo",consent:false,answers:{q1:"Monthly"}})).toThrow());
  it("accepts consented survey submission",()=>expect(surveySubmissionSchema.parse({token:"northstar-demo",consent:true,answers:{q1:"Monthly"}})).toBeTruthy());
  it("requires interview consent",()=>expect(interviewConsentSchema.parse({token:"northstar-jamie",consent:true,disclosureVersion:"v1"})).toBeTruthy());
  it("links every claim to typed evidence",()=>expect(evidenceLinkSchema.parse({claimId:"C1",evidenceType:"survey_result",evidenceId:"Q2"})).toBeTruthy());
  it("validates final brief generation",()=>expect(briefSchema.parse({executiveRecommendation:"Choose A",rationale:["Evidence"],risks:["Cost"],changeConditions:["If B costs less"],nextActions:["Validate"],evidenceLinks:[{claimId:"C1",evidenceType:"source",evidenceId:"S01"}]})).toBeTruthy());
});
