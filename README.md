# HAVEN HEALTH CLUB

Static HTML5 / CSS / JavaScript brand website. Source of truth: supplied complete project brief and HAVEN_Brand_Master_Guideline.pdf, read in full.

## Editing

- `dist/*.html`: eight independent pages with shared navigation; index, about, experience, spaces, services, membership, visit, location.
- `dist/styles.css`: brand colors, responsive layout, typography and ambient animation.
- `dist/app.js`: GSAP/ScrollTrigger, mobile navigation, gallery modal and form validation.
- `dist/assets`: locally hosted GSAP 3.12.5 and selected responsive WebP images.

## Image selection

All 46 supplied JPGs were visually reviewed as a contact sheet. Selected 9 images. All selected images are labeled space design illustrations. No massage room or mismatched third-party brand assets used.

| Original | Asset | Use |
| --- | --- | --- |
| S__94601815_0.jpg | hero | Fullscreen entrance |
| S__94601816_0.jpg | sanctuary | Brand story landscape |
| S__94601808_0.jpg | arrival | Reception gallery |
| S__94601820_0.jpg | studio | MOVE and training services |
| S__94601834_0.jpg | restore | RESTORE |
| S__94601842_0.jpg | locker | Changing area gallery |
| S__94601809_0.jpg | lounge | Lounge gallery |
| S__94601810_0.jpg | belong | BELONG |
| S__94601819_0.jpg | training | Training space gallery |

## Pending business information

Presale address, phone, hours, LINE, Instagram and Facebook were confirmed on 2026-10-03. Membership terms, prices and class schedules remain unconfirmed. Google Maps uses an address-search link. No invented business facts. The form validates only in the browser and prominently identifies itself as a preview. It does not store, transmit or claim to submit visitor data. Real lead collection requires a confirmed destination, privacy notice and backend integration. Success-state language is visibly marked as preview.

## Validation

Local reference and anchor integrity; JavaScript syntax; responsive CSS at mobile <=390, <=760, tablet <=1100 and desktop; reduced-motion fallback. Browser visual QA unavailable in this environment for plain static Sites; requested viewport sizes have not been browser-verified. Google Fonts are optional, with serif and sans-serif fallbacks.

## Confirmed service update
The user confirmed 自由訓練、私人教練、團體課程、瑜珈／皮拉提斯、功能訓練. All five now have visible descriptions and inquiry options. Desktop and mobile top navigation use Traditional Chinese. Service pricing, timetables and reservation methods remain pending.

## 2026-10-03 brand and page update
Supplied HAVEN FITNESS logo is used unchanged in header, hero, footer and location. Dark green and warm gold palette. All eight pages were checked at 390px and 1280px with no horizontal overflow or broken images. Mobile navigation and gallery lightbox were verified in the local browser. Booking remains a clearly marked, non-submitting preview.

## Transparent logo and original hero
Removed the supplied logo background using built-in image editing and restored the original oversized HAVEN text hero. Transparent logo remains in header and footer across eight independent pages.

## One-page layout
All ten original sections are restored to index.html with same-page navigation. Former standalone URLs redirect to matching sections. Site display title is HAVEN FITNESS. Large HAVEN hero, transparent logos and presale contact information are retained.

## 2026-10-07 contact update
Removed public LINE links and the club telephone listing. Added a persistent right-side Facebook message link to https://m.me/1411760608676216, positioned above the mobile booking bar. The visitor phone field remains part of the existing preview form.

## 2026-10-07 early bird update
Visit CTAs now say 早鳥預售優惠. Promotion: 前500名入會費０元. Contact accepts either a phone number or LINE ID as text, without the former phone-only pattern. The form remains a clearly marked local preview; inquiries use the existing Facebook message link.

## Presale registration CTA refinement
The preview submit button now reads 預售優惠登記 with 前500名・入會費０元 beneath it. Warm gold styling, responsive large type, hover/focus states, and reduced-motion support emphasize the offer. The associated visible notice states that no data is submitted and no place is reserved.

## Presale button motion
Added a gentle 3-second gold glow and a 6-second periodic sweep behind stable text. Existing hover lift is preserved; reduced-motion preferences disable both animations.

## Floating Facebook removal
Removed the entire floating Facebook contact control and its dedicated styles. Updated preview-form directions to the existing footer Facebook page link.

## Registration button removal
Removed the gold registration submit button and its glow/sweep/hover styles as requested. Presale offer copy and preview fields remain.

## Google Sheets registration
The site now has a same-origin `/api/register` Worker route. Source assets are in `public/`; `node scripts/build.mjs` outputs `dist/client` and `dist/server/index.js`. The static hosting declaration was replaced by Worker hosting under the same project ID. The Worker proxies a fixed Apps Script endpoint, validates origin/input and confirms JSON success and matching request ID. Browser retries reuse the ID for unchanged payloads. No opaque no-cors response is treated as success. Apps Script serializes writes and deduplicates request IDs. The form requires contact consent, preserves input on failure and uses a plain submit button, without restoring removed floating/gold controls.

## Anonymous browsing analytics
Separate owner-only dashboard at `/analytics.html`, guarded on document and API routes using dispatch-provided authenticated email against the `ANALYTICS_OWNER_EMAIL` runtime value. Anonymous/public and non-owner report requests are denied; SIWC handles browser sign-in. The tracker sends only bounded allowlisted events and ephemeral tab session IDs, never input values, full referrer URLs or IP addresses. DNT/GPC and owner browsing are excluded. D1 (`DB`) persists events with ID deduplication, prepared SQL, session event caps and bounded 90-day retention cleanup. `db/schema.ts` and generated Drizzle migrations own schema. Counts represent anonymous tab sessions, not unique people. Active dwell stops when hidden/unfocused or idle for 60 seconds; heartbeats are batched every 10 seconds. Form funnel records client events after real backend results. Native pageviews, section visits/dwell, fixed link categories, scroll milestones, source categories and viewport device categories are supported.
Validation: local SQLite migration/report/deduplication tests; owner/anonymous access checks; JS syntax and static asset checks. This Worker ESM project has no compatible managed browser preview, so layout is source-reviewed, not browser screenshot-verified.

## Analytics v2
Added versioned event ordering (`seq`, `version`) via a new append-only Drizzle migration. Coarse device detection now combines UA hints, mobile/tablet patterns and touch characteristics; no raw device data is stored. Device filters affect all behavior panels except the explicitly unfiltered comparison table. New fixed content IDs cover five service cards and four gallery images. Exposure requires >=50% visible for 2 seconds or a click. Content dwell can overlap and is excluded from site-level dwell sums. Card click is labeled as such, not purchase intent. Post-view conversions require a later success event in the same session; they are associative and nonexclusive. Stable section transitions, last observed section for idle sessions, and field focus/validation failures are added without input values. Completion cohorts require form start before success. Historical v1 events remain and are labeled; no backfill or fabricated data.
Validation: local SQLite fixtures verify migration compatibility, device filtering, denominators, pre/post-exposure conversion ordering, idle last field, deduplication, device classification, auth and privacy allowlists. Managed browser preview remains unavailable for Worker ESM; HTML/CSS are source-reviewed.
