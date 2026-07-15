insert into agents(slug,name,role,biography,specialisation,avatar_path,colour,is_ai) values
('john-lim','John Lim','Research Director','Clarifies the decision and coordinates the engagement.','Decision framing and orchestration','/agents/john-lim.webp','#0E766E',true),
('maya-chen','Maya Chen','Secondary Research Analyst','Investigates markets, customers, competitors and locations.','Published evidence','/agents/maya-chen.webp','#477B9D',true),
('aisha-rahman','Aisha Rahman','Research Methodologist','Designs primary-research methodology and sampling.','Study design','/agents/aisha-rahman.webp','#C39B3B',true),
('daniel-wong','Daniel Wong','Fieldwork Lead','Runs consent-based surveys and interviews.','Fieldwork operations','/agents/daniel-wong.webp','#E9785D',true),
('sofia-tan','Sofia Tan','Insights Analyst','Analyses quantitative and qualitative evidence.','Integrated analysis','/agents/sofia-tan.webp','#76658D',true),
('marcus-lee','Marcus Lee','Strategy Consultant','Turns findings into a business recommendation.','Strategy synthesis','/agents/marcus-lee.webp','#557A5D',true)
on conflict(slug) do update set name=excluded.name;

insert into research_projects(id,owner_id,title,business_question,business_description,industry,geography,research_mode,objective,status,current_phase,demo_mode)
values('10000000-0000-0000-0000-000000000001',null,'Northstar Cinemas expansion','Should Northstar Cinemas open its next outlet in a heartland mall or a city-centre mall?','Demonstration engagement for a cinema-location decision.','Cinema exhibition','Singapore','primary_secondary','Choose a location archetype','fieldwork','survey_and_interviews',true)
on conflict(id) do nothing;

insert into surveys(id,project_id,title,introduction,public_token,status,published_at)
values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Cinema location preferences','Help Northstar understand how people choose a cinema.','northstar-demo','published',now())
on conflict(id) do nothing;

insert into survey_questions(id,survey_id,type,question,options_json,required,position) values
('21000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','single','How often do you visit a cinema?','["Weekly","Monthly","Every 2–3 months","Less often"]',true,1),
('21000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','multiple','What most influences your choice of cinema?','["Travel time","Ticket price","Food and retail nearby","Premium screens","Family convenience"]',true,2),
('21000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','rating','How appealing is a cinema in a regional heartland mall?','["1","2","3","4","5"]',true,3),
('21000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','text','What would make you visit a new cinema more often?',null,false,4)
on conflict(id) do nothing;

insert into interview_participants(id,project_id,name,consent_source,public_token,status)
values('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Demo participant','public consent screen','northstar-jamie','invited')
on conflict(id) do nothing;

-- Run scripts/seed-demo.ts with a real owner UUID to create the full Northstar engagement.
