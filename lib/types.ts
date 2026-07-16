export type Agent = {
  slug: string; name: string; role: string; initials: string; color: string;
  expertise: string; bio: string; status: string; portrait: string;
};

export type Activity = {
  agent: string; action: string; time: string; status: "Complete" | "In progress" | "Awaiting approval"; href: string;
};

export type Source = {
  id: string; title: string; publisher: string; date: string; claim: string; note: string; url?: string;
};

export type SurveyQuestion = {
  id: string; type: "single" | "multiple" | "rating" | "text"; question: string; options?: string[]; required: boolean;
};
