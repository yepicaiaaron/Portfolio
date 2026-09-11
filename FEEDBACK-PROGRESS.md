# Browser feedback implementation — 11 September 2026

Latest source prepared for GitHub on the existing `aaronjones-tech` branch. Live deployment is separate.

## Implemented

- Comment 1: Pruna P-Video-2 moving crystal source, persistent digit field, circular hover/tap reveal. Six seconds, draft 1280×704, silent, $0.0906. Task `ae96c49d-45a5-4f6c-856e-7c8f19a272d6`. Source retained outside dist; deployed derivative is 302,582 bytes. Same particle IDs and original cinema timing retained. This is stylised reflective future imagery, not a product demonstration.
- Comment 2: ten selected intro logos under “Trusted by international brands and government” and a dedicated recognition chapter, separating honours, company awards, nominations, hackathon wins and milestones. Aaron directly confirmed his founder, CEO and project-delivery leadership; the client chapter now reflects that role. All user-supplied named items included, deduplicated; additional speaker-bio and CV items included. Dates taken from source where available. Scale Up of the Year 2021 is user-supplied; awarding body still needs confirmation.
- Comment 3: removed narration control and speech synthesis entirely.
- Comment 4: removed Soul AI Lab credit by replacing its video with Aaron’s own footage, rather than retaining uncredited licensed media. Original licensed asset/credit remains archived but no longer loaded by the site.
- Comments 5 and 16: lazy in-site Google Calendar dialog, keyboard close/focus restoration and direct-link fallback. Original short link resolves to the schedule ID used. Direct schedule verified; embedded calendar remains unverified (see checks below).
- Comment 8: rewritten around commercially available zero-shot talking photos. CV says first-to-market in 2020; absolute global priority not independently established, so no unsupported global-first claim added.
- Comment 10: twelve real logo files from Yepic plus the publicly reported 100,000+ users figure; not a fabricated satisfaction statistic. Project leadership credited to Aaron, as directly confirmed by him.
- Comments 11–14: rewritten live-conversation, AI cinema and hackathon headings; fuller Big Screen Hack explanation and clear organiser role.
- Comment 15: genuine StoryMachine visual-direction and casting assets, labelled as studio creative examples.
- Comment 17: Expert on generative media.
- Comment 18: added authentic AWS Summit London panel photo from the supplied Drive speaker folder alongside Saudi event photography.

## Still needing exact source assets / further work

- Comment 6: replaced the headshot with an authentic Cambodian artisan photograph from the contemporary 2015 Fikay feature, with a source link. The specific photo of Aaron alongside children/workers is still not found. This is not represented as a photo of Aaron.
- Comment 7: actual SeeFashion interface / LinkedIn animation still missing. The supplied Drive candidate was inspected and is an early Yepic editor design, not visual-search imagery. It was not mislabelled or placed in SeeFashion. Text diagram remains until authentic replacement is located.
- Comment 9: RoyalAIness 2022 launch is verified on Product Hunt, but the gallery contains newer Studio imagery, not the requested Queen graphic. The generative-video chapter now shows the authentic Studio interface instead of Aaron's unrelated portrait; it is not labelled as the Queen campaign.
- More distinct speaking-event photos can still be added from the Drive folder.

## Sources and factual cautions

- Speaker biography and CV supplied privately by Aaron. Private source documents, their identifiers and contact details are not included in the public repository.
- The bio contains contradictory 2018/2019 alumni dates and an MBE typo. Use BEM and the official 2018 Essex award: https://www.essex.ac.uk/alumni/awards/alumnus-of-the-year/2018
- BEM and Fikay recognitions: https://www1.essex.ac.uk/news/event.aspx?e_id=10565
- Product Hunt RoyalAIness launch, 2 June 2022, #2 Product of the Day: https://www.producthunt.com/products/yepic-ai-her-royalainess-invites
- Yepic stats and logo relationships: https://www.yepic.ai/ (checked 11 September 2026). Exact source assets in feedback-assets.json.
- StoryMachine creative assets: https://www.storymachine.ai/ ; do not present its illustrative output as a live world-model demo.
- AWS Summit photo: supplied April 2024 speaker folder. Actual photo inspected: stage reads AWS Summit London and lists Aaron as a panellist.
- Fikay archive source: https://www.ilfattoquotidiano.it/2015/04/29/moda-laltra-faccia-della-cambogia-produrre-in-modo-etico-si-puo-la-storia-del-24enne-aaron-jones/1628362/ ; image https://st.ilfattoquotidiano.it/wp-content/uploads/2015/04/cambogia9051-630x845.jpg . The photograph shows an artisan, not Aaron; confirm reproduction rights before publication.
- Studio interface: https://ph-files.imgix.net/24f48e4f-432f-49eb-be52-e010d05704c6.png from the Product Hunt gallery; not the RoyalAIness campaign graphic.
- Independent Cinéum Cannes screening during festival week. Not an official Cannes Film Festival selection claim.

## Checks completed

- All five existing regression scripts plus `verify-feedback.mjs` pass.
- Desktop browser: crystal clip plays; tap reveals colour only inside its sphere; outer glyphs remain; logo chapter loads all twelve assets. Recognition list, origins photo, StoryMachine creative assets and two-event speaking gallery checked in context.
- Original camera footage verified through forward and reverse scroll: audience at turn time 1.88 seconds and cinema screen at 4.77 seconds. No replacement camera animation.
- Mobile layout not yet visually verified: viewport override did not change the browser's reported 813×778 dimensions. Override reset. Static mobile selection and resource-budget tests pass.
- Calendar schedule independently verified as Aaron Jones / 30 min Aaron with available times. The iframe remains blank in the in-app browser despite its canonical embed URL responding without an X-Frame-Options restriction. Do not claim the embed is verified. Direct-link fallback remains available; status message makes the loading failure explicit.
- Ten-logo intro checked: all ten local images load; requested heading is present and old distancing copy is absent. Original cinema timing is unchanged. A GitHub source push is requested; no new live deployment is requested in this pass.
