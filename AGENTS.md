# AGENTS.md — AIGoalie project context

**2026-09-12 neutral site-wide visual system + locale flag control:** Extended
the FotMob-inspired charcoal visual system from day pages to the remaining
durable page sources: Worker fixture pages, track record, matchup simulator,
about/contact/disclaimer, privacy, and the owner-only Pro Picks Lab. Shared
surface, border, text, and muted tokens now use the same neutral palette while
green remains reserved for predictions, Pro actions, and positive states.
Collapsed mobile language controls now show the active locale flag rather than
an ambiguous globe; desktop selectors retain the flag plus language name. The
changes were made in both generated artifacts and their generators so pipeline
runs preserve them. Python, Jinja, inline JavaScript, and Worker syntax checks
passed. Deployed Pages commit `269b9de53e` and Worker version
`a7ac7a37-912c-476d-8dc8-27eb44bd249f`; live English, German, results, and
fixture responses expose the new palette.

**2026-09-12 neutral day-page visual system:** Reworked `vis_gp.html` from the
green-tinted surface palette to a restrained FotMob-inspired charcoal system,
while retaining green only for prediction, active-state, and Pro accents. Date
navigation, Global/League selection, status filters, sorting, CSV, and search
now live inside one separate browse panel below the unchanged site navbar. The
horizontal ad remains outside that panel. Match, league, World Cup, Pro Picks,
calendar, account, auth, and secure Pro selectors/hooks are unchanged. Mobile
and desktop previews passed at 390px and 1280px with no horizontal overflow;
the rollout uses the static historical renderer and does not call fixture APIs.

**2026-09-12 mobile Pro Picks history + localized About repair:** Replaced the
wide Pro Picks history table on `results.html` with a responsive card list that
keeps date, fixture, score, pick, confidence, odds, and outcome readable without
horizontal scrolling. The authenticated ledger now sits in a 520px desktop /
430px mobile internal scroll area, and every historical row receives both club
logos from its published pick or archived fixture. Reworked the general track-
record headings, explanatory copy, methodology, notes, and CTA into concise,
factual product language. Localized static-page generation now root-anchors
relative shared CSS, JS, and image URLs, preventing nested routes such as
`/de/about/` from losing styling. The About source now uses the current logo and
navbar order, including Simulator, and its lead matches the localization key.
Regenerated all static locales without running fixture APIs, republished the
private Pro Picks history (134/134 rows have both logos), and deployed Pages
commit `c45bcc1c6c`. Live mobile QA found zero horizontal overflow on the track-
record page; live German QA loaded `/v12_static.css`, the current logo, and all
localized navbar items.

**2026-09-08 live-score pipeline OOM recovery:** Investigated stale live scores
and found the production `auto-script.py` process and `aigoalie` tmux session
had disappeared after the Linux OOM killer terminated Python at 10:59 UTC.
`html_generation.py` was duplicating the complete ~50,000-match pickle through
a JSON serialize/de-serialize set before merging current fixtures, retaining
both copies through archive persistence. Replaced that merge with an in-place
walk over the loaded history and an O(1) current-fixture index, then explicitly
released the temporary history/index. Added post-cycle garbage collection plus
`malloc_trim`, launched Python with `MALLOC_ARENA_MAX=2`, and added a persistent
2 GB `/swapfile` safety net on the 4 GB production host. Routine archive
persistence now processes yesterday/today/tomorrow plus genuinely new future
fixtures; immutable historical records are left to the explicit backfill path,
so 50,000 old records no longer delay every live publish. Peak RSS fell from
roughly 2.8 GB before persistence to about 1.9 GB, the corrected cycle completed
and deployed Pages commit `db9eb005e2` at 20:47 UTC, and the public homepage was
verified with the refreshed Incheon United 2–1 Bucheon full-time result. The
durable pipeline is running again in tmux session `aigoalie` with environment
loaded from `/etc/environment` and `.env`.

**2026-09-08 raw-input integrity and API-form safeguards:** Added
`input_quality.py` to score fixture-level raw completeness, freshness, identity
consistency, and valuation plausibility before prediction. Severe combinations
such as a rebranded/promoted club retaining a stale lower-division identity and
implausibly low valuation now set `input_integrity_blocked`; Pro Picks policy
`anchor-value-v4-input-integrity` rejects those candidates while ordinary
incomplete inputs remain visible and scored rather than being broadly removed.
API-Football standings form now replaces only the latest five result-history
entries for pre-match model form; live/finished fixtures deliberately retain
the archived raw history to avoid post-kickoff leakage. Quality fields and
warnings persist through fixture merging, games, archives, private diagnostics,
and CSV export. The owner-only Pro Picks Lab exposes historical quality, raw
input score, completeness, freshness, integrity status, and exact warnings.
Focused tests cover severe valuation/rebrand detection, pre-match API-form
overlay, and post-match leakage prevention. The first production report scored
1,340 fixtures and blocked four fixture rows representing three suspect
mappings, including NEOM's stale `al-suqoor` record; NEOM–Al-Fateh dropped from
66% on stale form to 24% with current API form and is excluded from Pro Picks.

**2026-09-07 same-day Pro Picks miss audit (research only):** Reviewed the two
non-winning selections from the 7 September slate. Al-Hilal Saudi FC lost 0-2
to NEOM despite 63% possession, 20 shots, 13 shots inside the box, and five
shots on target; the opener was a Koulibaly own goal. The selection nevertheless
exposed a real data-quality blind spot: the prediction database represented
NEOM through legacy `al-suqoor` data with value `0.3`, one result, and zero
goals, while the actual promoted side fielded Bułka, Sarr, Zézé, Koné and
Lacazette under Christophe Galtier. Pro Picks `quality` did not detect this
because it measures prior AIGoalie prediction coverage, not raw model-input
completeness. Riga drew 1-1 with Daugavpils after conceding first; its 8-1-1
recent H2H advantage, normal lineup, and opponent form made the pick defensible,
but the core dataset's latest five Riga results were `WWDWW` while the API-led
current form was `LDWWW`. Replacing one stale win with that loss lowers the raw
displayed confidence from 75% to 72%, potentially enough to remove Pro
eligibility. Both selections had positive estimated value at their frozen
prices and shortened materially afterward (Al-Hilal 1.22 to 1.17; Riga 1.27 to
1.20), so the market also strengthened rather than rejected them. Recommended
follow-ups are an explicit raw-input completeness/freshness feature, an identity
or valuation-change alert for promoted/rebranded clubs, and feeding API recent
results into model form. No policy was changed from this two-match sample.

**2026-09-07 sparse-history xG regularization:** Fixed newly promoted or newly
tracked teams with one to four stored matches producing zero or extreme goal
forecasts. `match_analyzer.py` now gives each sparse team an effective five-match
sample by filling its missing observations with the target league's average
goals-conceded rate; teams with five or more matches are mathematically
unchanged. The same narrow change prevents a division-by-zero when a sparse
team has no recorded away venue. Validation across the active 1,611-fixture
window changed only sparse-history fixtures, changed zero established-team
fixtures, and made 40 formerly failing sparse cases computable. Al-Hilal Saudi
FC vs NEOM changed from zero xG to 1.61–0.29 (1.90 total, 39% BTTS) while its
79% winner confidence remained unchanged. The source was staged while the match
was live, activated only after API-Football confirmed full-time, and deployed
in Pages commit `e0f13a4660`; secure Pro payloads contain the corrected values
and the durable `aigoalie` pipeline runs under PID `265006`.

**2026-09-06 Pro Picks European-fixture proximity audit (research only):**
Added `pro_picks_european_proximity_backtest.py` and reproduced the deployed
0.76 reliability / 0.40 quality / prefer-1.20+ with 1.18–1.19 fallback policy
using expanding chronological folds. Among 323 domestic-league published Pro
Picks, the nine selections whose picked club had a UEFA Champions League,
Europa League, Conference League, or UEFA Super Cup fixture three calendar days
later all won, versus 77.4% for 314 controls. Across all 693 domestic candidates
that passed the same policy thresholds before the public top-three cap, the
pre-Europe group won 17/20 (85.0%) versus 79.6% for controls; the date-clustered
95% win-rate-difference interval was -14.9pp to +20.9pp. Picks 1–3 days after
Europe were 28/36 (77.8%) versus 79.9%, also inconclusive. Since the clean July
cutoff, the pre-Europe qualified sample was only five matches (4/5 versus
86.5%). The available data therefore does not support a rotation/look-ahead
penalty, but exposure is too sparse to establish no effect. Historical kickoff
hours and a canonical fixture calendar are incomplete, so proximity is calendar
days and may be under-detected. See `PRO_PICKS_EUROPEAN_PROXIMITY.md` and
`pro_picks_european_proximity_report.json`; no production rule was changed.

**2026-09-06 Pro Picks row geometry alignment:** Replaced the shortlist's
separate three-column layout with the exact two-column structure used by normal
match rows: fixture content plus a unified result/confidence/chevron group.
Desktop and mobile Pro rows now share the standard 62/54/52px centre slots,
team/crest spacing, confidence-pill dimensions, outer padding, and minimum row
height. Home and away tracks remain equal, while evidence labels may wrap below
the fixture. Applied the source change to active generated day pages without an
API pipeline rerun and deployed Pages commit `687201be9d`.

**2026-09-06 full-horizon Pro Picks odds:** Fixed Pro Picks becoming empty on
Pro-only future days because API-Football odds enrichment stopped at +2 days
while daily pages and secure Pro payloads extend through +7. Odds enrichment
now covers the complete +7-day horizon. The existing today-through-+2 prices
still refresh every pipeline cycle; +3-through-+7 responses are cached for six
hours in `odds_api_cache/` so the fix does not multiply the 20-minute pipeline's
API usage. The four-hour lightweight fixture refresh now also runs this cached
odds enrichment, allowing bookmaker markets published later in the week to
become eligible without waiting for a new daily fixture file. Pro Picks remain
subject to the existing reliability, quality, and minimum-odds policy; a
genuinely weak or not-yet-priced future day can still correctly return no picks.
Production verification generated and uploaded secure payloads for every date
through 13 September: +3 through +7 contained 2, 1, 1, 3, and 3 picks. The
same deployment made Pro Pick home/away name tracks explicitly symmetric and
changed the compact free teaser to lead with the visible percentage (for
example, `84.2% verified win rate`) instead of truncating the number at the end.

**2026-09-06 authenticated Pro Picks history + final table alignment:** Removed
shortlist row numbering, aligned result/confidence columns with league rows,
and moved evidence signals to a compact wrapping line below match metadata.
Both Pro Picks and league headers now present `% accuracy` in that order. The
free teaser uses customer-facing verified-win-rate copy rather than internal
clean-era terminology. Reworked `results.html`
with concise professional copy and a dedicated Pro Picks record section. The
aggregate rate remains public; the full filterable selection ledger is loaded
only after Firebase authentication and Pro entitlement verification.
`pro_picks.py` combines the validated 108-pick July-August cohort with every
later graded published shortlist and writes private R2 object
`pro-picks/history.json`. Worker endpoint `/pro-picks-history` verifies the
Firebase bearer token through `/me`, requires `pro`, and returns private,
no-store JSON. Initial ledger: 120 selections, 101 wins, 84.2% accuracy. Worker
version `a3c3a5dc-b2f1-40ec-800e-59004b2539bb`.

**2026-09-06 clean-era Pro Picks record + compact table:** Reconstructed the
deployed seven-fold, prior-data-only Pro Picks policy from 1 July through
31 August 2026, the clean post-rebuild system era. It selected 108 matches:
90 wins (83.3%), 13 draws, and five losses. Added
`pro_picks_clean_era_audit.py` plus JSON/CSV/Markdown exports of all 18
non-winning selections for review. The product baseline now uses 90/108 and
appends genuinely published graded selections only after 31 August; this is a
clean-era out-of-sample baseline, not a claim that all July selections were
publicly archived. The Pro Picks day-page table now mirrors league-table
density: one `Pro Picks` title with a crown, record/link in the top-right,
neutral shared panel styling, tighter rows, inline evidence labels, no count or
footer repetition, and draws use the same minus marker as normal match rows.
League headers no longer repeat their visible match count and keep Pro league
accuracy in the freed top-right position. Added a focused `#pro-picks` summary
to `results.html`; exact pick details remain on authenticated historical day
pages.

**2026-09-05 confidence consistency + BTTS calibration:** Fixed AEK Athens vs
Aris Thessalonikis showing 65% on day pages but 28% on its fixture page. The
prediction/archive value was 65%; the Worker read a stale R2 record because a
previous tmux pipeline restart had omitted `/etc/environment` and therefore all
`R2_*` credentials. Synced the fixture, restarted `aigoalie` through a login
shell that exports `/etc/environment`, and cache-busted/deployed Worker version
`f1dd00da-20fe-442a-a87d-036cb603e781`; live day and fixture values now both
show 65%. Replaced the raw independent-Poisson BTTS percentage with a
prior-history-only regularized logistic calibrator in `btts_calibration.py`.
Across 23,458 walk-forward graded predictions, Brier score improved from 0.2867
to 0.2468 and log loss from 0.8053 to 0.6867. The regenerated secure 5 September
payload has 341 BTTS values, maximum 66%, and zero values at 90%+; AEK is 53%.
Protected BTTS remains absent from public HTML and is delivered through the
existing authorized Pro JSON. Also made archive equality ignore only volatile
double-chance odds fetch timestamps, eliminating repeat R2 writes when prices
are unchanged: the completed run skipped 49,780 unchanged records and wrote 74
real updates. Durable pipeline restarts must source `/etc/environment` before
launching `auto-script.py`.

**2026-09-04 double-chance odds collection + rough estimate:** Extended the
existing API-Football `/odds?date=...` parser to extract Home-or-Draw (1X) and
Away-or-Draw (X2) from the same bookmaker payload, adding no API requests. The
fixture/game/archive path now retains median odds, best odds and bookmaker,
bookmaker count, fetch time, and provider update time; later refreshes preserve
previously collected prices when a market is temporarily omitted. Archive
records include the nested `double_chance_odds` object only when data exists,
avoiding a full historical schema rewrite. Added and ran a synthetic-label
parser check plus `double_chance_estimate.py` against `games_current.pkl`.
Current-policy Pro Picks won outright 77.7% and avoided defeat 91.2% across 399
legs. Synthetic prices suggest blanket double chance raises two-leg hit rate to
85.5% but likely sacrifices value; selectively converting only legs with
selected-side win odds 1.40+ retained a 74.0% slip hit rate and had the strongest
rough economics. These ROI estimates are not evidence because historical 1X/X2
quotes were unavailable. See `DOUBLE_CHANCE_ESTIMATE.md` and
`double_chance_estimate_report.json`; exact prospective collection supersedes
the estimate going forward.

**2026-09-04 current-policy accumulator + failure audit (research only):** Added
`pro_picks_accumulator_backtest.py` and ran it on `games_current.pkl` through
31 August using seven expanding chronological folds. It recreates the deployed
0.76 reliability / 0.40 quality / prefer-1.20+ with 1.18–1.19 fallback policy,
rather than the separate favourite top-30% experiment. The 399 selected singles
won 77.7% at 1.38 average odds and +6.9% retrospective ROI. One daily accumulator
from shortlist ranks one and two produced 131 slips, 64.9% wins, 1.88 average
odds, +21.2% ROI (date-bootstrap 95% interval +5.6% to +36.6%), 7.3u maximum
drawdown, and a seven-slip losing streak. Every two-leg combination produced
323 overlapping slips at 60.4% / +15.1%. Three-leg slips won 46.9% at 2.66 and
+23.9%, but the ROI interval crossed zero (-3.4% to +51.8%); a mixed all-
available 2–3-leg card also crossed zero. Of 89 failed legs, 54 (60.7%) were
draws. Rank hit rates declined 81.4% -> 77.1% -> 71.9%, and April–July hit 71.5%
versus 80.4% elsewhere. Friendlies were 2/4 only; transition and coach-risk data
were too sparse for inference. Post-hoc xG-gap and probability guardrails looked
interesting but are explicitly not production recommendations. Results and the
20 highest-confidence misses are in
`pro_picks_accumulator_backtest_report.json` and
`PRO_PICKS_ACCUMULATOR_BACKTEST.md`. Historical odds still lack immutable quote
timestamps, named-bookmaker execution, closing lines, and CLV; no production or
selection change was made.

**2026-09-04 non-loss fallback threshold research:** Added
`nonloss_threshold_backtest.py` and ran an expanding-monthly, prior-data-only
test on `games_current.pkl` from September 2025 through August 2026. The same
logistic reliability model still predicts outright winner correctness; the
alternative settlement counts `correct == 1.0` or `0.5` as success (picked team
wins or draws). Existing quality >=0.40 and selected-team odds >=1.18 filters
remain applied. The current learned-probability >=76% outright-win reference
won 79.84% (919/1,151). Across all non-loss candidates, a 41% floor produced an
almost identical 79.84% rate but an impractical 40.5 matches/day. Restricting
the fallback strictly below the existing 76% winner floor, 45–76% matched the
outright reliability at 79.92% (6,993/8,750), still 30.8/day. More selective
fallback bands were substantially safer: 60–76% 85.69% (n=2,880), 65–76%
86.92% (n=1,759), and 70–76% 87.95% (n=888; about four/day). Monthly checks
showed the 45% equivalence weakening to roughly 75–79% in several later months,
while 65–70% was generally stronger but still variable. Recommendation: if
productized, treat 70–76% as a separately labeled `win or draw` research tier,
track its record separately, and do not claim betting value until double-chance
odds are collected; no production selection/UI change was made. Report saved as
`nonloss_threshold_backtest_report.json`.

**2026-09-04 Pro Picks Lab near-miss audit + Ligue 1 country fix:** Expanded
the private owner diagnostics from threshold-qualified candidates to every
match evaluated by the Pro Picks reliability model. Each row now records
whether it is eligible, its rank among all evaluated and eligible candidates,
and explicit exclusion/selection reasons: learned probability below 76%, data
quality below 0.40, unavailable odds, odds below 1.18, or eligible but outside
the frozen public top three. The dashboard adds All evaluated, All eligible,
Rejected / near misses, preferred, and fallback filters; its expanded panel now
shows displayed confidence, bookmaker implied probability, model-market gap,
quality's sample-coverage definition, and clearer standardized/logit labels.
Today's private artifact contains 147 evaluated, four eligible, and three
selected matches. Real Betis–Real Madrid is visible at overall rank five and is
excluded only because learned probability is 74.58%, below the 76% floor; its
quality 0.909 and odds 1.40 pass. Also corrected Monaco-driven country inference
so domestic `Ligue 1` normalizes to `France - Ligue 1` with the French flag,
not `International - Ligue 1` with a globe. Rerendered today's static page
without API calls and deployed Pages commit `bf5a48616f`; the private Worker
endpoint was owner-token verified. Pipeline reloaded under PID `167896`.

**2026-09-04 owner-only Pro Picks Lab:** Added a private diagnostics workflow
for the site owner Firebase UID `mhZPI6YXIze44O4S060jNL06s222`. Pro Picks
generation now retains every eligible daily candidate and serializes its exact
ranking composition: learned win probability, selected/implied odds, estimated
and clipped value, price adjustment, final hybrid score, sample-qualified
global/confidence/league/team rates, raw model features, standardized logistic
coefficients, and per-feature logit contributions. Public/frozen top-three
payloads remain unchanged and never contain the diagnostics. Each pipeline run
writes the private artifact to R2 under `admin/pro-picks/DD.MM.YYYY.json`.
Worker route `/admin/pro-picks?date=DD.MM.YYYY` verifies the Firebase bearer
token through the existing `/me` service, then enforces the exact owner UID and
returns private/no-store responses; anonymous and non-owner requests receive
401/403. Added noindex dashboard `/pro-picks-lab.html` with date/filter/search,
CSV export, full candidate ranking, and expandable score arithmetic. Worker
version `eade8af2-f2b8-4569-9208-f7125154f795`; initial Pages dashboard commit
`21c16883d4`, with final same-origin Worker integration in Pages commit
`6cb3f36f2a`. Existing generated diagnostics for 1–11 September were backfilled
to private R2 and object existence verified. A temporary duplicate GCS admin
upload was removed from the generator and all 11 GCS objects were deleted; R2
is the sole diagnostics store. A real owner-token request returned four
candidates with private/no-store headers. The production pipeline was reloaded
with final sources under PID `166278`. An optional Cloud
Run implementation is staged in `pro_service/app.py` but was not deployed
because its service account lacks Cloud Build permission; the live Worker route
does not depend on that deployment.
Follow-up hardened the signed-out view after author CSS overrode the native
`hidden` attribute: a global `[hidden]{display:none!important}` rule now keeps
the hero, filters, summaries, formula, and table outside layout until the
owner-authorized Worker request itself succeeds. The public view contains only
the AIGoalie brand and a generic private-area sign-in gate; wrong accounts never
reveal the app shell. Deployed in Pages commit `793bb485fc` (then incorporated
into the pipeline's immediate follow-up deployment `3d0a606593`).

**2026-09-04 historical day-page UI backfill:** Fixed the calendar exposing
legacy published pages with the pre-rollout interface. Added
`published_day_dates()` to `html_generation.py`; future pages now populate the
calendar from the actual Pages retention set plus the current generated window,
instead of all 394 local archive HTML files. Added
`rerender_historical_day_pages.py`, a static-only renderer that loads stored
`games.pkl`, the latest local team database, and `model_context.json` without
calling API-Football or rerunning prediction ingestion. It normalizes legacy RGB
strings and renders the current `vis_gp.html` for every published English date.
Backfilled all 79 retained pages (25 June through 11 September 2026), aligned the
homepage calendar to the same 79-date set, and removed all remaining legacy UI
and `What's new?` markup. Representative 31 August local QA and live 15 July QA
confirmed current calendar/controls, the 56px locked Pro teaser, preserved match
rows, and zero 390px overflow. Pages commits: `bcbe04eeca` for the full backfill
and `cc3eb8025f` for final homepage calendar alignment. The normal pipeline
continued running and preserved all 79 converted pages.

**2026-09-04 compact day-page browsing rollout:** Reworked `vis_gp.html` to
reduce the signed-out mobile first-screen footprint while preserving auth, Pro
hydration, search, filtering, CSV export, localization, day navigation, and all
existing Pro hooks. Removed the dormant `What's new?` panel and Featured League
duplication; Global remains the universal default while a visitor's explicit
Global/League choice persists locally. Moved the horizontal ad directly below
the navbar, replaced the lower square with a second horizontal placement after
five visible Global rows or the first visible League section, added a generated-
date-only calendar opened from the day label, and retained the existing free
future-date limit while Pro can select every generated future date. Replaced the
view dropdown with compact Global/League tabs, made mobile match status a compact
selector, exposed sorting behind a `⇅` button, and separated CSV into a visibly
Pro-labeled control. The signed-out Pro Picks teaser is now a single 56px unlock
row with no skeleton or empty body. Added calendar/view copy to all six locale
files. Local Jinja, JSON, Python, inline-JavaScript, 390px mobile, 1280px desktop,
view-persistence, calendar-access, and fifth-row ad-placement checks passed.
Synced durable sources, restarted tmux pipeline `aigoalie`, and deployed Pages
commit `25472bdd54`; origin HTML contains the new markers, while Cloudflare was
still serving the prior cached homepage at the immediate post-deploy check.
Follow-up restored the full `All | Live | Upcoming | FT` segmented status
control on mobile; the native status dropdown is hidden again. After visual
feedback, compressed Global/League, the four status tabs, sorting, and CSV into
one 370px-wide row (94px / 189px / 75px at a 390px viewport). The mobile top ad
now uses a centered 320px canvas rather than a full-width creative frame. A
generated-page hotfix avoided another fixture/API refresh, passed zero-overflow
QA, and deployed final Pages commit `fc62f25d1c`.

**2026-08-31 tiered Pro Picks odds policy deployed:** Production Pro Picks now
prioritize otherwise-qualified selections priced at 1.20 or higher and use
qualified 1.18–1.19 selections only when fewer than three preferred picks are
available. Candidates below 1.18 or without stored odds are not used as fallback
picks. The existing anchor/value qualification rules and daily maximum of three
remain unchanged. This is policy `anchor-value-v3-odds-tier`; the public
historical baseline was reset to the matching prior-data-only backtest result of
312 wins from 401 selections (77.8%) through 31 August 2026 so later live results
can accumulate cleanly on top. Existing frozen historical slates remain
immutable. Uploaded and compiled `pro_picks.py`, recreated the missing
`aigoalie` tmux pipeline under PID `101313`, and completed a full generation and
deployment cycle. Secure payloads for 1–7 September carry the v3 metadata; the
2 September slate produced three picks at odds 1.27, 1.27, and 1.25, while weak
dates correctly produced no shortlist.

**2026-08-31 Pro Picks 1.18/1.19 sensitivity (research only):** Added
`pro_picks_odds_preference_sensitivity.py` using the same seven chronological
folds and model gates. Full-coverage preference variants produced: prefer
1.18+ first, 509 picks, 79.6% wins, +6.7% ROI, 67/440 priced picks below 1.20;
prefer 1.19+, 79.0%, +6.2%, 57/439; prefer 1.20+, 79.0%, +6.6%, 54/438. The
current policy had 81.7%, +7.9%, and 98/436 sub-1.20 picks. Also tested the
cleaner tiered interpretation: prioritize 1.20+, permit fallback only at
1.18–1.19, and leave remaining slots empty. A 1.18 fallback floor produced 401
picks on 173/246 days, 77.8% wins, +7.1% ROI, and only 17 sub-1.20 picks (4.2%);
a 1.19 floor produced 391 picks on 171 days, 77.5%, +7.1%, and seven sub-1.20
picks (1.8%). Both had broad bootstrap ROI intervals around +1% to +13% and no
proven paired improvement over current. This makes 1.18 a sensible narrow
fallback if product cleanliness matters more than full coverage; 1.19 as a
full-coverage preference nearly halves ultra-short picks but does not improve
performance. Added `pro_picks_odds_preference_sensitivity_report.json` and
`PRO_PICKS_ODDS_PREFERENCE_SENSITIVITY.md`; no production change.

**2026-08-31 Pro Picks strict 1.20+ floor backtest (research only):** Added
`pro_picks_odds_floor_backtest.py` to isolate the requested product change. It
keeps the production-style 0.76 reliability gate, 0.40 quality gate, one anchor
plus value-preferred/fallback ranking, maximum three picks, and seven expanding
chronological folds. Current-style policy: 509 picks on
203/246 evaluation days, 81.7% wins, 1.33 average priced odds, +7.9% ROI; 98 of
436 priced picks were below 1.20. A preferential policy that fills all slots
from 1.20+ candidates first, then uses lower-priced qualified fallbacks only
when necessary, retained the same 509 picks and 82.5% day coverage, reduced
sub-1.20 priced picks from 98 to 54, and returned 79.0% wins / +6.6% ROI at
1.35 average odds. Its date-bootstrap intervals were 75.5–82.4% hit rate and
+1.2–11.8% ROI; paired ROI difference versus current was -3.7pp to +0.9pp,
with only 12.6% probability of improvement. Strict floor: 384 picks on 170/246 days,
77.3% wins, 1.39 average odds, +7.2% ROI, and zero sub-1.20 picks. Strict-floor
date-bootstrap intervals were 73.0–81.5% win rate and +1.0–13.2% ROI. Paired
strict-minus-current ROI CI was -3.7pp to +2.1pp, with only 31.1% bootstrap
probability strict ROI exceeded current. Thus 1.20+ is defensible as a product-
credibility filter, not as a proven performance improvement. The preferential
version is the coverage-preserving compromise but still lowers hit rate by
2.7pp and leaves 12.3% of priced picks below 1.20; strict removes obvious
ultra-short favourites while reducing hit rate by 4.4pp, active-day coverage
from 82.5% to 69.1%, and average picks per active day from 2.51 to 2.26. Q2 2026
remained negative under all policies. Added
`pro_picks_odds_floor_backtest_report.json` and
`PRO_PICKS_ODDS_FLOOR_BACKTEST.md`; no production change.

**2026-08-31 accumulator backtest (research only):** Added
`favourite_accumulator_backtest.py` to construct one daily 2-, 3-, 4-, or
5-leg accumulator from the highest-confidence members of the frozen top-30%
short-priced shortlist, with one flat unit per slip and no compounding. The
historical point estimates were extremely positive (2 legs: 213 slips, 71.4%
wins, +26.5% ROI; 3 legs: 145, 66.2%, +55.1%; 4 legs: 91, 53.8%, +69.2%;
5 legs: 72, 40.3%, +73.0%), but confidence ordering inside the shortlist did
not beat matched random leg choice: random mean ROIs were respectively 26.5%,
57.0%, 74.4%, and 83.7%, with random-at-least-observed probabilities 49.5%,
62.9%, 67.8%, and 75.4%. Thus the accumulator headline mechanically amplifies
the already suspicious historical base return and is not evidence that the
highest-ranked shortlist members form superior accumulators. Q2 2026 was
negative for every leg count. June's weak single-pick month was not primarily
ordinary end-of-season dead rubbers: 10/26 selections were World Cup matches,
five of those lost, and all ten June losses were draws. Historical median odds,
missing timestamps/CLV, leg dependence, and small slip counts make this
exploratory only. Added `favourite_accumulator_backtest_report.json` and
`FAVOURITE_ACCUMULATOR_BACKTEST.md`; no production change.

**2026-08-31 frozen top-30% protocol backtest (research only):** Added
`prospective_protocol_backtest.py` and tested the now-frozen rule against
`games_current.pkl`: within each stored historical match date, retain
AIGoalie-selected sides at stored odds 1.20–1.50, rank only by originally
published confidence, and select `max(1, ceil(n × 30%))`. The cohort contained
1,000 selections across 295 days, won 84.9%, averaged 1.34 odds, and returned
13.8% (+137.7 units) with a 4.9-unit maximum daily drawdown and four-match
longest losing streak. Date-cluster bootstrap intervals were 82.7–87.1% for win
rate and 10.7–16.7% for ROI. Same-count lowest-odds ranking returned 8.0%; the
paired ROI uplift was +5.8pp (95% date-bootstrap CI +2.8pp to +8.8pp). Matched
random selection averaged 9.7% ROI and reached the observed result in 0.1% of
5,000 runs. Performance was positive in every month except June 2026 (-16.2%,
n=26); 2026 Q2 weakened to +3.1%. This is only the closest available historical
approximation: historical match dates do not prove UTC handling, and complete
bookmaker-level 1X2 snapshots, immutable quote timestamps, executable named-
bookmaker prices, closing odds, and CLV are unavailable. Added
`prospective_protocol_backtest_report.json` and
`PROSPECTIVE_PROTOCOL_BACKTEST.md`; no production or betting change.

**2026-08-31 short-priced favourite ranking backtest (research only):** Added
`favourite_selection_backtest.py` and ran it against a fresh, separately copied
production snapshot (`games_current.pkl`; production source remained untouched).
The pre-specified sample uses graded predictions from 2 September 2025 through
30 August 2026 where the AIGoalie-selected winner had stored decimal odds
1.20–1.50. Ranking uses only the confidence stored with the original match
prediction, independently within each historical date; no rolling performance
feature, fitted threshold, result, or future match enters the ranking. Across
2,873 initially qualifying rows, model-aligned short-priced selections won 80.6%
and returned 9.7% at flat stakes. Follow-up audit found this is not a true naive
"every bookmaker favourite" baseline: archive inclusion already requires
AIGoalie to have selected the short-priced side, and only that selected price
was retained. Full home/draw/away market snapshots are unavailable historically.
Top 50% daily won 84.2% with 13.5% ROI (n=1,517); top 25% won 85.0% with
13.6% ROI (n=840); top 10% did not improve further (84.9%, 12.7%, n=443).
Top 25% beat a same-size random baseline (9.9% mean ROI) and a lowest-odds /
bookmaker-implied ranking (8.5% ROI). The uplift persisted across all five
calendar quarters but weakened materially in 2026 Q2. Results are not perfectly
monotonic: the daily 20–40% rank band slightly outperformed the top quintile,
and top one per day was only 10.4% ROI. The unexpectedly profitable bet-every-
favourite baseline means absolute ROI should not be marketed or treated as
tradable until a prospective timestamped closing-odds paper test confirms it.
Generated `favourite_selection_backtest_report.json` and
`FAVOURITE_SELECTION_BACKTEST.md`; no production model/UI/deployment change.
The audit also found one incorrectly graded row with result `-:-'`; final
analysis excludes any row without a parseable final score. Odds originate from
API-Football's pre-match Match Winner endpoint, use the median across returned
bookmakers, and are preserved after initial daily fixture creation, but exact
fetch timestamps/bookmaker identities/full 1X2 prices were not archived. A
10,000-sample paired date bootstrap put top-25 incremental ROI over lowest-odds
ranking at +5.1pp (95% CI +1.7pp to +8.5pp); matched-random p=0.0084. Expanding
chronological odds-control improved aggregate AUC by 0.0215 but was unstable
across later folds. Added `favourite_selection_audit.py`,
`FAVOURITE_SELECTION_AUDIT.md`, its JSON report, and a lift-curve PNG.
Added `PROSPECTIVE_FAVOURITE_TEST.md` with a frozen append-only validation
protocol: next-day 18:00 UTC selection snapshots, complete bookmaker-level 1X2
markets, immutable hashes/model versions, separate closing-line diagnostics,
90-minute settlement, a six-month/300-primary-selection first read, and a
stronger 500-primary-selection decision threshold.
Owner subsequently froze the primary cohort at the top 30% of daily model-
aligned 1.20–1.50 selections, reflecting the broad 25–40% lift plateau rather
than the best historical point estimate. The protocol now records best and
median prices separately and defines decimal/implied-probability CLV, positive-
CLV frequency, a six-month/300-pick first read, and a stronger 500-pick decision
threshold. Secondary cutoffs remain diagnostics and cannot replace top 30%
during the prospective test.

**2026-08-24 day-page feature discovery panel:** Added a
compact expandable `What's new?` panel below day navigation. It introduces the
new confidence/goals/BTTS/time ranking controls and Today's Pro Picks without
interrupting match browsing. A versioned localStorage marker removes the `New`
badge after the panel is opened while keeping the panel available. Copy is
localized for en/ja/es/de/fr/pt; Jinja, JSON, and Python validation passed.
Uploaded the durable template/translations, restarted the production pipeline,
and deployed Pages commit `5d52dbcf09`. The Japanese live route reflected the
panel immediately; English static pages were correct at the origin and awaiting
the normal ten-minute Cloudflare edge-cache expiry at the final check.
Follow-up labeled Today's Pro Picks with a visible `PRO` chip and replaced the
vague "options menu" wording with the actual `⋯` control; BTTS ranking is also
identified as Pro-only. Bumped the discovery version to `20260824-2`, patched
132 generated day pages without another fixture/API refresh, and deployed Pages
commit `6a3a75b04a`.

**2026-08-23 selectable day-page ranking metric:** Added a persisted ranking
selector inside the existing overflow menu. Visitors can rank both Global and
By League rows by win confidence, predicted total goals, or kick-off time; Pro
members can additionally rank by BTTS chance. The selected prediction metric
also replaces the right-hand confidence pill with a compact, explicitly labeled
goals or BTTS value and updates the Global ranking description. Picked-team
green styling remains unchanged. Public HTML stores only confidence and the
already-public total-goals estimate; BTTS row values are added only after
Firebase entitlement verification and secure Pro payload hydration, so the new
control does not expose protected data. Signed-out BTTS selection uses the
shared Pro checkout/auth flow. Added six-locale copy and a
`ranking_metric_change` Umami event. The durable template and translations were
synced to production and deployed in Pages commit `a82fafc38f`. Generated
English/Japanese pages passed inline-script parsing and contained zero public
BTTS row values. Live mobile checks confirmed persisted goals ranking, Global
and per-league descending order, dynamic ranking copy, and no console errors.

**2026-08-23 missing-fixture prevention layer:** Generalized the Rennes/PSG
repair so stale API-to-dataset bridges no longer silently remove recognizable
senior fixtures. When either team id is unbridged, the API fixture builder now
tries a conservative normalized-name resolver constrained by team category,
country, league similarity, uniqueness, and existing prediction history. Youth,
women's, and reserve sides are never mapped onto senior teams. High-confidence
domestic resolutions are saved in `api_team_bridge_auto.json`, allowing a team
learned from its domestic competition to resolve later European/cup fixtures.
Every refresh also writes `api_fixture_bridge_gaps.json`; unresolved senior
major-competition fixtures trigger one deduplicated warning email while the
public pipeline continues. Two eight-day production validation passes built
1,329 eligible fixtures, retained Rennes–PSG, persisted 214 category-safe bridge
repairs, and reduced major unresolved gaps to three explicit 27 August European
fixtures rather than hiding them. The pipeline was restarted with the safeguard
under PID `4145026`.

**2026-08-23 Rennes–PSG fixture ingestion fix:** Investigated Paris Saint-Germain
missing from the 23 August day page even though API-Football fixture `1552735`
correctly listed Rennes vs Paris Saint Germain at 19:45 BST. The API-first
fixture builder requires both API team ids to resolve to Transfermarkt dataset
teams; PSG was bridged, but Rennes API id `94` was not, so every current Rennes
fixture was silently skipped. Added the verified durable override from
Transfermarkt team `273` (`fc-stade-rennes`) to API team `94` (`Rennes`) in
`universal_scraping.py`, forced the lightweight eight-day fixture-window
refresh, and restarted the pipeline. The refreshed fixture source and
`games.pkl` now contain Rennes–PSG, generated English/localized pages include
it, and the live CDN was verified. Pages commit `7e0430a376`; the pipeline
continues under PID `4141481`.

**2026-08-23 contextual-accuracy hierarchy cleanup:** Superseded the same-day
scope-alignment change below after recognizing that showing the identical
league `50%+` rate in both the header and every expanded row was redundant.
League headers retain the competition's historical hit rate for predictions at
50% confidence or higher; expanded day rows now show the already computed
picked-team accuracy. Added `league_confidence` to `model_context.json`, keyed
by competition and the existing confidence buckets, so fixture pages show
league accuracy for that match's confidence range alongside global
similar-confidence and picked-team accuracy. The intersection requires at least
10 graded predictions and is omitted when sparse rather than falling back to
the header statistic. Updated all six Worker locales and cache-busted the model
context fetch and fixture HTML cache key. Final Worker version
`64b74fb7-4c47-4b76-8335-e0890228a0df`; Pages commit `6bee33e23c`.
Live verification confirmed picked-team accuracy on the homepage and
league-at-confidence accuracy on Manchester City vs Bournemouth. The pipeline
continues under PID `4138836`.

**2026-08-23 league-accuracy scope alignment:** Fixed an inconsistent day-page
metric where league headers displayed the league's hit rate for predictions at
50%+ model confidence, while server-rendered expanded match rows displayed the
all-picks league rate. `_attach_model_context()` now mirrors the existing client
path: matches at 50%+ use `leagues_conf50` when sample-qualified, otherwise they
fall back to the all-picks league statistic. Expanded rows append `· 50%+` to
the sample count whenever that subset is used. Production validation confirmed
the Premier League header and expanded high-confidence rows both show 70%; the
live homepage contains the scope marker. Pages commit `8df4202655`. The prior
pipeline recovery also held on this run: archive persistence completed in 53s.

**2026-08-22 result-update pipeline recovery:** Diagnosed a full-day score
freeze even though API-Football still had 5,050 daily requests available and
returned current FT results. The fixture refresh had succeeded, but the run was
blocked for more than 5h40 in `persist_games`: newly added archive diagnostic
fields made tens of thousands of historical records look changed, and each was
being uploaded synchronously to R2. Normal pipeline persistence now updates
local archive copies but syncs only the recent 14-day window to R2; a genuine
late transition to graded always syncs regardless of age, while explicit
backfills retain full remote behavior. Also disabled the redundant second
1,200-team R2 lineup-cache pass after result enrichment; refreshed fixture rows
already retain cached lineups and current lineups still refresh normally. The
recovery run fetched Hull City 2–0 Manchester United and Ipswich 2–1 Sunderland,
completed the one-time local schema migration, generated/deployed Pages commit
`ef5e6e1b32`, and both `/` and `/22.08.2026.html` were verified through the live
CDN. Pipeline remains active under PID `4123633`.

**2026-08-22 promoted-team adjustment shipped:** Added a generic, archive-based
league-transition detector in `league_transition.py`; no club names are
hardcoded. For mapped major European league pyramids, a club entering the top
division with at least 10 graded lower-division matches and fewer than eight
top-flight matches is treated as a newcomer. Its inherited form/goal component
starts at 50%, receives a 0.25 metric penalty, and both adjustments fade linearly
over the first eight same-league matches. Cup fixtures and established teams are
unchanged. A 26-match decisive transition sample improved from 42.3% with no
penalty to 50.0% at 0.25; larger penalties produced no further hit-rate gain.
Because the legacy confidence converter uses only the winning side's absolute
metric, transition fixtures alone now use `HistoricalConfidenceCalibrator`, a
regularized logistic calibration trained each run on archived winner metric,
metric gap, picked side, selected odds/implied probability, and an odds-missing
indicator. Ordinary fixtures retain the old confidence system, avoiding a broad
Pro Picks/context-history migration. Seven expanding chronological folds over
30,335 predictions improved Brier score from 0.3128 to 0.2348, log loss from
0.8942 to 0.6615, and expected calibration error from 0.2593 to 0.0108. The
detected opening-day transitions were Ipswich (37 prior Championship matches)
and Hull (38); live values changed from 38% Ipswich / 20% Manchester United to
49% Ipswich / 64% Manchester United. Added diagnostic fields to games/archive
records and retained `promotion_adjustment_backtest.py` plus
`confidence_calibration_backtest.py`. Deployed Pages commit `d259edcd49`; both
the homepage and 22 August page were verified through the live CDN.

**2026-08-22 promoted-team model diagnosis (research only):** Investigated
Ipswich–Sunderland and Hull–Manchester United on the opening Premier League
day. `match_analyzer.py` carries each club's unadjusted recent W/D/L and
aggregate goals across divisions; it has no opponent or competition metadata
inside `match_history`. The graded archive correctly shows Ipswich (37) and
Hull (38) prior Championship matches versus Sunderland and Manchester United
having 32 prior Premier League matches each, so a dynamic league-transition
feature can be derived without hardcoded club names. A second independent issue
is that displayed confidence uses `gradient_converter(max(home_metric,
away_metric))` rather than the separation between the two metrics. Hull–United
therefore picks United but shows only 20%: Hull metric -0.688, United -0.005,
with United's historical away non-win penalty alone contributing -0.519.
Across 26,505 decisive graded predictions, metric-gap bands were strongly
monotonic (0.5–0.75: 60.8%, 1.0–1.5: 72.2%, 1.5–2.0: 79.7%, 2.0–3.0:
87.7%). A simple archived logistic calibration using winner metric, metric gap,
and picked side estimates Hull–United around 68.7% before a promotion adjustment
and 73.2–77.2% with a 0.25–0.50 newcomer penalty. Recommended next step is a
walk-forward backtest of a generic transition feature: detect a new domestic
league from prior graded history, shrink inherited form/goals initially, fade
over the first 6–8 same-league matches, and calibrate displayed confidence from
both absolute metric and metric gap. No production model change was made.

**2026-08-22 cumulative Pro Picks performance + Espanyol bridge:** Replaced
the static `81.6% · n=477` Pro Picks headline with a cumulative public record.
The original backtest remains the fixed baseline (389 hits from 477 graded
predictions through 13 August 2026); each subsequent frozen archive contributes
only graded selections, with a hit counted only when `correct == 1.0`. As of
the completed 21 August archive this is 406/497, displayed as `81.7% · n=497`.
The shared performance fields are written into every secure Pro payload and the
day templates render them dynamically in all six locales. Also fixed Espanyol
vs Real Madrid missing on 22 August: API-Football fixture `1570347` was present,
but Espanyol lacked a Transfermarkt/API bridge. Added the verified override
TM `714` (`espanyol-barcelona`) -> API `540` (`Espanyol`) and forced a fixture
window refresh; the refreshed production source now contains the match.

**2026-08-17 homepage ad/Pro Picks spacing:** Removed the top AdSense
container's 18px bottom margin and reduced the Pro Picks top margin from 16px
to 7px (13px to 7px on mobile). This removes the large empty band between the
horizontal ad and shortlist without changing ad dimensions or content. Added
`hotfix_ad_pro_spacing.py`, patched 84 current day pages, and deployed Pages
commit `4ff6e39ffa`. The origin repository contains the new CSS; Cloudflare was
still serving the prior cached homepage at the immediate check, and the current
API token lacks cache-purge permission, so normal edge propagation is pending.

**2026-08-17 security-header rollout (Worker complete, static rule pending):**
Added a single response wrapper to `worker/worker.mjs` so every fixture,
localized page, redirect, cached response, sitemap, and Worker 404 receives
HSTS (`max-age=31536000; includeSubDomains`), a conservative enforced CSP
(`frame-ancestors 'none'; object-src 'none'; base-uri 'self';
upgrade-insecure-requests`), `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
and a camera/microphone/geolocation-denying Permissions Policy. Deployed Worker
version `6e6f0fe5-62d5-4364-836d-aaaeabad3b51`; live fixture and localized-route
headers verified, and the fixture page loaded with CMP/auth/ad scripts and zero
console errors. The GitHub Pages-backed English root still needs the identical
response-header Transform Rule at Cloudflare zone level. The server token lacks
Transform Rules permission and the available browser session was signed out, so
that final static-page step remains pending an authenticated dashboard session.

**2026-08-17 evidence-aware fixture prose:** Replaced categorical goal labels
with neutral ranges: below 1.6 around 1–2, 1.6–2.39 around 2, 2.4–3.19 around
2–3, and 3.2+ as 3+ possible. Fixture prose now includes at most one strong,
descriptive recent-history signal (win-rate gap, goal tendency, or BTTS) using
the already cached five-match samples, with no new API calls. A 50–64% pick is
now described as a moderate favourite/edge rather than a standout or clear
favourite. All behavior and copy are localized across six languages.

**2026-08-17 fixture back-link layout hotfix:** Wrapped the localized fixture
back link in its own block row so it no longer runs into the prediction eyebrow
and date. The link remains visually restrained and retains the history/day-page
fallback behavior.

**2026-08-17 fixture navigation and form summaries:** Added a localized fixture
back control that uses browser history only when the referrer is an AIGoalie
day page, otherwise falling back to the fixture's localized day URL. Recent
matches now include compact last-five W/D/L, over-2.5, and BTTS percentages for
each team using existing cached scores only. H2H uses the same five metrics from
the current home team's perspective and is omitted unless at least three useful
scored meetings are available. No new API calls were introduced. Six-locale
rendering and inline JavaScript validation passed; live H2H verification passed
on San Luis vs Santiago Wanderers. Worker version
`4d518b18-76b2-4285-8e52-f80ec365d05a`.

**2026-08-17 Pro Picks unlock CTA fix:** The locked Pro Picks button called
`openProBox()` directly, which requires an authenticated user and therefore
failed silently for signed-out visitors. It now uses the shared `data-buy-pro`
checkout handler so it opens the new authentication UI when needed and resumes
checkout after sign-in.

**2026-08-17 authentication email delivery notice:** Until Firebase Support
removes the project's email-template restriction, the shared authentication UI
now tells new and unverified users in all six locales to check spam/junk after
sending a verification email. Cloudflare ignored the query-string cache bust,
so the deployed immutable asset is `/auth-ui-20260817-2.js`.

Living context doc for any LLM/agent session working on AIGoalie. Read this
first. Update it at the end of any substantive session (a maintenance note is
at the bottom). Last updated: 2026-06-22 (6-lang launch + SEO/ads/CWV/CMP session;
see Section 0 for what shipped + what's still open).

**2026-08-17 customer-request roadmap intake (planning only):** Updated
`product_todo.md` with three scoped product tracks; no production code was
changed. African payment access is approval-gated: seek explicit Flutterwave
compliance confirmation first, then consider a logged-in, webhook-granted
one-time 30-day Pro Pass while retaining Stripe subscriptions. Added Firebase
email/password authentication as the immediate broad alternative to Google-only
sign-in, including verification, password reset, provider linking, and Firebase
UID entitlement continuity. Added fixture-page backlog items for a locale-aware
back control, recent-form summaries, sample-gated H2H summaries, chronologically
validated top-three scoreline probabilities, and conservative factual table/
stakes context that is omitted when competition rules are uncertain.

**2026-08-17 broader Firebase authentication implementation (local, not yet
deployed):** Added a shared `auth_ui.js` dialog for Google or arbitrary-email
authentication in en/ja/es/de/fr/pt. It supports email/password account creation,
mandatory verification email, verified email sign-in, password reset, mobile
Google redirect fallback, localized errors, and account-creation/sign-in events.
Wired the asset into `vis_gp.html`, both Worker day/fixture render paths, and the
durable/current simulator templates. Pro checkout now opens the shared account
dialog instead of silently forcing Google and refuses unverified email accounts;
entitlements remain keyed to Firebase UID. Added `auth_ui.js` to
`github_job.py`'s static deploy allowlist. Validation passed: shared and Worker
JavaScript syntax, Python compilation, Jinja parsing, rendered Worker fixture
inline scripts, and an interactive local simulator dialog check. No production
upload/deploy was performed because Firebase Console → Authentication → Sign-in
method → Email/Password must be enabled first. Explicit credential linking for
an existing Google-created account remains a follow-up; initial collision
handling prevents accidental same-email account creation.

**2026-08-17 email/password production deployment:** Owner enabled Firebase
Email/Password; passwordless email-link sign-in remains disabled. Patched 404
currently generated Firebase-enabled pages, deployed shared `auth_ui.js`, and
cache-busted it as `/auth_ui.js?v=20260817-1`. Pages commits: `2f658f7d23` and
follow-up `a7cf40d748`. Deployed fixture/localized Worker version
`b1c055a4-0db7-4bd0-b24e-abdaa3f61c8a`. Public asset and page-source checks
passed, and the live fixture dialog renders Google plus email sign-in/create
controls. Restarted tmux pipeline `aigoalie` under PID `4017571` with durable
sources loaded. A signed-in “add password” provider-linking screen remains an
optional follow-up for existing Google-created accounts.

**2026-08-16 fixture Pro-state resilience + accuracy explanations:** Fixed a
fixture-page auth coupling bug where a failed `/pro/day/full` request or match
lookup reset an already verified Pro user to the signed-out UI and left the
contextual accuracy cards locked. Confirmed Pro entitlement now activates a
separate `pro-authenticated` state immediately (unlocking contextual accuracy,
hiding ads/upgrade prompts), while exact xG/BTTS/opponent values remain protected
until their authorized payload hydrates successfully. Match hydration now tries
API fixture id, strict league/team identity, then a unique team-pair fallback.
Future Pro JSON rows include `api_fixture_id`. Renamed the fixture metrics to
Similar accuracy, League accuracy, and Picked-team accuracy, changed “calls” to
“graded predictions”, and added concise explanations in all six locales. Worker
template QA then caught a pre-existing URL-regex escaping bug that rendered as
`/^https:///` inside fixture HTML, causing `Unexpected identifier 'location'`
and preventing the entire auth script from running. Replaced it with a
template-safe `startsWith("https://")` check in both billing helpers. Worker
version `ab9e2b74-79ba-4d30-a678-1bddd3fa8879`; every executable inline script
in freshly rendered live fixture HTML now passes Node syntax checking.
Customer follow-up requested clearer explanations for the three contextual
accuracy metrics. Fixture pages now explicitly state that these are historical
hit rates, not today's win probability; each card explains its actual confidence
range, competition, or picked team. Desktop retains a three-card strip, while
mobile uses three full-width compact rows instead of squeezing the cards into
three columns. Verified at a 390px viewport: 358px single-column cards, zero
horizontal overflow, and complete untruncated descriptions. Final Worker version
`a0f8acc1-b5a0-49bd-885d-1b6e6c9b8823`.

**2026-08-16 Pro Picks rationale expansion:** Replaced the truncated single
reason in each authenticated Pro Picks row with a compact expandable rationale.
The closed row retains the normal fixture-table layout; opening it shows every
secure reason key returned by the Pro API, a plain-language explanation for
each signal, an odds/context note, and a full-analysis link. Added localized
copy for en/ja/es/de/fr/pt and a `pro_pick_expand` Umami event. Public HTML
still contains no picks or internal score formula. Local and production Jinja/
JSON validation passed, and rendered inline JavaScript parses cleanly. Pipeline
deployment commit: `f0efd8b7dd`.

**2026-08-16 Pro Picks signal simplification:** Owner rejected the expanded
rationale as over-explaining the selection method and correctly flagged
“model and market agree” as weak product positioning. Pro Picks now show two
or three small, always-visible signal chips beneath each normal fixture row,
with no expandable prose or odds disclaimer. Signals are limited to data depth,
league accuracy, confidence-range accuracy, and bookmaker odds not being too
short. The latter is now a real independent rule (`odds >= 1.25`) rather than a
renamed market-agreement check; archived `model_market_agree` reasons are only
mapped to the new label when their stored odds also meet that threshold. Future
payloads may carry up to three reasons. Localized all six languages, hotfixed
132 generated pages, and deployed Pages commit `7b04998e6b`; live English and
Japanese pages plus inline JavaScript were verified.

**2026-08-16 Pro Picks rationale quality fix:** Tightened explanation
eligibility so a league rate is called strong only at 65%+ and at least eight
points above the global baseline; confidence-range history requires 70%+ and
the same lift. Replaced the generic odds rationale with `Value signal`, emitted
only when the learned win probability implies at least a 5% positive expected
edge at odds 1.25+. Frozen daily selections remain unchanged, but their reason
metadata is recalculated from current history. Legacy market-agreement labels
are omitted instead of being reinterpreted, and matches with no defensible
reason show no rationale chip. Refreshed the 16 August secure payload: Feyenoord
no longer claims 56% league accuracy. Patched 133 generated pages and deployed
Pages commit `bf721fa24776fc6c8f8323f5f05c3f412332cf48`.

**2026-08-16 major domestic super-cup Featured priority:** Community Shield
was eligible but shared the 20,000 domestic-cup tier, so Portugal's Primeira
Liga (30,000) incorrectly outranked Arsenal–Manchester City. Promoted the five
explicitly allowlisted major domestic super cups (Community Shield, Supercopa,
DFL-Supercup, Supercoppa Italiana, Trophée des Champions) to 31,000: above
ordinary domestic leagues, below the UEFA Super Cup. Hotfixed current generated
pages and deployed Pages commit `6e21e827e0572360d33e76ba26c112e1fbcfa4e5`;
live Community Shield priority verified as 31,000. Follow-up found the
long-running `auto-script.py` process had imported the previous 20,000 priority
before the source upload and therefore overwrote the generated hotfix on its
next cycle. Reapplied the 48-page hotfix, deployed commit `565f6f4721`, and
restarted tmux session `aigoalie` so future generations load the durable 31,000
priority.

**2026-08-15 strict Featured League policy:** Replaced the broad value threshold
and generic Super Cup matching with an explicit major-competition allowlist.
Featured now permits only senior major international tournaments/qualifiers,
the principal continental club competitions, selected major domestic leagues,
selected major domestic cups, and five named domestic super cups. Friendlies,
youth/reserve competitions, lower divisions, regional cups, and unlisted super
cups can never be Featured; if no allowlisted competition is present, the
Global view has no Featured section. Selection sorts by competition tier first,
then by the combined market value of the strongest actual fixture on that day,
then by league value. This means, for example, a Real Madrid–Barcelona match can
outrank a lower-value Premier League fixture while Champions League still ranks
above either domestic league. The same order drives Featured and By League.

**2026-08-01 compact browsing mock (local only):** Added
`preview_compact_browse_mock.html` plus desktop/mobile screenshots. The concept
keeps AIGoalie's current palette and prediction depth while adopting a denser
FotMob-like browsing hierarchy: compact league headers, fixed team/time/team
row alignment, one restrained confidence accent, a five-metric horizontal strip,
and accuracy detail only after expansion. No production files were changed.

**2026-08-14 Pro Picks UI mock (local only):** Extended
`preview_compact_browse_mock.html` with a compact `Today's Pro Picks` shortlist
between the top ad and match browser. The mock includes Pro-member, locked free,
and honest no-qualified-picks states; shows up to three ranked selections with
competition, kick-off, confidence, and concise rationale; and labels the 80.0%
figure as a historical backtest rather than a promise. Real production must load
the member rows only after server-side entitlement verification so locked picks
never appear in public HTML or client payloads. No production files were changed.

**2026-08-01 compact day-card rollout + ad hotfix:** Applied the compact
five-cell expansion styling to `vis_gp.html` while preserving all Pro hooks.
AdSense was then observed expanding the nominally horizontal top slot to 390px
on mobile. Fixed day-page slots to explicit responsive heights (top: 60px
desktop / 100px mobile; lower rectangle: 300x250) and disabled full-width slot
expansion. Hotfixed generated day pages without restarting the API pipeline;
Pages commit `853eb70f68`. Live mobile measurements verified 370x100 top and
300x250 lower containers.

**2026-08-02 delayed-result/API quota fix:** Investigated PSV Eindhoven vs AZ
Alkmaar remaining `NS` four hours after kick-off. Production logs showed the
7,500-request API-Football daily quota exhausted. Root cause was
`build_api_fixture_index()` fetching every unresolved fixture by ID before the
single date request (hundreds of redundant calls each pipeline cycle), while
the date helper also discarded API errors as an empty result and triggered an
even larger ID fallback storm. Result refresh now fetches dates first through
the scraper's quota-aware client, performs direct-ID requests only for fixtures
actually absent from successful date payloads, and skips all ID fallbacks when
a date fetch fails. The unfinished corner-stat backfill default was reduced
from 120 to 12 requests/run. Uploaded to production, compile/fallback/failure
guard tests passed, and the `aigoalie` tmux pipeline was restarted. The already
stale PSV result must wait for the provider quota reset; future refresh cycles
should no longer exhaust quota through this path. Follow-up during deployment
found failed event/lineup requests were not incrementing their per-run counters,
causing unbounded retries after exhaustion. Events, lineups, and statistics now
default to 12 calls/run each; failed attempts count toward caps; and the first
daily-quota error trips a circuit breaker for the rest of that scraper run.

**2026-08-02 league-header flag cleanup:** Removed variable API league logos
from day-page league headers. Domestic competitions now consistently show the
country flag; international competitions use a specific competition symbol
(Champions/Europa/Conference/etc.) with a globe fallback. Unified static,
client-rendered, featured, league-view, and Pro-loaded header paths. Expanded
`COUNTRY_FLAG_CODES` from 68 to 123 entries, covering every country currently
present in `games.pkl`. Uploaded `html_generation.py` + `vis_gp.html`, validated
Python/Jinja syntax on production, and restarted the `aigoalie` pipeline.

**2026-08-02 featured/by-league alignment:** Unified the homepage Featured
league with the first league shown in the By League tab. Added a shared
competition priority for Super Cups (`6800`, below major qualifiers) and
demoted friendly exhibitions including Friendlies, Summer Series, Como Cup,
Piala Presiden, and pre-season competitions. The client now preserves the
server's value-based order for equal-priority leagues, clones that exact top
eligible league into Featured, and restores every non-featured league row to
All Matches. Applied `hotfix_featured_league.py` to 652 generated pages without
restarting the pipeline; Pages commits `4cb9e3b2b4` and pipeline follow-up
`6279f190d5` both contain marker `featured-league-sync-20260802`.

**2026-08-02 day-page terminology + mobile polish:** Changed the view selector
from "All matches" to localized "Global" while retaining the global section
heading "All matches" and adding "Ranked worldwide by AI confidence" context.
Renamed "Next" to "Upcoming", labeled confidence pills as `AI 74%`, renamed
the contextual metric to "Similar accuracy", and replaced "calls" with
"predictions". Reduced mobile navbar/date-control dimensions, widened compact
team-name space, softened league-logo tiles, and constrained InMobi Choice's
`qc-cmp2-persistent-link` to a 44px circular control so it cannot cover match
actions. The temporary visible `AI` prefix on confidence pills was removed
again because the green picked-team styling already provides direction; the
accessible `AI pick` title remains. Added translations for en/ja/es/de/fr/pt. Applied
`hotfix_ui_polish.py` to 652 generated pages; Pages commit `105e3748a3`.
Verified live marker `day-ui-polish-20260802`, labels, first-card metrics, and
Featured/By League alignment.

**2026-08-03 Featured header + Pro hydration fix:** On mobile, assigned the
Featured label to the league-header secondary grid row so long league names get
the same main-row width as ordinary league headers. Diagnosed Featured-only
locked xG/BTTS as a local-day/UTC-date mismatch: e.g. a promoted 4 August match
can appear on a local 3 August page, while Pro previously fetched only the page
date. `loadProFullForDateV12()` now fetches the nominal Pro day plus up to two
UTC dates represented by rendered rows, then hydrates all matching cards.
Future Pro-only empty pages still render only their requested primary date.
Template and rendered JavaScript checks passed. `hotfix_featured_pro.py` patched
314 currently generated pages; Pages commit `1e036a0312` contains marker
`featured-pro-adjacent-dates-20260803`. A mobile follow-up separated the
Featured label and league-accuracy chip into distinct `featured`/`acc` grid
areas after they overlapped in the secondary header row. The durable template
and 314 generated pages were updated; Pages commit `f2af62f7a6`. CDN
propagation was still pending at the immediate final check. The pipeline was
restarted after the durable template upload.

**2026-08-04 rescheduled-fixture dedupe fix:** A fixture rescheduled by
API-Football could remain published on both its old and new dates because the
historical merge/dedupe identity included the date. Fenerbahce vs Sturm Graz
exposed this: both records shared API fixture id `1607165`, but one stale row
still pointed at 4 August while the provider had moved it to 5 August. The
generator now treats `api_fixture_id` as the authoritative identity and runs a
second dedupe immediately after enrichment, when current rows have received
their API ids. A production-pickle smoke test removed 194 stale duplicate rows
across 193 duplicated API fixture ids and retained the current 5 August record.
The production pipeline regenerated/deployed Pages commit `27eb53c515`; the
resulting pickle has zero duplicated API fixture ids, and a rendered browser
check on the 4 August homepage contains no Fenerbahce row. The obsolete 4 August
fixture JSON was quarantined locally and deleted from R2; the correct 5 August
fixture remains published.

**2026-08-04 temporary Moneytizer restoration:** Switched active day-page,
localized-day, and fixture-page advertising from AdSense back to Moneytizer so
the existing `$36.46` balance can reach the `$50` payout threshold. Preserved
the same restrained two-slot layout: format `1` above primary content and
format `19` lower on the page; Pro users still hide all `.ad-container`
elements. Removed AdSense runtime scripts, slot markup, and loader calls while
retaining the harmless AdSense account meta verification tag. The exact
publisher ID, runtime tag, three slot IDs, markup, and restoration notes are in
`ADSENSE_PROVIDER_BACKUP.md` outside the deployed site. Added the durable
Moneytizer implementation to `vis_gp.html` and `worker/worker.mjs`, plus
`hotfix_moneytizer_restore.py` for generated pages. Patched 320 current day
pages and deployed Pages commit `71d6dd73e3`. Bumped both Worker cache versions
and deployed Worker version `46a440ff-a9f1-4dd6-9db3-3dada5c7ce90`. Live
browser checks confirmed formats `1`/`19` initialize on homepage and fixture
pages, with zero `adsbygoogle` elements or AdSense runtime scripts.

**2026-08-14 Pro Picks production launch:** Added `pro_picks.py`, a daily
shortlist generator trained on prior graded matches with model confidence,
confidence-bucket/league/team history, data depth, enrichment availability,
and a capped market-value signal. Production policy is reliability `>=0.74`,
data quality `>=0.40`, and at most three selections; it deliberately returns
fewer or zero picks when the threshold is not met. Current/past shortlists are
archived immutably under `pro_picks/YYYY/MM/DD.json` (only status/result grading
updates later), while future dates remain dynamic. `predict_new.py` writes the
shortlist only into the authenticated Pro GCS payload
`json/pro-day-DD.MM.YYYY.json`; public day-page HTML contains the locked UI and
renderer but no actual picks or internal reliability/ranking values.
`vis_gp.html` now renders localized locked/loading/member/abstention states and
tracks `pro_pick_click`. Production `venv2` now includes scikit-learn 1.9.0
(plus scipy/joblib/threadpoolctl); reinstall it if the environment is rebuilt.
The first clean pipeline run generated variable shortlist sizes across 11
dates, uploaded the secure payloads, and deployed Pages commit `1613157516`.
Live source verification confirmed the component/renderer are present and
`pro_picks` data is absent from public HTML. The displayed `80.0% · 519
predictions` is explicitly labeled as a historical backtest, not a guarantee.

**2026-08-14 Pro Picks row consistency follow-up:** Restyled unlocked shortlist
entries to use the same home-team / crest / time-or-score / crest / away-team
grammar as ordinary match rows. The picked team is green, confidence uses the
standard compact colored pill, and live or graded picks show the score plus a
localized live/hit/miss marker when available. Secure payloads now include
team logo URLs/ids and sanitized score/status/outcome fields; archived picks
hydrate these presentation fields on later runs without changing the original
selection. The UI also falls back to crests already present in public match rows
for compatibility with older payloads. `hotfix_pro_picks_rows.py` patched 66
active generated pages and Pages commit `f653265693` deployed the change. The
active 11-day Pro GCS window was refreshed directly without another API-Football
cycle. Live JavaScript parsed cleanly and public HTML still contains no
`pro_picks` payload. A same-session simplification then removed all evidence/
justification copy from unlocked rows, replaced the written hit/miss badge with
the exact circular check/cross marker used by ordinary match rows, and added a
subtle optional odds label. Pages commits `59c9cc8c7b` and `3e8d885597` shipped
the visual change and removed the old unused reason-label JavaScript.

**2026-08-13 future-day odds fix:** Verified that the live current-day page had
odds while `14.08.2026.html` had none, despite API-Football returning odds for
67 of the site's 105 Friday fixtures. Replaced the fragile odds enrichment
join (team bridge plus the first matching team) with direct `api_fixture_id`
matching and a full search for each bookmaker's `Match Winner` market. Odds now
use the configured production API key and cover today plus two future dates by
default (`AIGOALIE_ODDS_DAYS_AHEAD`). The four-hour lightweight fixture-window
refresh also treats `n/a`/`nan` odds as missing, preserving previously fetched
prices instead of overwriting them. Production was backfilled to 48/56 odds
fixtures Thursday, 69/105 Friday, and 156/243 Saturday before regeneration.

**2026-08-14 Pro Picks shortlist research (local only):** Added
`pro_picks_backtest.py`, `pro_picks_backtest_report.json`, and
`PRO_PICKS_RESEARCH.md`. The chronological prior-only backtest uses 34,401 graded
matches with a 60/20/20 train/validation/test split. The validation-selected
primary is a top-three hybrid reliability score: regularized estimated hit
probability using confidence, rolling league/confidence/team evidence, minimum
team-data depth, and bookmaker agreement, plus a deliberately small capped EV
adjustment. It achieved 64.5% vs 61.9% confidence-only in validation and 75.6%
vs 71.6% on the untouched recent test (combined out-of-sample 70.1% vs 66.8%).
A positive-value variant showed encouraging theoretical ROI but meaningful
monthly instability, so the recommendation is a private 30–60 day live paper
track before exposing or marketing returns. Follow-up tested fixed top 1–5 and
adaptive no-pick gates. Forced top-three was the most stable product choice;
forced top-five diluted combined out-of-sample hit rate to 65.3%. The
validation-selected adaptive rule is up to three picks with internal learned
reliability >=0.70: validation 71.8% (163 picks, 7/67 no-pick days), untouched
test 76.2% (181 picks, 4/67 no-pick days). The internal gate must not be exposed
as a literal customer-facing probability. A seven-fold expanding-window
cross-validation covering 234 consecutive active days from 19 December 2025 to
13 August 2026 produced 74.1% for confidence top-three, 75.4% for forced hybrid
top-three, and 78.5% for gated up-to-three (629 picks, 220/234 days, max losing
streak four). This is a post-selection robustness check, not a fresh untouched
test; live forward tracking remains required. A league/month diagnostic found
large apparent weak cells (including EPL January, Championship April/September,
Bundesliga May, Ligue 1 May, and LaLiga2 December), but the dense archive spans
only one continuous Sep-2025–Aug-2026 cycle. Of 440 adequately sized
league/month comparisons, no negative effect survived false-discovery
correction. Do not add league×calendar-month penalties yet; collect a second
season and prefer explicit competition-phase/stakes/rotation signals. Concrete
shortlist review also found occasional very low-history selections. A post-hoc
quality-floor sensitivity check gave 78.8% at quality>=0.40 (579 picks, 212/234
days) and 79.2% at quality>=0.50 (543 picks, 201/234 days), versus 78.5% without
a floor. Treat 0.40 as a forward-test candidate, not proven optimization. No
production files were changed. A broader post-hoc selectivity frontier found:
best single pick at gate 0.70 = 83.2% (220 picks, 220/234 days); up-to-three at
gate 0.74 plus quality>=0.40 = 80.0% (519 picks, 201/234 days); gate 0.76 =
81.8% (477 picks, 187/234 days); gate 0.80 = 85.3% (347 picks, 157/234 days).
The gain is mainly from publishing fewer picks, not a new formula. Forward-test
0.74 and 0.76 for at least 60 new active days before advertising an 80% rate.
Distinct formula benchmarking on the same rolling folds produced: raw
confidence 74.1%, heuristic 72.9%, learned logistic 74.6%, quality-adjusted
74.8%, hybrid logistic+market 75.4%, histogram gradient boosting 75.6%, Extra
Trees 75.5%, and three-model ensemble 76.1% for forced top-three. Formula
changes alone did not reach 80%; a forced single best pick did reach 80.8%.
With formula-specific thresholds matched to ~86% date coverage and
quality>=0.40, gated hit rates converged: logistic 80.0% (519), histogram
gradient 79.6% (529), Extra Trees 80.0% (541), ensemble 79.9% (533). The
abstention gate—not model class—drives the 80% result; retain logistic initially.

**2026-08-12 missing UEFA Super Cup + fixture-window refresh:** PSG vs Aston
Villa (API fixture `1583664`) was absent because PSG had no current API bridge
(`TM 583 -> API 85`), while a stale historical mapping incorrectly described
Paris FC (`TM 10004 -> API 114`) as PSG. Added the verified PSG bridge without
disturbing Paris FC. A second root cause meant the correction still could not
surface until the next day: `update_current_fixtures()` reused the morning
fixture JSON indefinitely and refreshed results only. It now refreshes the
eight-day API fixture window every four hours (configurable with
`AIGOALIE_FIXTURE_WINDOW_REFRESH_HOURS`), performs lightweight date calls when
an existing window is present, preserves prior enrichment by API fixture id,
and safely falls back to the existing file if refresh fails. Forced the refresh,
generated PSG–Aston Villa at 20:00 UK with a 69% PSG prediction, and deployed
Pages commit `7561204925`.

**2026-08-12 UEFA Super Cup featured priority:** The generic Super Cup score
(`6800`) placed PSG–Aston Villa below Champions League qualifiers on both the
Global Featured card and By League ordering. Added a specific UEFA Super Cup
priority (`11500`), below the World Cup but above Champions League, while
leaving domestic Super Cups unchanged. Updated the durable Python and client
ranking logic and hotfixed generated pages; Pages commit `931d8f85e0`. A live
browser check confirmed UEFA Super Cup is first in both views and the Featured
match is Paris Saint Germain vs Aston Villa.

**2026-08-10 AdSense restoration:** Moneytizer revenue remained around two
cents/day, making the remaining `$13.54` to its payout threshold uneconomical
versus the observed AdSense revenue. Restored AdSense while retaining
`ADSENSE_PROVIDER_BACKUP.md` as the provider reference. Day and localized day
pages use horizontal slot `8259703311` above primary content and rectangle slot
`9058921308` below the featured/primary section; fixture pages use horizontal
slot `8259703311` and lower rectangle `5127983370`. Loading remains gated until
Firebase/Pro state resolves, checks non-zero slot width before `push({})`, marks
each slot before initialization to prevent duplicate pushes, and hides all ads
for Pro. Preserved the 2026-08-10 billing-portal fix. Patched all generated
legacy layouts, leaving zero Moneytizer ad-runtime references across 362 ad
pages. Pages commits: `dd5289aab9`, `7bbf4eea18`, final `c3783cfad2`. Worker
version: `ab86fb2c-3cfb-4d32-afc0-5b2e51cd5af8`. Live HTML checks confirmed one
AdSense runtime, the correct two slots, zero Moneytizer runtime, and billing
portal wiring on both homepage and fixture pages.

**2026-08-12 billing portal compatibility fix:** The earlier billing fix was
present in `vis_gp.html` and Worker-rendered pages but had only reached 119 of
368 generated static pages. Another 249 pages displayed `#manageBilling`
without either `openBillingPortal()` or a click listener, so the control did
nothing. Reworked `hotfix_billing_portal.py` to independently ensure the portal
function, element declaration, and listener on every generated layout. Patched
249 pages; the final audit is 368 buttons / 368 endpoint calls / 368 handlers.
The pipeline's concurrent deploy commit `0fcf70260c` contains the changes, and
live checks passed on `/index.html` plus a legacy localized day page. Also
staged a defensive Pro API improvement in `pro_service/app.py`: Firebase token
email is retained, missing `stripe_customers/{uid}` mappings can be resolved
from Stripe customer UID/email and self-healed, and future Checkout sessions
carry `customer_email` plus `client_reference_id`. This backend source is on the
VPS but still requires the normal authenticated Cloud Run deployment; no local
or VPS `gcloud` credentials/tooling were available in this session.

**2026-08-10 billing portal fix:** The account dropdown exposed `Manage
billing` on generated day pages but never attached a click listener, while both
Worker implementations silently ignored non-200 portal responses. Added a
shared day-page portal request using a force-refreshed Firebase token, attached
the missing listener, validated the returned HTTPS URL, prevented duplicate
clicks, and surfaced API errors instead of failing silently. Applied the same
robust flow to localized day and fixture Worker pages and added
`billing_portal_click` analytics sources. Patched 356 generated Pages and
deployed commit `00d67bd519`; bumped Worker cache versions and deployed Worker
version `0f6ada3e-f800-4cd7-a954-c6d989a99121`. Verified live homepage and
fixture HTML contain their respective handlers. The Cloud Run
`/billing-portal` route and CORS preflight were independently confirmed healthy.

---

## 0. SESSION LOG 2026-06-22 + OPEN ITEMS

**Shipped & live today (all verified):**
- **6 languages indexed**: en + ja + es + de + fr + pt-BR. Worker generalized to a
  generic `/<lang>/*` router (FX_PACKS); per-language indexability via
  `FX_<lang>.indexable` (worker) + `locales.json` `enabled` (pipeline). Final
  worker incl. enriched JSON-LD: version after `cabe062c` → see latest `wrangler
  deploy` (jsonLD enrich was `758caee8`; CWV img/cv changes also deployed).
  `AIGOALIE_I18N_QA_LANGS=ja,es,de,fr,pt`. Legal pages stay noindex (English body).
- **Structured data**: `jsonLD()` enriched (endDate, image, description, performer,
  organizer, eventStatus, real locality). The Search Console "missing location/
  startDate" ERRORS were STALE (pre-fix crawls) → just need "Validate Fix".
- **ads.txt**: added 419 + 2 missing Moneytizer reseller lines (now ~1140). Static
  file in deploy repo (`site/AI-Goalie/ads.txt`), pushed.
- **2026-07-05 ads.txt follow-up:** Moneytizer flagged two missing reseller lines:
  `connectad.io,586,RESELLER,85ac85a30c93b3e5` and
  `adform.com,768,RESELLER,9f5210a2f0999e32`. Added them to both
  `/home/aigoalie-monetized/ads.txt` and `site/AI-Goalie/ads.txt`, deployed
  Pages commit `6b54c05805`, and added `ads.txt` to `github_job.py`'s static
  allowlist so pipeline deploys keep the root copy durable.
- **2026-07-05 Moneytizer slot expansion:** day pages and fixture pages now
  render four Moneytizer slots for non-Pro visitors: megabanner `128244-1`,
  top medium rectangle `128244-2`, bottom medium rectangle `128244-19`, and the
  existing footer/slide-in `128244-6`. Day template `vis_gp.html` and Worker
  `worker.mjs` load visible `.ad-container[data-moneytizer-format]` slots
  dynamically and still hide ads for Pro. Pages commit `e83b69aec1`; Worker
  version `d608500d-ff11-4e33-a916-7071ba3e1be3`. Verified live on
  `/index.html` and `/match/2026-07-04-paraguay-vs-france`.
- **2026-07-05 fixture ad density rollback:** fixture pages were too ad-heavy
  above the fold on mobile. Worker now removes all pre-title fixture ads and
  renders only one medium rectangle `128244-2` after the prediction/prose plus
  the footer/slide-in `128244-6`. Day pages keep the fuller four-slot layout.
  Worker version `6b1c88d7-3a9e-4c05-bf14-f5c50f3d9d3d`; verified no fixture
  ad appears before the title.
- **2026-07-05 fixture ad final placement:** moved fixture ad `128244-2` to sit
  directly after the main score/gauge hero card and before the prediction tiles
  (`pred-strip`), with no slide-in on fixture pages. Worker version
  `b1245e31-df7f-4012-ad3a-ee42730ab327`.
- **2026-07-06 fixture ad hard isolation:** fixture ad `128244-2` now sits
  inside a dedicated `.fixture-ad-card` with reserved height, centered 300x250
  slot, `isolation:isolate`, `contain:layout paint`, and overflow clipping.
  Bumped `MATCH_PAGE_CACHE_VERSION` to `2026-07-06-fixture-ad-box-v1` so old
  edge-cached broken fixture HTML is bypassed. Worker version
  `c1d2ee85-2377-4780-9657-2f3e2675c1af`; verified live body order on
  `/match/2026-07-06-mexico-vs-england`: hero → fixture ad card → pred-strip.
- **2026-07-06 fixture ad iframe isolation:** Moneytizer `128244-2` still
  escaped/overlapped the hero when loaded as a raw page-level slot. Replaced the
  fixture raw slot with a sandboxed `.fixture-ad-frame` `srcdoc` iframe inside
  `.fixture-ad-card`, removed `data-moneytizer-format` from fixture body markup,
  and bumped `MATCH_PAGE_CACHE_VERSION` to `2026-07-06-fixture-ad-iframe-v1`.
  Worker version `08c6a1d1-0bea-48a3-b7d0-99331360fbc0`; verified live
  `/match/2026-07-06-mexico-vs-england` has `fixture-ad-frame` and no raw
  `data-moneytizer-format="2"` in body.
- **2026-07-06 fixture ad iframe rollback:** the sandboxed iframe rendered an
  empty frame (Moneytizer does not reliably fill from `srcdoc`/sandbox). Rolled
  back to raw Moneytizer `128244-2`, but moved it lower: after prediction tiles,
  Pro soft CTA, model accuracy, and prose, before lineups/recent sections. This
  preserves fill while keeping any misbehaving creative away from the hero.
  `MATCH_PAGE_CACHE_VERSION=2026-07-06-fixture-ad-lower-v1`; Worker version
  `210a287d-5dcf-43a7-97fd-3962524ab95a`; verified live order:
  hero → pred-strip → prose → `fixture-ad-lower`.
- **2026-07-06 fixture ad final revert:** lower raw fixture placement was still
  visually broken on mobile. Reverted fixture pages to the original safer
  approach: exactly one raw Moneytizer `128244-2` slot immediately after the
  navbar/header and before the fixture title, with no lower/mid-page fixture ad.
  `MATCH_PAGE_CACHE_VERSION=2026-07-06-fixture-ad-top-only-v1`; Worker version
  `72186c9c-56e1-4c90-abbe-214a14179ebf`; verified live
  `/match/2026-07-06-mexico-vs-england` has one `data-moneytizer-format="2"`
  slot, ordered header → `fixture-top-ad` → eyebrow/title.
- **2026-07-06 fixture ad unit switch:** Moneytizer `128244-2` behaves like a
  rogue/sliding unit on fixture pages. Switched the top-only fixture ad to the
  other 300x250 unit, `128244-19` (`formatId=19`), and bumped
  `MATCH_PAGE_CACHE_VERSION=2026-07-06-fixture-ad-19-top-v1`. Worker version
  `f4718158-8284-4614-a603-c4db9310fb54`; verified live fixture body has
  `id="128244-19"` / `data-moneytizer-format="19"` and no `128244-2`.
- **2026-07-07 day-page ad simplification + featured section:** removed the
  "New simulator" teaser from day pages. Day pages now use only two Moneytizer
  units: top megabanner `128244-1` above content and inline rectangle
  `128244-19` after the first featured section. Removed `128244-2` and
  `128244-6` from day-page bodies. Global view now renders World Cup first when
  present; otherwise it features the top league from league view (e.g. top
  qualifiers/competition of the day) before the remaining all-matches section.
  Client render runs on initial load so already-generated pages get the same
  featured-section behavior. Pages deploy commit `664fe1128b`; verified live
  `/index.html` has no simulator markup, only ad formats `1` and `19`, and
  `featuredLeague`/`featured-section` logic present.
- **2026-07-07 date-bleed hotfix:** the initial client `renderGlobal()` /
  `renderLeague()` call re-rendered from the full local-window JS payload before
  local-date pruning, causing World Cup/featured rows from adjacent days to show
  on pages like `08.07.2026.html`. Removed the initial client re-render from
  generated pages and template, keeping server-rendered date-filtered content.
  Also replaced the fragile `Intl.DateTimeFormat('en-CA')` local-date check with
  deterministic `getFullYear()/getMonth()/getDate()` construction. Pages deploy
  commits `24ede18e78` and `becf96d9d6`.
- **2026-07-07 featured two-slot ad layout:** after local placeholder QA, day
  pages now use only megabanner `128244-1` above the featured content and one
  bottom rectangle `128244-19` moved directly after the first visible section
  (World Cup when present, otherwise the first global/league section). Fixture
  pages use `128244-1` after the navbar and `128244-19` after the prediction
  prose, before lower detail sections. Removed formats `2` and `6` from these
  page bodies. Pages commit `f78d3a2a67`; Worker version
  `acb60dd7-dd8f-47f5-9683-26c427561ad4`; live verification returned formats
  exactly `['1','19']` on `/index.html` and a `/match/*` page.
- **CWV**: added logo `width/height` + `decoding=async` + `content-visibility` on
  `.mrow` (best-practice, quality-neutral). DIAGNOSIS (from real PSI): desktop
  **CLS 0.57 = the ad stack** (lab CLS≈0; not our markup) → Moneytizer/CMP-side
  fix. Mobile **LCP 5.5s** = ad JS + oversized api-sports crests (owner CHOSE to
  keep api logos for quality, so logo bytes left as-is). 6,736 local webp logos
  exist but are lower quality + keyed by a different internal id — not used.
- **CMP**: InMobi Choice (Moneytizer, TCF v2.3, choice id `6Fv0cGNfc_bw8`).
  ROOT CAUSE of "Not detected" FOUND + FIXED: day/fixture/matchup pages had a
  STRIPPED, BROKEN variant — an empty `window.__tcfapi = ...||function(){}` no-op
  + a bare choice.js loader, NO `makeStub`/`__tcfapiLocator`/`__uspapi` stub. The
  no-op `__tcfapi` actively defeats TCF detection (it was NOT Cloudflare). REPLACED
  site-wide with the EXACT full official tag in `vis_gp.html`, `worker.mjs` (×2),
  `matchup_page.py`, the static pages, + `cmp_tag.html` (loaded by results_page.py).
  Deployed worker `e301e700` + pipeline regenerated. VERIFIED live on homepage/day/
  fixture/matchup/ja/static: `makeStub` + `__tcfapiLocator` present, no-op gone.
- **Privacy policy**: rewrote with Advertising/cookies/TCF/CCPA/Firebase sections
  (+ corrected "Google Analytics"→Umami). NOTE: `privacy-policy.html`,
  `contact.html`, `disclaimer.html`, `matchup.html` are copied CWD→deploy by
  github_job (lines ~107-112), so EDIT THE CWD COPIES (a direct edit to
  `site/AI-Goalie/` gets overwritten on next deploy — this bit us once today).

**OPEN ITEMS (owner / next session):**
1. **Search Console (owner):** (a) "Validate Fix" the structured-data location +
   startDate errors (already fixed; stale). (b) Resubmit `sitemap-index.xml` (now
   lists ja/es/de/fr/pt). (c) Monitor indexing of the 6 languages.
2. **CMP detection (owner):** the broken tag was the cause and is now FIXED (full
   official tag site-wide, verified). Re-run Moneytizer "VERIFY INTEGRATION" — it
   should now detect (proper `__tcfapi` locator present). Then confirm the CMP is
   **consent-GATED** (blocks non-essential trackers until consent) — the
   Usercentrics scan saw trackers firing, which the proper stub should now address.
3. **results.html CMP:** live after this restart (results_page.py loads
   `cmp_tag.html`). Done.
4. **CLS 0.57 / INP / ad JS:** Moneytizer dashboard tuning (avoid interstitial/
   in-text; reserved-space/anchored formats; consent-gating). Not our code.
5. **Privacy policy:** have a human/legal eye confirm the wording (it's MT-grade
   standard text). Optional: add clean `/privacy-policy/` route (currently the
   `.html` is what's linked; clean URL 404s).
6. **Native review of es** (de/fr/pt were owner-reviewed; es shipped on MT — fine
   per owner, but a native Spanish pass is still worth doing).
7. **Optional/old:** single-source FX-from-messages (packs hand-authored);
   `aigoalie.service` systemd unit written but not installed (tmux restart is the
   documented method — see [[aigoalie-ssh-infra]]); roll exposed R2/CF creds if
   not already done; optional Cloudflare Image Resizing for crest LCP if revisited.

---

## 1. What AIGoalie is

ai-goalie.com — AI football match predictions across ~300+ leagues. Daily-
generated static HTML. Revenue = Stripe Pro subscriptions + Moneytizer display
ads. Betting affiliates were REMOVED (June 2026; zero revenue, quality drag).

**Owner/operator:** solo founder (deep-RL PhD student at QMUL, viva pending,
based in Kyoto). Prefers: budget discipline on API spend, honest/non-cherry-
picked stats, reversible staged changes, not breaking the live revenue surface.
Does NOT want to be publicly named yet, and does NOT want the model's mechanism
(Transfermarkt market values) made public.

**Traffic context:** declined from ~74k views/mo (Dec) to ~7k (June) due to
Google AI Overviews killing informational-query CTR + helpful-content demotion
of thin prediction sites + euro off-season. Core strategy reframe: stop chasing
head-term rankings, become the SOURCE that AI answers CITE — via verified track
record, per-fixture pages, E-E-A-T, owned audience.

---

## 2. The model (do NOT rebuild without explicit ask)

A 2-year-old static hand-tuned formula in `match_analyzer.py` — originally
logistic regression with handcrafted features, weights since tuned by hand.
Uses scraped Transfermarkt market values to gauge team strength. "Static model
that updates its predictions as new matches are played." It produces a
match-level pick + win-confidence %, xG estimates, goal probabilities.
Calibration is strong (top-call 82%+, under-confident) — see §5. Rebuilding it
is explicitly DEPRIORITIZED. The whole strategy is "fix discovery + conversion
around the working model," not "rebuild the model."

---

## 3. Infrastructure (all LIVE as of 2026-06-13)

```
Hetzner VPS (49.13.2.179, root, code in /home/aigoalie-monetized/, venv2)
  - auto-script.py runs the pipeline loop in tmux session "aigoalie"
  - generates HTML -> pushes to GitHub Pages repo (branch: master)
  - writes per-fixture JSON -> R2 (archive) + local archive/
  - uploads pro-day JSON + CSV -> GCS bucket aigoalie_storage (json/, csv/)
        |
GitHub Pages (repo AIGoalie/AI-Goalie, branch master) — day pages, results.html,
  static assets. Bounded rolling window so repo doesn't grow unbounded.
        |
Cloudflare (free plan, zone ACTIVE, nameservers hans/june.ns.cloudflare.com)
  - CDN/cache in front of the whole site (SSL: Full)
  - Worker "aigoalie-match-pages" renders /match/* from R2
  - DNS: 4 A records -> GH Pages (proxied/orange); www CNAME (proxied);
    wildcard * -> pixie.porkbun.com (grey); TXT records (acme, google-verify)
  - NO MX (email is plain gmail aigoalie.mail@gmail.com, not @ai-goalie.com)
  - pro.ai-goalie.com is VESTIGIAL (hits Porkbun parking) — site talks to the
    Pro API via the full run.app URL directly, NOT via pro. subdomain
        |
R2 bucket "aigoalie-archive" (S3 API; endpoint is the NON-.eu variant:
  https://e78c26794684d0fa994fe1ba939d7468.r2.cloudflarestorage.com)
  Keys: fixtures/YYYY/MM/{slug}.json, sitemaps/fixtures-YYYY-MM.xml,
        stats/summary.json, standings/{season}/{league}.json, team-form/{tag}.json
  rclone remote "r2" configured; single-bucket token needs --s3-no-check-bucket
        |
Google Cloud Run — Pro API (aigoalie-pro-...europe-west1.run.app)
  serves /me, /pricing, /pro/day, /pro/day/full, /billing-portal, /csv-url
  reads pro-day JSON from GCS. Auth via Firebase. Stripe for subscriptions.
```

**Slug convention (PERMANENT):** `2026-06-13-colo-colo-vs-cobresal`
(date-first, lowercase ASCII, hyphenated). Worker route: `ai-goalie.com/match*`.

---

## 4. Pipeline flow (auto-script.py -> html_generation.py)

Per iteration: fetch fixtures via API-FOOTBALL (today..+7) -> bridge TM ids to
api ids -> predict -> enrich -> build games list -> merge enrichment -> persist.

Key call sequence in html_generation.py (~line 262+):
```python
games = dedupe_games_based_on_odds(games)
from enrich_merge import merge_enrichment_into_games
merge_enrichment_into_games(games)          # stamps fixture enrichment onto games
# ... pickle dump games.pkl ...
from archive_persistence import add_slugs, persist_games, write_fixture_sitemaps
from stats_aggregation import build_summary
add_slugs(games)                            # adds g['slug'] for /match links
new_data_push(games, database)
persist_games(games)                        # writes archive + R2 (incremental)
write_fixture_sitemaps()
build_summary()                             # stats/summary.json
# (team_model_form.build_team_form() SHOULD be wired here too — verify)
```
auto-script.py also calls generate_sitemaps + build_results_page before
commit_and_push (deploy).

**CRITICAL GOTCHAS (these have each bitten, repeatedly):**
- **Env vars vanish on reboot/relogin.** R2_*, API_FOOTBALL_KEY,
  CLOUDFLARE_API_TOKEN live in /etc/environment but tmux loops launched without
  sourcing it lack them. A systemd unit (aigoalie.service, EnvironmentFile=
  /etc/aigoalie.env, Restart=always) is WRITTEN but may not be installed yet —
  install it to end this class of bug. There have been 4+ env-var incidents.
- **Incremental persist only writes CHANGED records.** Null enrichment in =
  "unchanged" = never written. If enrichment looks missing, the field is null
  upstream OR boto3 wasn't installed OR R2 env vars absent in the running loop.
- **boto3 must be pip-installed in venv2** or every R2 write silently fails
  with "BACKEND FAILURE". (Installed 2026-06-13.)
- **Enrichment is FORWARD-ONLY.** Backfilled records stay bare; fields fill in
  as the pipeline re-touches upcoming fixtures. To force R2 current immediately:
  `rclone copy archive/fixtures/ r2:aigoalie-archive/fixtures/ --s3-no-check-bucket -P`
- **Enrichment STICKINESS (fixed 2026-06-13):** enrich_merge only matches
  fixtures in the current fixtures_*.json (+7 window). When a match passed out
  of window and got re-persisted (e.g. on grading), it was rewritten BARE,
  losing logo/venue/standings — which hurt graded pages (the prime citation
  asset). Fixed: persist_record now calls _preserve_enrichment(rec, old) to
  carry forward enrichment the prior record had. Records already gone bare
  (e.g. 13 Jun) do NOT self-heal — the data's gone. Forward fixtures stay rich.
- **The games list is rebuilt from the history pickle**, so fixture enrichment
  must be re-merged each run via enrich_merge (join: fixture['date'] ==
  game['date_'], NOT game['date'] which is display-format; TM-id fallback).
- **Two fixture-builder functions** exist; get_upcoming_fixtures_via_api (~1140)
  is the active one. get_upcoming_fixtures_new_window (~1296) is not.
- **API-FOOTBALL date windows can miss known fixture ids.** A live World Cup
  fixture (Ghana vs Panama, api_fixture_id 1489385) stayed stale because
  `/fixtures?date=2026-06-18` did not return it, while `/fixtures?id=1489385`
  did. Result refresh indexing must seed by stored `api_fixture_id` as well as
  by date; otherwise live `0:0` snapshots can freeze and never collect events or
  lineups.
- **Worker cache:** edge-cached; add ?v=N to bust after deploy. 15min upcoming
  / immutable graded TTL.
- **wrangler deploy** needs CLOUDFLARE_API_TOKEN (OAuth fails headless — no
  xdg-open). Use an "Edit Cloudflare Workers" token scoped to account + zone +
  Workers R2 Storage:Edit.
- **deploy.sh / git:** repo branch is **master** not main. Orphan-commit
  deploys were too slow (8.8k objects on a 2-core box) — switched to incremental
  add/commit/push. Don't reintroduce orphan commits.
- **API budget: 7500 req/day** (confirmed via API `/status` on 2026-06-17;
  status calls do not count). Normal pipeline usage was ~500/day by evening.
  Injuries should be batched via `injuries?ids=` (20 fixture ids/request), not
  fetched one fixture at a time. Standings are 1/league/day. H2H is cached per
  pairing in R2. Still avoid API calls that repeat every 20-25 min; daily-build
  cached enrichment is fine.

---

## 5. Real track-record numbers (from 29.8k graded predictions, Jan 2025–)

- Top call of the day: **82.3% won all-time** (n=266)
- Picks at >=60% confidence: **77.4% won** (n=2,542)
- Calibration is monotonic and UNDER-confident: displayed 50-59% -> won ~68%,
  60-74% -> ~76%, 75%+ -> ~88%
- 689 leagues, 134 publishable (n>=80)
These power results.html and the trust band. summary.json regenerates nightly.

---

## 6. Deliverables / files (in /home/aigoalie-monetized/ unless noted)

Pipeline/backend:
- `archive_persistence.py` (v3) — per-fixture JSON, slugs, form extraction,
  grade-transition CF purge, fixture sitemaps, incremental persist, R2/GCS/local
- `sitemap_gen.py` — sitemap-index + day sitemaps + fixture-sitemap refs
- `stats_aggregation.py` — nightly summary.json
- `results_page.py` — static results.html from summary.json (zero JS, JSON-LD)
- `team_model_form.py` — per-team "model form" -> team-form/{tag}.json in R2
- `api_enrichment.py` — standings (ON) + H2H (OFF, capped, R2-cached)
- `enrich_merge.py` — stamps fixture enrichment onto games before persist
- `deploy.sh` — incremental git push to master
- `robots.txt`, `llms.txt`

Worker (worker/ dir):
- `worker.mjs` — renders /match/* from R2: gauge, verdict, preview prose,
  JSON-LD, logos (api-football CDN, fallback new_logos), venue/city/referee,
  league flag, injuries (Team news), standings (League position), H2H,
  per-team model-form chips. Serves /match-sitemaps/* from R2.
- `wrangler.toml` — name aigoalie-match-pages, R2 binding ARCHIVE, route /match*

Redesign (NOT yet integrated — high risk, deferred):
- `vis_gp_redesign.html`, `styles_redesign.css`, `aigoalie_cards.js` —
  broadcast/scoreboard card redesign for the main day pages. Integration is a
  2-line loader edit + template swap; staged approach: CSS+JS additive first,
  one test day-page, then rollout. Flip results/match Pro CTA to /?pro=1 + add
  deep-link handler when done.

Ops:
- `aigoalie.service` — systemd unit (install pending)

---

## 7. Pricing / Pro (decided, partially done)

- Removing 7-day free trial -> **$0.99 first month** via Stripe coupon
  "firstpurchase" (80% off, duration: once). Rationale: trial saved cards
  without charging -> dead cards failed only at conversion. Upfront charge
  validates card + triggers SCA at signup. Coupon CREATED.
- Stripe Smart Retries + dunning + card updater + wallets: ENABLED.
- Do NOT raise base price to 9.99 yet — change one variable at a time; raise
  only when Pro analytics depth ships, and via a NEW Price (grandfather existing
  subs).
- Pro value reframe: public results.html = free acquisition asset. Pro sells
  DEPTH — per-league calibration explorer, confidence filters, per-match
  explainability, CSV export, value-bet screener. (BUILD pending.)

---

## 8. Status board

DONE & LIVE:
- Phase 0: archive persistence, sitemaps, results.html, repo-growth fix
- Phase 1: Cloudflare CDN + R2 substrate
- Phase 2: /match/* fixture pages, indexable, World Cup included
- Match-page enrichment: logos, venue, city, referee, league flag, injuries,
  standings, H2H scaffolding
- Per-team model-form chips
- 3 production fires fixed: API-quota outage, affiliate crash, missing WC
  fixtures (national-team bridge — bridge_national_teams.py, 42 mappings)

IN PROGRESS / OPEN:
- **Day-page v12 revamp** (active): true prototype-shell preview rendered to
  `preview_day_page_v12_true.html` from `vis_gp_v12.html`: no banner/legacy nav,
  v12 responsive navbar, real data, required data/pro hooks, graded result
  markers/detail tiles, card expansion, Pro modal/pricing table, account
  dropdown, and search wiring verified on localhost:8768. `html_generation.py`
  now has a QA-only path gated by `AIGOALIE_DAYPAGE_V12_QA=1` that emits
  `{date}-v12.html`, `{date}-v12-{lang}.html`, `index-v12.html`, and
  `index-v12-{lang}.html` without replacing production `{date}.html`/
  `index.html`; v12 day navigation/language switching stays inside these suffix
  URLs. It also prepares v12-only `outcome_code` and `goal_band` fields.
  2026-06-14 live-QA fixes: v12 pages now use exact target-date matches in the
  normal production render path too (not legacy +/-1 timezone-expanded global
  matches), render actual hidden Pro values from `pro_home_xg`, `pro_away_xg`,
  `pro_opp_iso`, computed `pro_btts`, and hide Pro tags when `/me` reports Pro.
  `github_job.py` deploy allowlist includes v12 suffix files only when the QA env
  flag is set. Syntax checked via Jinja template load and
  `python3 -m py_compile html_generation.py github_job.py`; real-data template
  render smoked against `games.pkl`. NEXT: rerun generation/deploy with the
  renamed v12 template and verify exact-date counts live.
- 2026-06-15 contextual accuracy: `model_context.py` builds
  `model_context.json` from graded history with confidence-bucket, league, and
  picked-team accuracy stats. `html_generation.py` now builds this during the
  normal pipeline and attaches stats to v12 cards. Expanded day-page cards show
  public "Similar confidence" accuracy plus Pro-locked "This league" and
  "Picked team" chips using the existing `.pro.locked` unlock path. Deployed via
  pipeline commit `ba13d3bb11`; verified `site/AI-Goalie/index.html` contains
  the new chip markup.
- 2026-06-15 follow-up: day-page and Worker wording now uses "Opponent
  strength" instead of "Opponent threat/scoring chance". Day-page xG is merged
  into one "Expected goals (per team)" tile while preserving `.pro-xgh` and
  `.pro-xga`. `model_context.json` is deployed to GitHub Pages and the Worker
  fetches/caches it to render fixture-page contextual accuracy chips. League
  view headers now show Pro-locked "League accuracy" chips when enough graded
  history exists. Worker deploy version `fd0d2b8c-c7de-44db-9761-6e893e08fa24`;
  Pages deploy `0b8f9f8833`.
- 2026-06-15 follow-up 2: league-header accuracy now uses only picks at
  displayed confidence >=50% (`leagues_conf50` in `model_context.json`) and is
  labeled "League accuracy ≥50%". Fixture-page league tables use a mobile
  horizontal scroll wrapper; `results.html` wraps only the calibration table in
  the same mobile-safe scroller. Worker deploy
  `f902955c-41e7-4da9-8e48-155f68448ca8`; Pages deploy `391859e216`.
- 2026-06-15 follow-up 3: expanded day cards now have one compact goals row
  (xG per team, total goals, BTTS), then a labeled "Model accuracy history" row.
  Visible opponent-strength and full-size odds tiles were removed; `.pro-opp`
  remains as a hidden compatibility hook and odds are shown as a small CTA-adjacent
  chip. League headers fall back from "League accuracy ≥50%" to "League accuracy
  all picks" when high-confidence sample size is unavailable. Pages deploy
  `4515d81bfe`.
- 2026-06-15 follow-up 4: day-page accuracy cards are now compact enough to sit
  in one mobile row, with shortened labels ("Confidence", "League", "Picked
  team") to avoid redundant wording under the "Model accuracy history" section
  header. Pages deploy `d86e638079`.
- 2026-06-15 follow-up 5: removed the expanded-card graded summary row
  ("Missed/Correct · Pick ... · confidence") because the row-level result marker
  and score already carry that information. Fixture Worker accuracy history now
  uses the same compact "Model accuracy history" section and short labels as day
  pages. Worker version `c12fa690-353b-4145-a9fc-dc998569588a`; Pages deploy
  `ed3c96f34f`.
- 2026-06-16 analytics follow-up: added safe Umami custom events for key product
  actions: day-page Pro clicks, card expands, search, view toggle, sort toggle,
  day navigation, language changes, CSV attempts/success/blocks, matchup teaser
  clicks, fixture-link clicks, simulator runs/errors/limit hits, simulator Pro
  CTAs, fixture-page Pro CTA/sign-in/unlock. Worker version
  `fc70b243-ff5c-45a8-9ca1-d658cdbc4139`; Pages deploy `46dd88140d`.
- 2026-06-16 mobile polish: league-view headers now use a mobile grid layout
  (flag/title/count top row, compact "Accuracy" chip underneath) so long league
  names and match counts no longer squeeze off-screen. Pages deploy
  `c42926d53f`.
- 2026-06-17 fixture enrichment v1 (local, not deployed at handoff): API docs
  confirmed `injuries?ids=` and `fixtures?ids=` support 20 fixture ids/request.
  `universal_scraping.py` now batches fixture injuries, extracts embedded
  fixture events/lineups/status from API fixture payloads, and syncs last-known
  lineups during daily build/result refresh. `api_enrichment.py` now defaults
  H2H on with orientation-safe cached summaries, caches last-known lineups in
  R2, and fetches/caches current coaches with coach-change risk flags.
  `archive_persistence.py` and `enrich_merge.py` carry API ids, events, lineups,
  coaches, coach risks, and API status into fixture JSON. `team_model_form.py`
  now includes recent match rows (score, teams, slug, model pick) for fixture
  pages. `worker/worker.mjs` renders Match events, Coach context, Lineups, and
  Recent matches sections. Local preview generated at
  `fixture_page_enrichment_preview.html` plus screenshots
  `fixture_preview_desktop_top.png`, `fixture_preview_desktop_lower.png`,
  `fixture_preview_desktop_recent.png`, `fixture_preview_mobile_top.png`.
  Checks passed: `python3 -m py_compile universal_scraping.py api_enrichment.py
  archive_persistence.py enrich_merge.py team_model_form.py` and bundled Node
  `--check worker/worker.mjs`. Needs live pipeline smoke/deploy before prod.
- 2026-06-17 fixture enrichment UI refinement (local, not deployed): moved
  goalscorers/key events into the main scoreline area under team logos/names,
  removed the separate "Match events" card, combined coach context + lineups +
  injuries under "Lineups & team news", suppressed empty absence copy unless
  reported absences exist, changed Recent matches score colors to reflect the
  team's result (separate small model ✓/✗ badge for model correctness), and
  expanded H2H into actual result rows. Updated preview screenshots:
  `fixture_preview_desktop_top.png`, `fixture_preview_desktop_lower.png`,
  `fixture_preview_desktop_h2h.png`.
- 2026-06-17 fixture enrichment UI final tweaks (local, not deployed): score
  pill width tightened again, `team_model_form.py` recent-call payload now
  includes `total_xg`, and Worker recent-match rows show five matches with
  model confidence plus predicted total goals. Model correctness marker was
  simplified to a small inline ✓/✕/= instead of a bulky badge.
- 2026-06-17 fixture enrichment UI final tweak 2 (local, not deployed): recent
  match rows no longer show dates and no longer show any model ✓/✕/= marker;
  they only show pick, confidence, and predicted total goals. Worker Pro upsell
  copy moved directly below the locked prediction tiles and above the prose.
- 2026-06-14 static/results follow-up: `html_generation.py` explicitly renders
  `contact_v12.html` -> `contact.html` and `disclaimer_v12.html` ->
  `disclaimer.html`, bypassing the old `_tmp` static templates. `results_page.py`
  now uses the same v12 header/nav/footer shell and Umami script as the main and
  static pages. `github_job.py` now includes `v12_static.css` in the deployed
  asset list. Syntax checked with `python3 -m py_compile html_generation.py
  results_page.py github_job.py`; local results render skipped because
  `archive/stats/summary.json` was not present in this workspace.
- 2026-06-14 follow-up: Language selector uses emoji flags instead of missing
  `new_logos/*` flag images. Added `contact_v12.html`, `disclaimer_v12.html`,
  and shared `v12_static.css`; both static pages use the v12 shell/no banner and
  were browser-checked on localhost:8768. Navbar/static page hrefs intentionally
  remain on production targets for now.
- **Match-page polish** (active): (1) chip rows restyled + relocated to own
  section in worker.mjs — DEPLOY PENDING successful wrangler deploy (token auth
  was failing; needs fresh "Edit Workers" token in CLOUDFLARE_API_TOKEN).
  (2) Logos NOT broken — fallback working: enriched records use api CDN, bare
  ones fall back to new_logos webp. (3) Enrichment stickiness FIXED (see
  gotchas). (4) NEXT: layout idea — put rank + recent-results form (from
  standings 'form' field) under each team crest in the scoreline, retire the
  separate League-position card. Keep model-form chips as their own section.
- 2026-06-18 fixture enrichment/result refresh fix: Worker version
  `6bfb5ab7-cc72-435a-881e-234aec07d745` is live with scoreline events, combined
  `Lineups & team news`, five-match recent form rows, expanded H2H rows, and the
  Pro upsell relocated under locked tiles. `universal_scraping.py` now builds
  its API fixture index from both date windows and explicit stored
  `api_fixture_id`s, fixing the World Cup case where lineups/events existed via
  `/fixtures?id=...` but were absent from `/fixtures?date=...`. Ghana vs Panama
  was manually repaired in local archive + R2 to `1:0` FT with 4 events and both
  lineups. Remaining minor issue: manual repair did not recompute grading
  verdict text, so that fixture can still show inconsistent `Draw — 1:0` until
  the normal grading path rewrites the outcome.
- 2026-06-18 recent-score display fix: Worker version
  `dfe1c5d9-5106-4503-bd1c-5ecf748e66ad` strips legacy score markup before
  rendering recent-match/H2H score chips, fixing visible escaped strings like
  `<strong>0:5</strong>` on fixture pages. Verified on Ghana vs Panama with
  cache buster `?v=scoreclean1`.
- 2026-06-18 fixture events/lineups fallback: Worker version
  `485e698f-68d8-40ba-b42c-d481078c0d80` removes non-goal key events from the
  scoreline, so fixture headers show only goal scorers. `universal_scraping.py`
  now also refreshes plain-score fixtures that are missing post-match
  enrichment, and `_attach_api_fixture_extras()` falls back to dedicated
  `/fixtures/events` and `/fixtures/lineups` endpoints when embedded fixture
  arrays are empty. This fixed Uzbekistan vs Colombia: archive/R2 now has `1:3`
  FT, 4 goal events, and both lineups. `matchup.html` free quota changed from
  3/10 to 1 simulation per browser/day for all non-Pro users; published to
  GitHub Pages commit `8d41653586`. Pipeline tmux was restarted to load the new
  Python code.
- 2026-06-18 API fallback hotfix: the post-match `/fixtures/events` and
  `/fixtures/lineups` fallback was too broad and ran concurrently across many
  completed fixtures, triggering API-FOOTBALL rate-limit sleeps. The production
  loop was stopped. `universal_scraping.py` now disables this fallback by
  default (`AIGOALIE_POSTMATCH_FALLBACK_ENABLED=0` unless explicitly set) and
  also limits fallback eligibility to World Cup fixtures by default when enabled
  (`AIGOALIE_POSTMATCH_FALLBACK_WORLD_CUP_ONLY=1`). Use one-off repair scripts
  for important fixture pages instead of enabling broad loop fallback.
- 2026-06-18 controlled match-details enrichment: replaced the broad threaded
  fallback approach with `enrich_match_details_sequential()` in
  `universal_scraping.py`, run after threaded score/status refresh and before
  `sync_lineup_cache()`. It fetches `/fixtures/events` for live/finished matches
  and `/fixtures/lineups` for fixtures from 75 minutes before kickoff through
  240 minutes after kickoff, until confirmed lineups are cached. Defaults:
  `AIGOALIE_MATCH_DETAILS_ENABLED=1`, `AIGOALIE_EVENTS_CAP_PER_RUN=80`,
  `AIGOALIE_LINEUPS_CAP_PER_RUN=80`. Detail fetches use a no-sleep one-shot
  helper on endpoint rate limits, so the loop skips the current detail call
  instead of sleeping 90 seconds in multiple workers. Production loop restarted
  at 2026-06-18 08:35 UTC to load this code.
- 2026-06-18 Worker cache TTL fix: graded fixture pages were still using
  `public, max-age=86400, s-maxage=31536000, immutable`, so users could see
  stale no-events/no-lineups HTML even after R2 was repaired. Worker version
  `f4a6d96f-5bbd-4f02-8325-83ee5c9d8b40` changes graded fixture cache headers to
  `public, max-age=300, s-maxage=600`. Verified clean
  `/match/2026-06-18-uzbekistan-vs-colombia` now shows goal events and confirmed
  lineups without a cache-busting query.
- 2026-06-18 Worker navbar/ad parity fix: Worker version
  `4bbd65ee-192f-4901-b3c5-afe26929fa81` replaces the fixture-page custom
  `auth-mini` header with the same main-page structure: logo, mobile burger,
  nav links, green `Go Pro`, `accountBtn`, `accountDropdown`, `dd_signin`,
  `manageBilling`, and `dd_signout`. Worker auth JS now uses those selectors and
  hides ads only for Pro. Moneytizer slot `128244-6` is rendered near the top of
  fixture pages with CMP + gen/request script loading for anonymous/non-Pro
  users. Verified live fixture HTML has the unified header IDs and exactly one
  Moneytizer slot/script set.
- 2026-06-20 fixture recent-match sort fix: `team_model_form.py` now derives a
  normalized ISO `sort_date` from game dates before sorting team-call history,
  fixing recent-match payloads that were previously ordered lexicographically by
  display strings such as `Fri 19.06.26`. `worker/worker.mjs` defensively sorts
  recent team-form calls by `sort_date`/parsed date before rendering, and bumped
  `MATCH_PAGE_CACHE_VERSION` to `2026-06-20-recent-sort`. Worker version
  `badc50da-95d7-4e96-9783-ee34c4bc05b1` deployed. Rebuilt all local
  `archive/team-form/*.json` with `build_team_form(write_backends=False)` and
  bulk-copied them to R2 with high-parallelism `rclone copy`. Verified
  `unsorted_payloads 0` and live Ghana vs Panama recent rows render newest
  first.
- 2026-06-21 i18n/timezone/corners foundation: added `i18n/locales.json`,
  `i18n/routes.py`, and `i18n/messages/en.json` as proper locale/route
  scaffolding while preserving legacy `i18n/{lang}.json` fallbacks. Do NOT
  switch to clean URLs yet; current recommendation is to generate clean URLs in
  parallel later, add reciprocal `hreflang`, verify indexing, then redirect old
  `DD.MM.YYYY[-lang].html` URLs only after validation. `universal_scraping.py`
  now carries canonical `kickoff_utc`/`kickoff_date_utc` and silently collects
  fixture `corner_stats` from capped `fixtures/statistics` calls with
  `AIGOALIE_STATS_CAP_PER_RUN` cap. Day-page templates and Worker fixture pages
  render `data-kickoff-utc` and convert plain kick-off times client-side to the
  visitor's local timezone. Worker recent/H2H rows now align as
  `name logo · score · logo name`. Worker version
  `b9bb7abf-a8c8-48f0-937e-3f1e525b9b7d` deployed; production loop restarted.
  Note: first generated pages after this change should be checked for populated
  `kickoff_utc`; pre-existing `fixtures_*.json` files can still contain nulls.
- 2026-06-21 language-output rollback: the v12 day template is not fully
  localized yet, so generating legacy `DD.MM.YYYY-de.html` etc. created
  English/untranslated pages with localized `html lang` and titles. Fixed by
  setting only `en` enabled in `i18n/locales.json`, deleting 882 stale
  translated HTML files from `site/AI-Goalie` and deploying commit
  `114390dbee`. Public check: `/21.06.2026-de.html` returns 404 and
  `/21.06.2026.html` returns 200. Keep non-English disabled until v12 strings,
  URLs, `hreflang`, and QA are complete. `github_job.py` now also removes
  legacy localized suffix pages (`index-de.html`, `DD.MM.YYYY-de.html`,
  `DD.MM.YYYY-v12-de.html`, etc.) from both the build dir and GitHub Pages repo
  before every deploy so they cannot quietly reappear.
- 2026-06-21 clean-i18n scaffold follow-up: v12 day-page UI strings were moved
  behind `i18n/messages/en.json` `v12` keys and active templates use `ui.*`
  fallbacks instead of bare English literals for the main nav, buttons, cards,
  accuracy labels, CSV alerts, Pro copy, and empty states. Future language
  switching now points non-English selections at clean directory routes such as
  `/de/football-predictions/2026-06-21/`, not suffix pages. `html_generation.py`
  has an opt-in `AIGOALIE_I18N_CLEAN_URLS=1` path that writes
  `<lang>/football-predictions/YYYY-MM-DD/index.html`; default remains English
  only. `github_job.py` can deploy these nested clean pages only when the same
  env flag is enabled. Local and VPS validation confirmed enabled langs
  `['en']`, clean path helper `/de/football-predictions/2026-06-21/`, and zero
  legacy localized HTML files in both build and GitHub Pages repo dirs.
- 2026-06-21 navbar language selector follow-up: since non-English output is
  disabled until proper clean-route localization QA, the day-page navbar
  language selector is hidden whenever only one language is enabled. The
  selector remains in the templates behind `enabled_languages|length > 1`, so it
  will come back automatically once real translations are enabled.
- 2026-06-21 Japanese clean-URL QA path: added `i18n/messages/ja.json` and a
  QA-only renderer path. Keep `ja` disabled in `i18n/locales.json`; render it
  only with `AIGOALIE_I18N_CLEAN_URLS=1 AIGOALIE_I18N_QA_LANGS=ja`. Japanese QA
  pages are live at `/ja/football-predictions/YYYY-MM-DD/` plus `/ja/`, carry
  `<meta name="robots" content="noindex,follow">`, hide the navbar language
  selector with `languages=['ja']`, and keep auth/Pro/Umami wiring. Deployed
  Pages commit `14e5c6ab6d`; verified `/ja/football-predictions/2026-06-21/`
  returns 200 and `/21.06.2026-ja.html` returns 404. Do NOT add Japanese
  sitemap/hreflang or redirects until full translation/timezone QA is complete.
- 2026-06-21 Worker Japanese day-page QA: `worker/worker.mjs` now handles
  `/ja/` and `/ja/football-predictions/YYYY-MM-DD/` directly from R2 fixture
  records by listing `fixtures/YYYY/MM/YYYY-MM-DD-*`. `worker/wrangler.toml`
  adds route `ai-goalie.com/ja/*`. This is the intended scalable path for
  localization; it avoids generating many GitHub Pages HTML files. The page is
  still `noindex,follow`, uses Japanese shell copy, keeps Firebase auth/Pro
  checks, Moneytizer ads, Umami, and Pro-day unlock calls, and leaves legacy
  suffix URLs 404. Worker version `470fdc3e-e3de-417c-a0f4-9a804d7201ea`
  deployed; verified `/ja/` 302s to Tokyo-local today and
  `/ja/football-predictions/2026-06-21/` returns `x-aig-page: ja-day-worker`.
- 2026-06-21 Worker Japanese local-day cleanup: static Japanese GitHub Pages
  files from the first QA pass were deleted from `site/AI-Goalie/ja` and pushed
  in Pages commit `1f74d6e87b`, so `/ja/*` is Worker-only now. The Worker
  Japanese day route now lists adjacent R2 fixture date prefixes and filters by
  `kickoff_utc` converted to `Asia/Tokyo`, falling back to slug date only when
  `kickoff_utc` is missing. This means Japanese day pages are intended to show
  matches happening on that Japan-local calendar day. Pro unlock JS requests
  adjacent backend dates too, because a Japan-local day can contain fixtures
  stored under the previous/next source date. Hotfix version
  `9e53aa84-e5b1-42ca-b7ed-131b4084f8c3` deployed after fixing an
  `isoDateInZone()` variable typo; verified `/ja/` 302, `/ja/.../2026-06-21/`
  200 with `x-aig-page: ja-day-worker`, repo `ja` entries = 0, and legacy
  `/21.06.2026-ja.html` remains 404.
- 2026-06-21 Worker Japanese visual-parity fix: the first R2-rendered Japanese
  day Worker used custom `.day-row`/`.day-hero` markup and visually diverged
  from English (wrong default feel, no exact v12 parity). Fixed by changing the
  `/ja/football-predictions/YYYY-MM-DD/` Worker route to fetch the canonical
  English `DD.MM.YYYY.html` page and transform only language/meta/URLs. This
  preserves the exact English day-page HTML/CSS/JS structure: global view
  visible by default, league view hidden, World Cup highlight first,
  `.daybar`, `.matchup-teaser`, `.toolbar`, `.wc-section`, `.all-section`,
  `.league-section`, and `.mrow` behavior. It still adds `lang="ja"` and
  `noindex,follow`. Worker version `cefeca62-0d9a-43f9-ac49-4cb5b077c1ad`
  deployed. Browser DOM check on `/ja/football-predictions/2026-06-21/`:
  `.wc-section` first, `#globalView=block`, `#leagueView=none`, `.mrow=164`,
  `.day-hero=0`, `.day-row=0`.
- 2026-06-21 Japanese Worker route expansion: removed visible language selector
  markup from the Japanese mirrored day page and bumped `JA_DAY_CACHE_VERSION`
  to `2026-06-21-ja-worker-mirror-v2`. Added Worker mirror routes for
  `/ja/results/`, `/ja/matchup/`, `/ja/contact/`, `/ja/about/`,
  `/ja/disclaimer/`, `/ja/privacy-policy/`, and `/ja/match/<slug>`. Day-page
  nav and fixture links now point to `/ja/...` routes; `/ja/match/<slug>`
  renders from the same R2 fixture record as `/match/<slug>`, then applies the
  Japanese shell transform. Verified all routes return 200, day pages have no
  `<select>`/`langSwitcher`, and fixture-page nav no longer points back to
  plain English `results.html`/`matchup.html`/`contact.html`. Current Worker
  version after absolute-href rewrite: `3f5afbe5-20dd-40a8-aa5a-de23d539b7eb`.
  Timezone note: kickoff times are converted client-side using the visitor's
  browser timezone via `Intl.DateTimeFormat(undefined, ...)`, not IP/GPS.
  Because `/ja` currently mirrors the canonical English date page for exact UX
  parity, match grouping is still canonical source date, not fully visitor-local
  date grouping. Full visitor-local day grouping requires rendering the exact
  v12 template from data rather than mirroring static HTML.
- 2026-06-21 fixture-page i18n (DEPLOYED, Worker version
  `8f54f154-3a02-4494-95d1-4bb99b3c9c00`): `/ja/match/<slug>` is now FULLY
  Japanese, rendered natively instead of regex-patching English HTML. Added a
  scalable per-language pack registry in `worker/worker.mjs`: `FX_EN` (English
  source of truth + default) and `FX_JA` (spreads `FX_EN`, overrides strings +
  href prefixes + `noindex`); add a language later = add a pack + a route. `page(rec, lang)`
  sets a module-level `ACTIVE_L` (safe: `page()` builds its string synchronously,
  no awaits) and all body helpers (contextAccuracyHTML, lineupsSection,
  lineupCard, lineupFor, coachRiskNotice, recentMatchesSection, recentMatchRows,
  h2hSection, pickOddsLabel) read the active pack via `L()`. Dynamic prose has a
  native JA generator `previewJa()`/`formSummaryJa()` mirroring `preview()`.
  `/ja/match` route now calls `page(rec, "ja")` directly (dropped the old
  `translateJapaneseShell(page(rec))` path for fixtures). Verified offline render
  (real Belgium-vs-Iran record): JA has zero English-body leaks, EN output
  unchanged except `Lineups & team news` header now renders `&amp;` (esc'd; same
  in-browser). Live checks pass: `/ja/match/...` Japanese incl. localized date +
  prose + `noindex` + `/ja/` canonical; `/match/...` still `lang=en` + English +
  correct canonical. KNOWN MINOR: fixture inline auth JS still has English
  aria-label/title tooltips ("Account", "Sign in", "Checking Pro…", "Kick-off in
  your local timezone") — not visible page text.
- 2026-06-21 static `/ja/*` body i18n (DEPLOYED): extended
  `translateJapaneseShell(html,title,desc,canonical,dict,regexes)` with per-page
  dictionaries applied in order: capture-group regexes (preserve live numbers) →
  page dict (exact substrings) → shared chrome → href rewrites. New consts:
  `STATIC_JA_ABOUT`, `STATIC_JA_CONTACT`, `STATIC_JA_MATCHUP` (full JA) and
  `STATIC_JA_RESULTS_DICT` + `STATIC_JA_RESULTS_REGEX`. `jaStaticRoutes` rows now
  carry `[src, canonical, title, desc, dict, regexes]`. DECISIONS (owner): legal
  pages `/ja/disclaimer/` + `/ja/privacy-policy/` KEEP their English body (dict=
  null → JA nav/chrome only); results + matchup FULL JA via worker dictionary.
  results.html is full of league names containing English words ("Premier
  League"), so short labels are matched as TAG-WRAPPED HTML (`<th>League</th>`,
  `<div class="l">…</div>`), never bare words; number-bearing prose (hero counts,
  under-confident calibration callout, n=… KPIs, "show all N leagues") uses
  capture-group regexes so daily-changing figures pass through. Also fixed a
  pre-existing footer bug where "Privacy Policy" became "プライバシー Policy"
  (added a "Privacy Policy" rule before "Privacy"). Offline residual-English test
  = 0 leaks on about/contact/matchup/results (league names intentionally kept).
  CAVEAT: matchup.html SIMULATOR RESULT text is rendered client-side by its JS
  ("win"/"draw"/probabilities); a worker HTML dictionary cannot reach it, so it
  stays English until matchup_page.py is source-localized.
- 2026-06-21 JA day-page next/prev nav FIX (DEPLOYED, Worker
  `0e046542-2f6c-4f49-b8aa-1a03e3dc11b9`, `JA_DAY_CACHE_VERSION` →
  `2026-06-21-ja-navfix-cleanurl`): ROOT CAUSE (an earlier "already fixed" claim
  this session was WRONG) — the DEPLOYED day-page template (older than local
  `vis_gp_v12.html`, which has `cleanDayPath`) builds day nav as legacy suffix
  URLs `` `${formattedDate}${QA_SUFFIX}-${lng}.html` `` and its
  `parseDateFromURL()` only reads a `DD.MM.YYYY` filename. When the mirror flips
  `lng` to `ja`, next/prev produced relative `…/2026-06-21/22.06.2026-ja.html`,
  and the date parsed as "today" (no filename on the clean route). FIX:
  `mirroredJapaneseDayPage` appends an override `<script>` before `</body>` that
  redefines the GLOBAL `parseDateFromURL`/`navigateToDate`/`adjustDate`/
  `switchLang` (global because also called from inline `onclick=`) to read the ISO
  date from the path and navigate to clean `/ja/football-predictions/<iso>/`.
  Verified live + node-simulated (next/prev → 2026-06-22 / 2026-06-20). PROPER
  LONG-TERM FIX: regenerate day pages from the newer local template (cleanDayPath)
  so the mirror needs no JS override.
- 2026-06-21 JA day-label fix (DEPLOYED, `JA_DAY_CACHE_VERSION` →
  `2026-06-21-ja-daylabel-v2`): the daybar `.day` + `seo-h1` showed English
  ("Tomorrow", "Tue 23 June") because the English page renders them server-side.
  `mirroredJapaneseDayPage` now OVERRIDES both uniformly from the route ISO date
  via `jaDayLabel(iso)` → 今日/明日/昨日 relative to Tokyo today (`tokyoIsoDate()`),
  else `M月D日（曜）`. Dropped the old frozen `<div class="day">Today</div>`→今日
  rule (it was generation-date-relative and conflicted). NOTE: labels are now
  VISITOR-today-relative (Tokyo), which is more correct than the English pages'
  generation-date-relative labels (those go stale). data-date="Tue. 23 Jun."
  attributes are left English (JS filtering keys off them). Verified across
  06-21..06-24: 昨日/今日/明日/6月24日（水）, daybar and H1 agree.
- 2026-06-21 JA discoverability infra (DEPLOYED but INERT, Worker
  `20b5d48e-5f1b-4a1f-b818-d849b62dead4`): added a SINGLE switch
  `const JA_INDEXABLE = false;` at the top of `worker/worker.mjs`. While false,
  ALL `/ja/*` pages stay `noindex` and emit no hreflang (current behaviour,
  verified live unchanged); the `/ja/match-sitemaps/*` route 404s. Flip to true to
  make JA indexable. Wired: (1) FIXTURE pages — `page()` emits reciprocal
  en/ja/x-default hreflang on BOTH the EN `/match/<slug>` and JA `/ja/match/<slug>`
  renders, and drops the JA noindex; these are FULLY worker-owned so fixture pages
  are 100% flip-ready with NO pipeline change (this is the citation asset). (2) JA
  day pages (`mirroredJapaneseDayPage`) + static pages (`translateJapaneseShell`,
  now takes `enHref`) gate noindex on the flag and add JA-side hreflang. LEGAL
  pages (`/ja/disclaimer/`, `/ja/privacy-policy/`) pass `indexable=false` →
  stay noindex even after the flip (their body is English). (3) `/ja/match-sitemaps/*`
  serves the EN R2 fixture sitemaps rewritten to `/ja/match/` URLs (gated on the
  flag). PIPELINE-SIDE COMPLEMENT still needed before/at flip for full
  bidirectional hreflang on the GitHub Pages surface: add reciprocal hreflang to
  EN day pages (`html_generation.py`), EN results (`results_page.py`), homepage;
  add a `Sitemap:` line for the JA sitemap to `robots.txt` and reference
  `/ja/match-sitemaps/` from the sitemap index (`sitemap_gen.py`). RECOMMENDED
  FLIP SEQUENCE: fixtures first (already self-sufficient) → monitor → then day/
  results once the pipeline-side hreflang ships. The flip itself is owner-gated
  (SEO-sensitive given the site's helpful-content demotion history).
- 2026-06-21 JA discoverability — PIPELINE side (in place, INERT): added the
  parallel pipeline switch `JA_HREFLANG_ENABLED = False` in `i18n/routes.py` +
  helper `ja_hreflang_block(en_url, ja_url)` (returns "" while off). IMPORTANT:
  this is deliberately SEPARATE from `locales.json` `enabled` — enabling `ja`
  there would trigger JA *HTML generation* (the 882-file incident); our JA pages
  are worker-served, so we only emit hreflang pointing at the worker URLs. Wired:
  `html_generation.py` passes `hreflang_block` into the EN day-page context
  (`{BASE_URL}/{date}.html` <-> `{BASE_URL}/ja/football-predictions/{iso}/`) and
  the homepage/index context (`/` <-> `/ja/`); `vis_gp.html` head emits
  `{{ hreflang_block|safe }}`. `results_page.py` emits hreflang after its canonical
  (`/results.html` <-> `/ja/results/`). `sitemap_gen.py` appends `ja/match-sitemaps/*`
  to the sitemap index when the flag is on. Verified: py_compile + runtime imports
  OK, `vis_gp.html` parses, helper off="" / on=en+ja+x-default. Files byte-synced
  local<->VPS. NOTE: prod day pages use a CONDITIONAL `{% if noindex %}` (not set
  in prod => indexable); results.html is indexable; fixture pages are worker-served.
  robots.txt currently points at `sitemap.xml` (generator writes
  `sitemap-index.xml` — pre-existing mismatch, left alone).
  FULL FLIP CHECKLIST (owner-approved, do together): (1) worker
  `JA_INDEXABLE = true` + redeploy; (2) `i18n/routes.py` `JA_HREFLANG_ENABLED =
  True` + sync to VPS; (3) let the pipeline regenerate day/results/sitemaps;
  (4) optionally fix the robots.txt sitemap reference; (5) submit in Search
  Console + monitor. Recommended: stage fixtures first (step 1 only), watch, then
  the rest.
- 2026-06-21 FOUNDATION REBUILD (multi-language + visitor-local-day grouping) —
  STARTED, staged. >>> FULL ARCHITECTURE, SCALING PLAYBOOK, STAGE CHECKBOXES +
  LIVE STATUS ARE IN `I18N_REBUILD.md` (repo root) — read/maintain THAT as the
  source of truth for this work; the summary below is a pointer. <<<
  DECISION: retire the fragile JA worker MIRROR; render every
  language from the ONE shared pipeline template (zero visual/feature divergence;
  add a language = add a message file), and add real visitor-local-day grouping to
  that shared template (correct for every language + timezone, not a JA hack).
  GROUNDING (verified in code): day pages currently ship EXACT-day matches only
  (`matches = exact_day_matches`, `day_dict = seperate_into_leagues(exact...)` at
  html_generation.py ~719-723); the ±1-day window IS already computed (`day`,
  ~634-639) but discarded. Cards render server-side as `.mrow` with `data-date`
  + `data-kickoff-utc` (vis_gp.html ~615-625); globalView/leagueView +
  wc/all/league sections. So local grouping = ship the window + client keeps only
  cards whose kickoff (visitor tz) lands on the page date, then rebuild counts/
  leagues. STAGES (each on a TEST page first, verify, then roll out — never
  one-shot the revenue surface): (1) local-day grouping engine [IN PROGRESS];
  (2) finish v12 template i18n — port the JA strings already written in the worker
  (FX_JA, STATIC_JA_*, day mirror replacements) into `i18n/messages/ja.json` —
  WITHOUT enabling `ja` in locales.json the old way (that triggered the 882-file
  HTML-gen incident); (3) generate JA from the template → retire the day mirror
  (`mirroredJapaneseDayPage`); (4) same for results/matchup → retire those mirrors;
  (5) flip indexing (infra already built: `JA_INDEXABLE` + `JA_HREFLANG_ENABLED`).
  STAGE 1 PROGRESS: `localtz_group.js` (repo root) — pure, side-effect-free
  grouping logic (`partitionByLocalDay`/`cardBelongsToLocalDay`/`localISODate`),
  authored standalone so it unit-tests in Node (TZ=...) and can be inlined into
  the template. Node test PASSED across Asia/Tokyo, UTC, Pacific/Honolulu (a
  22nd-23:00Z fixture → 23rd in Tokyo; a 22nd-02:00Z fixture → 21st in Honolulu;
  missing kickoff_utc falls back to source date). NEXT: (a) generator emits the
  window with each card's `kickoff_utc` + `srcISO`, gated by a new flag to a TEST
  filename (do not touch prod `{date}.html`); (b) inline `localtz_group.js` into
  the template + run it on load to hide non-local-day `.mrow`s and recompute
  league/global counts; (c) browser-verify search/league-global/CSV/openDefaultRows
  on the filtered set; (d) roll into production behind the flag.
- 2026-06-21 kickoff_utc backfill production hotfix: first live restart loaded
  the new `backfill_kickoff_utc()` but dirtied ~41k historical `games.pkl` rows,
  causing `persist_games` to write R2 for hours. Fixed live in
  `html_generation.py`: default backfill is now bounded to the active publish
  window (`today-3`..`today+10`), with full-history only via
  `AIGOALIE_KICKOFF_BACKFILL_ALL=1`; it also prunes historical
  `kickoff_utc`/`kickoff_date_utc` pollution outside that window before persist.
  Verified pipeline run: backfilled 349 active rows, pruned 40,610 historical
  rows, persisted in 1m38s (`graded`: 66, `upcoming`: 26, `unchanged`: 41,549),
  generated results/model context, and deployed successfully.
- 2026-06-21 visitor-local-day production rollout: Stage 1 is now LIVE. Other
  agent had already added the DOM prune and Pro re-render prune; final follow-up
  changed `AIGOALIE_LOCAL_GROUPING=1` from test-page-only behavior into the real
  production day-page switch. Active day pages now ship the ±1-day match window,
  then browser JS keeps only `.mrow`s whose `data-kickoff-utc` falls on the page
  date in the visitor's own timezone. Visible kickoff labels auto-convert to
  visitor-local `HH:MM` with timezone only in hover title; Worker fixture pages
  use the same rule. `AIGOALIE_LOCAL_GROUPING=1` was added to `/etc/environment`
  and the tmux loop was restarted with the flag. Pipeline deploy completed; live
  browser check on `/?v=localtz-final` showed `TARGET_ISO=2026-06-21`, 0 visible
  off-local-day rows, recomputed World Cup count, and no timezone suffix in
  visible kickoff labels. Worker version
  `911e8f88-1181-4033-a683-6eed3ebcb04e` deployed.
- 2026-06-21 JA day pages Stage 2/3 LIVE: Japanese day pages now come from the
  shared `vis_gp.html` pipeline template, not the fragile Worker HTML mirror.
  Env flags set in `/etc/environment` and tmux: `AIGOALIE_I18N_CLEAN_URLS=1`,
  `AIGOALIE_I18N_QA_LANGS=ja`, `AIGOALIE_LOCAL_GROUPING=1`. Generated/deployed
  `/ja/index.html` plus `/ja/football-predictions/{2026-06-19..2026-06-28}/index.html`.
  `worker/worker.mjs` now serves `/ja/football-predictions/<iso>/` from those
  static GitHub files via `staticJapaneseDayPage()` (`x-aig-page: ja-day-static`);
  `mirroredJapaneseDayPage()` is inactive legacy code. `vis_gp.html` now localizes
  remaining visible day labels (goal bands/confidence buckets) through
  `i18n/messages/ja.json`; JA nav/footer/teaser links stay in `/ja/...`, and
  fixture links use `/ja/match/<slug>`. Worker version
  `010b0bc1-d8e7-468d-9581-bddb12f13834` deployed. Live checks passed: no
  `-ja.html`, no English `/match/` fixture links, no legacy `.html` static links,
  no visible English day-label sources. `github_job.py` now skips the checked-out
  `site/` directory during clean-i18n deploy scans; accidental nested
  `site/AI-Goalie/site/...` artifacts were removed and pushed. Keep Worker route
  `/ja/*` for now because `/ja/results/`, `/ja/matchup/`, `/ja/contact/`,
  `/ja/about/`, and legal pages still use Worker static dictionaries until
  Stage 4 source-localizes them.
- 2026-06-21 Stage 4 (static-page source-localization) — DONE & LIVE (full detail
  in `I18N_REBUILD.md`). Pipeline restarted, JA static files generated+deployed;
  all four `/ja/{results,matchup,contact,about}/` verified `x-aig-page: ja-static`;
  matchup simulator JS result strings now render in JA (gap closed). Worker
  CLEANUP deployed `c9d32e94-e94c-48e0-91fe-231f9d66994d`: `STATIC_JA_*` dicts
  removed, route is static-first (falls back to EN-body mirror only if a static
  file is missing). `translateJapaneseShell`/`mirrorStaticJapanesePage` KEPT for
  legal pages (`/ja/disclaimer/`, `/ja/privacy-policy/` = JA nav + English body,
  verified HTTP 200). Only Stage 5 (flip indexing: `JA_INDEXABLE` +
  `JA_HREFLANG_ENABLED`, owner-gated, after native QA) remains.
  STAGE 6 SLICE A — DONE & LIVE 2026-06-22 (worker version
  `fbcaae68-282f-44ae-bd2f-e89515adf0f4`): the worker's four `ja`-hardcoded route
  blocks are now ONE generic `/<lang>/*` handler gated on `FX_PACKS[lang]`;
  `translateJapaneseShell`/`mirrorStaticJapanesePage`/`page()` hreflang+noindex are
  lang-parametrized; JA routing data (tz/pageMeta/legalChrome/hreflang) lives on
  `FX_JA`. Adding a language = add its `FX_<lang>` pack (+ static files); no route
  edits. VERIFIED live: JA byte-equivalent (results/about `ja-static`, disclaimer
  `ja-static-worker`, day `ja-day-static`, match `ja-match-worker`, `/ja/`→302→day
  page), EN regression clean, `/es/results/`→404 (inert until pack added). VPS
  backup `worker/worker.mjs.bak-20260622-081101`. STILL PENDING in A (optional):
  single-source FX-from-messages generation (packs are still hand-authored).
  STAGE 6 SLICE B (es) — DATA BUILT + WORKER LIVE 2026-06-22 (worker version
  `3dd3f6ea-cb14-4a87-abbc-2ac2fab794e3`): added `i18n/messages/es.json`, `FX_ES`
  + `previewEs()` in `worker.mjs`, `STATIC_I18N["es"]` in `static_localize.py`,
  `ai-goalie.com/es/*` route. Fixed a GENERAL bug (shared-chrome bare substring
  corrupted Latin words, e.g. `Contact`→`Contacto` breaking `Contactar`): now
  word-boundary anchored in both `static_localize.py` and the worker chrome loop;
  JA re-verified 0-leak. Then SLICE C (cutover) DONE 2026-06-22: persisted
  `AIGOALIE_I18N_QA_LANGS=ja,es` in `/etc/environment` + restarted the tmux
  `aigoalie` loop. NOTE: secrets load via `load_dotenv` from `.env`, so a plain
  `python auto-script.py` relaunch is safe — the API key is NOT in the shell env
  (`AIG_NO_KEY` in the shell is EXPECTED; load_dotenv injects it into the Python
  process). es is now FULLY LIVE at parity with ja (all noindex): `/es/`→today day
  page; `es-day-static` (Spanish, 0 leaks, nav→/es/, fixtures→/es/match/);
  `/es/results|about|contact|matchup` `es-static` (0 leaks); `/es/match/*`
  `es-match-worker`; legal es-nav+EN-body; bare `/es`→301→/es/. JA unchanged.
  REMAINING for es: native Spanish review → Stage-5 indexing flip.
  STAGE 5 (per-language indexing) — INFRA BUILT + VERIFIED, STAGED OFF in the
  LOCAL working copy (NOT yet synced/deployed to VPS) 2026-06-22. JA was reviewed
  (native speaker happy); owner chose "all JA at once". Replaced the global
  `JA_INDEXABLE`/`JA_HREFLANG_ENABLED` with PER-LANGUAGE indexability: worker
  `FX_<lang>.indexable` (langIndexable()/indexableNonEnLangs() drive robots +
  reciprocal hreflang + match-sitemaps gate) and pipeline `locales.json` `enabled`
  (i18n/routes.py `indexable_codes()` + `day_/index_/static_hreflang_block()`;
  per-lang noindex in html_generation day loop + generate_localized_static_pages;
  per-lang fixture sitemaps in sitemap_gen.py). Verified no-op while off + correct
  when flipped (ja-on → ja indexable + en↔ja hreflang, es STAYS noindex/excluded).
  DE/FR/PT(-BR) — BUILT + VERIFIED, STAGED LOCALLY (noindex, not yet synced/
  deployed) 2026-06-22: each cloned from the es template (messages/<lang>.json,
  FX_<lang>+preview<Lang> in worker.mjs, STATIC_I18N[<lang>] in static_localize.py,
  wrangler /<lang>/* route; all `indexable:false`/`enabled:false`). pt is Brazilian
  (htmlLang/hreflang `pt-BR`, tz America/Sao_Paulo, prefix /pt/). Sandbox-verified:
  json parity, 0-leak static localize (de keeps "Name" = identical in German),
  es/ja regression intact, worker node --check, FX_PACKS={en,ja,es,de,fr,pt},
  preview{De,Fr,Pt} correct + numbers kept, routing classifies all.
  GO-LIVE (owner-gated, when home + Search Console ready) — owner chose to INDEX JA
  AND ES, and bring DE/FR/PT online NOINDEX (for review), all in one deploy
  (es/de/fr/pt on MT): (1) worker `FX_JA.indexable:true` + `FX_ES.indexable:true`
  (de/fr/pt stay false); (2) locales.json ja+es `enabled:true` (de/fr/pt stay
  false); (3) `AIGOALIE_I18N_QA_LANGS=ja,es,de,fr,pt` in /etc/environment + export
  in the loop shell; (4) sync staged files to VPS (worker.mjs, wrangler.toml,
  i18n/routes.py, html_generation.py, results_page.py, sitemap_gen.py,
  i18n/static_localize.py, i18n/locales.json, i18n/messages/{de,fr,pt}.json);
  (5) `npx wrangler deploy`; (6) restart tmux `aigoalie` loop; (7) owner submits
  Search Console for ja+es. Verify ja+es no-noindex + en/ja/es hreflang; de/fr/pt
  resolve but noindex + not in hreflang/sitemap; legal pages noindex. Full runbook
  in `I18N_REBUILD.md` (Stage 5/6).
  NEXT: per-language native review of es/de/fr/pt; then flip each (its
  `FX_<lang>.indexable` + locales `enabled` → true, redeploy+regen, submit SC).
  ORIGINAL (pre-restart) detail below for reference: New scalable localizer `i18n/static_localize.py`: one
  `localize_static_html(html, lang, page)` + per-language `STATIC_I18N` registry
  (add a language = add one entry). Reuses the proven worker dicts/regexes AND
  adds the matchup simulator's client-rendered result strings (the gap the worker
  dict couldn't reach). `html_generation.generate_localized_static_pages()`
  (called from `auto-script.py` after `build_results_page`, before
  `commit_and_push`) reads each EN page (CWD or `site/AI-Goalie/`) and writes
  `<lang>/<page>/index.html`; `github_job.py` now deploys
  `<lang>/{results,matchup,contact,about}/index.html`. Worker DEPLOYED
  `22554491-1114-42e8-9a27-b8ea80ca7b7f`: `/ja/<page>/` serves the static repo
  file (`x-aig-page: ja-static`) with FALLBACK to the dict mirror until it exists
  (zero-risk, order-independent). Sandbox: all 4 JA pages generate with
  `<html lang="ja">` + JA text, 0 English leaks; EN is a byte-identical no-op;
  py_compile + fresh-import OK on live. AFTER the restart, verify
  `curl -sI https://ai-goalie.com/ja/results/ | grep x-aig-page` shows
  `ja-static` (also matchup/contact/about). THEN cleanup (safe follow-up): delete
  worker `STATIC_JA_*` + `translateJapaneseShell` + `mirrorStaticJapanesePage`
  (legal disclaimer/privacy stay worker-served, English body); route stays
  `/ja/*`.
- 2026-06-15 match-page Pro auth fix: `worker/worker.mjs` now waits for Firebase
  SDK readiness, explicitly sets Firebase Auth persistence to LOCAL, forces a
  fresh ID token before `/me`, improves Pro state labels, and routes signed-in
  non-Pro users to `/?pro=1` instead of re-opening Google sign-in. Also removed
  nested browser-template backticks from the inline script; syntax checked with
  bundled Node via `node --check worker/worker.mjs`.
- 2026-06-15 Moneytizer migration fix: v12 day-page templates restored the
  Moneytizer/InMobi CMP loader and a guarded `128244-6` ad slot. Ads load for
  anonymous/non-Pro users after Firebase auth state resolves; Pro users hide the
  ad slot. Jinja template load checked for `vis_gp_v12.html` and
  `day_page_v12_real_template.html`.
- 2026-06-15 Worker ads/schema/wording fix: `worker/worker.mjs` now includes
  Moneytizer/InMobi CMP + guarded `128244-6` ad slot, hides ads for Pro, always
  emits `location.address` in SportsEvent JSON-LD, renames "Opponent isolated"
  to "Opponent threat", and mentions ad-free as a Pro benefit. Deployed Worker
  version `c32132a8-2373-41ba-a41a-3acfb492d46d`. Day v12 templates also renamed
  the label and updated Pro modal copy; upload `vis_gp_v12.html` as prod
  `vis_gp.html` before next generation to publish those page changes.
- 2026-06-15 SEO hygiene pass: day v12 templates now have strategy-aligned
  titles/descriptions without "betting tips", favicon/apple-touch-icon markup,
  a hidden-but-crawlable H1 (`AI Football Predictions — {day}`), and descriptive
  alt text for crests/flags including Pro-injected cards. Worker match pages now
  have favicon markup, shorter match meta descriptions, and descriptive image
  alts. Contact/disclaimer/results also got favicon markup; results meta
  description was trimmed. Checks: Jinja load, `python3 -m py_compile
  results_page.py`, bundled `node --check worker/worker.mjs`, no `alt=""` in day
  v12/Worker, no "betting tips" in patched templates.
- 2026-06-15 metadata/copy finalization: day v12 title is now exactly
  `AIGoalie — AI Football Predictions with a Verified Track Record`; description
  is `AI-powered football predictions for 300+ leagues worldwide. Every pick is
  graded after full-time, so you can see our real accuracy. Today's matches,
  previews and analysis.` H1 remains dynamic:
  `AI Football Predictions — Today's Matches` for Today, otherwise the rendered
  date label. Active templates/generators were swept for "betting"/"betting
  tips"; legal/footer copy now uses financial/wagering/gambling wording instead.
- 2026-06-15 brand asset follow-up: restored compact logo in navs using
  `logo_mm.webp` (not the old wide banner) across day v12/static/results/Worker.
  Favicon markup now points to actual files: `/favicon.ico`,
  `/favicon-32x32.png`, `/favicon-16x16.png`, `/apple-touch-icon.png`; removed
  stale `/favicon.png` references. Checks passed for Jinja, results py_compile,
  and Worker `node --check`.
- 2026-06-15 opponent-threat follow-up: fixed day-page display bug where integer
  `pro_opp_iso=1` rendered as `100%`; day v12 now uses opponent-specific
  formatting (`<1` scales fractional probabilities, integer `1` stays `1%`) in
  both Jinja and JS-rendered Pro cards. Metric audit: `predict_new._iso_from_metric`
  clips weak opponent metrics to `1`, so current `pro_opp_iso` distribution is
  bottom-heavy (median 1%, 75th percentile 6%). Candidate replacement should be
  an upset/threat probability based on favourite-underdog metric gap rather than
  the underdog's absolute clipped iso score.
- 2026-06-17 World Cup xG audit/fix: `predict_new.py` now applies a narrow
  World Cup-only total-xG floor after the legacy `GoalProb` alignment so
  strong-favourite fixtures are not crushed by the old league-average goals
  heuristic. The team split is preserved; only low totals are raised. Strict
  graded backtest on `games.pkl` World Cup rows: all rows n=174, MAE 1.676 ->
  1.546, bias -1.066 -> -0.847, RMSE 2.181 -> 2.039; changed rows n=48, MAE
  1.884 -> 1.413. Current June 2026 simulation changed 18 rows, average total
  xG 1.55 -> 1.79, rows <=1.25 total xG 13 -> 4. Syntax check:
  `python3 -m py_compile predict_new.py`.
- 2026-06-17 xG calibration prototype: added `xg_calibration.py`, which extracts
  strictly graded rows from `games.pkl`, does chronological 70/30 holdout by
  league, fits simple bias/linear xG corrections, and writes
  `xg_calibration.json`. First pass showed most benefit comes from a global
  correction (`linear a=0.65 b=1.5968`, train_n=11382): evaluated holdout rows
  n=4866, baseline MAE 1.4562 -> global-linear MAE 1.3331. League-specific
  overrides are only accepted if they beat the global correction by >=2% on
  held-out MAE without RMSE worsening; only 16/96 evaluated leagues passed.
  Conclusion: if integrating, apply global xG calibration first and only then
  sparse league overrides from `xg_calibration.json`, not hundreds of bespoke
  formulas. Checks: `python3 -m py_compile xg_calibration.py predict_new.py`.
- 2026-06-17 hierarchical xG prototype: added `xg_hierarchical_calibration.py`,
  an approximation of mixed-effects calibration using walk-forward/no-leak
  updates. It first learns an online global linear layer, then applies shrunk
  league/team attack/team defense/recent residual effects. Backtest on
  `games.pkl`: 29,762 graded rows, 500-match warmup, 29,262 test predictions.
  Raw/global/hier MAE 1.4712 -> 1.3760 -> 1.3540; RMSE 1.9407 -> 1.7452 ->
  1.7325; bias -0.8015 -> +0.2314 -> +0.0141. Hierarchy beats the online global
  layer by +1.60% MAE and +0.73% RMSE, with better O/U 2.5 directional accuracy
  (raw/global/hier 54.84% -> 55.39% -> 57.31%). World Cup subset n=169: MAE
  1.687 -> 1.486 -> 1.478. Outputs:
  `xg_hierarchical_calibration.json` and
  `xg_hierarchical_backtest_predictions.json`. Not wired into production.
- 2026-06-17 xG calibration shape test: added `xg_calibration_shapes.py` to
  compare online global shapes before hierarchy. On the same 29,262 walk-forward
  test rows, raw MAE 1.4712. Global linear was too blunt/strong (MAE 1.3755,
  bias +0.2309, average xG 2.9516 vs actual 2.7207). Bias-only was MAE 1.3683.
  Binned shrinkage was better balanced (MAE 1.3501, RMSE 1.7335, bias +0.0133).
  Piecewise/bin-local correction was best global MAE (1.3468, RMSE 1.7338, bias
  -0.0244). Adding hierarchy on top of binned/piecewise did not improve MAE
  materially (bins global/hier 1.3509 -> 1.3546; piecewise 1.3475 -> 1.3553),
  though linear+hier remained useful. Recommendation: prefer binned/piecewise
  global calibration as the safer production candidate; only add hierarchy
  later if its residual layer is retuned to beat binned calibration.
- 2026-06-17 xG blend test: raw-to-piecewise blends were backtested because full
  piecewise looked aggressive at match level. Output files:
  `xg_piecewise_blend_summary.json` and `xg_piecewise_blend_examples.json`.
  Overall raw MAE 1.4712. Blend weights toward piecewise: 0.35 MAE 1.3876
  (avg xG 2.191, bias -0.5295), 0.50 MAE 1.3650 (avg 2.308, bias -0.4129),
  0.65 MAE 1.3500 (avg 2.424, bias -0.2963), best MAE around 0.85 with MAE
  1.3433 but likely visually/aggressively high. Full piecewise MAE 1.3468,
  avg 2.696, bias -0.0244. World Cup subset: raw MAE 1.6868, 0.50 blend MAE
  1.5294, full piecewise MAE 1.4863. Recommendation for first production
  trial: use a conservative 0.50 blend (`final = 0.5*raw + 0.5*piecewise`) if
  changing visible xG; it improves materially without pushing every low-xG game
  as hard as full piecewise.
- 2026-06-17 xG upstream-feature model test: added `xg_feature_calibration.py`
  using sklearn models with upstream features (`home_metric`, `away_metric`,
  metric gap, iso values, confidence, raw xG split, league/country, train-only
  league/team residual aggregates). Chronological split: train 20,833, test
  8,929 (2026-03-08..2026-06-14). Results: raw MAE 1.4684, piecewise
  walk-forward MAE 1.3457 (best), blend50 MAE 1.3622, ExtraTrees MAE 1.3696,
  RandomForest 1.3841, HistGB 1.3848, Ridge 1.3972. Feature models preserve
  more prediction spread than piecewise (HistGB std 0.763 vs raw 0.752 and
  piecewise 0.495) but do not beat piecewise MAE. Takeaway: upstream features
  help visual variance, but the current sklearn models are not production
  candidates yet; if used, HistGB/ExtraTrees are candidates for a displayed-xG
  blend, not a replacement.
- 2026-06-17 xG UX metrics: added `xg_ux_metrics.py` because MAE alone was the
  wrong product metric for displayed xG. It compares raw/blends/piecewise/sklearn
  models on spread, band entropy, predicted-band actual-goal separation,
  top-vs-bottom decile actual gap, O/U accuracy, and harmful overcorrection.
  On the 8,929-match holdout, Blend35 ranked best by the heuristic UX score:
  raw UX 4.681, Blend25 4.739, Blend35 4.805, Blend50 4.699, full piecewise
  4.545. Blend35 keeps useful spread (std 0.677 vs raw 0.779 and piecewise
  0.495), improves O/U 2.5 (0.562 vs raw 0.544), has better band separation
  (1.400 vs raw 1.295), and makes no >0.5-goal moves by construction in this
  setup. Recommendation for visible xG is now Blend35
  (`final = 0.65*raw + 0.35*piecewise`) rather than Blend50/full piecewise.
- 2026-06-17 league-average xG tuning: added `xg_league_avg_tuning.py` to proxy
  test the original goal-total formula with rolling prior team GF/GA and league
  average from `games.pkl`, grid-searching defense exponent alpha
  (0.75..1.75) and subtractor (0.5/0.75/1.0). Caveat: exact production
  recomputation is impossible from local files because the scraper team database
  is not persisted, so this is a walk-forward proxy. For France - Ligue 1,
  production raw xG in `games.pkl` was not actually uniform by prediction spread
  (std 0.8335, max band share 0.333) but had poor/negative band calibration.
  Proxy league-average variants were more uniform (best band-separation setting
  alpha=0.75/sub=0.5 had std 0.340, 59% of matches in medium band, no
  very-high predictions) and did not solve the UX issue. Conclusion: tuning the
  league-average exponent/subtractor alone is not a good visible-xG fix;
  preserve raw xG, optionally add narrow guardrails for pathological lows.
- 2026-06-15 navbar/CTA polish: main v12/static/results Pro buttons changed
  from yellow/star to green outline (`Go Pro`) to fit the product palette.
  Worker nav now mirrors the day-page nav/logo structure and bottom Pro upsell
  has stronger contrast with ad-free copy. Checks passed: Jinja template load
  for v12/static pages and bundled Node `--check worker/worker.mjs`.
- 2026-06-18 navbar/account polish: day pages, simulator, and Worker fixture
  pages now use a user account icon (`👤`) for the auth/account dropdown instead
  of swapping the visible label between `Sign in`, `Account`, and `Pro`. `Go Pro`
  remains the only visible Pro CTA. Worker match pages also received a
  `MATCH_PAGE_CACHE_VERSION` cache-key bump so fixture HTML updates are not held
  behind stale `caches.default` responses. Worker version
  `d78739ce-18b1-4d7a-9d1a-ca6ea70f86f6`; Pages deploy `7478f978d4`.
- 2026-06-18 lineup formation follow-up: Worker fixture pages now render
  confirmed/last-known lineups on a small pitch using API-FOOTBALL `grid`
  coordinates (`row:column`) and the supplied formation string, with the old
  compact XI list retained as fallback when coordinates are missing. Verified
  live on Uzbekistan vs Colombia (`3-4-2-1` vs `4-3-3`). Worker version
  `5abbba60-3cf2-48d1-9571-d6d2c0d516a1`. Follow-up centered each formation row
  onto a 12-column pitch so lone forwards/keepers no longer render
  left-aligned. Worker version `db371ed6-e3be-4758-bfb4-1a0f43091f4a`.
  Final centering tweak shifted the normalized grid half a cell left so
  one-player and odd-numbered rows sit visually on the true center line. Worker
  version `279371ab-442e-4abb-a295-acfd6a112674`.
- 2026-06-18 fixture-page content polish: removed the redundant `Match info`
  card from Worker fixture pages because league, kick-off, venue/referee, and
  odds are already presented in the page header/subheader. Recent matches and
  H2H rows now render in the day-page-style `team icon + team name | score |
  icon + team name` pattern. Current fixture teams use exact crests; H2H uses
  API-Football team IDs when present; recent form falls back to country flags
  for known national teams or a small football icon. Worker version
  `7122d828-857d-4914-a655-e568f09f6d4a`.
- 2026-06-19 SEO audit pass: `html_generation.py` now generates compact,
  unique day-page SEO titles/descriptions centrally via `day_seo_context()`.
  Titles use ISO dates and language markers, e.g.
  `AI Football Predictions SW - 2026-02-01 | AIGoalie`, keeping all day-page
  variants under 65 characters while avoiding the old translated "betting tips"
  wording. `vis_gp.html`/`vis_gp_v12.html` and
  `day_page_v12_real_template.html` consume `seo_title` and `seo_description`.
  `results_page.py` title was shortened. Added `seo_validation.py` to scan
  generated HTML for long/missing titles, missing descriptions, duplicate
  title/description groups, non-exact H1 counts, and legacy day URL warnings.
  Production sample render passed with 0 title/description/H1 violations and
  3 expected legacy URL warnings. URL restructuring was intentionally deferred.
- 2026-06-20 high-confidence miss audit: `games.pkl` graded rows n=30,421.
  High-confidence misses are rare at the top end: >=75% confidence was 9 misses
  in 223 graded calls (4.0% miss rate), >=70% was 91/1,305 (7.0%), >=60% was
  240/2,599 (9.2%). Strongest measurable risk signal is model/market
  disagreement: when model confidence >=70% but pick odds were >=1.8, miss rate
  rose to 30.2% (16 misses in 53) vs 7.0% baseline. A late-season/no-next-match
  proxy also mattered: domestic April/May high-confidence picks with no next
  known match within 21 days missed 25.9% at >=70% (7/27). Champions
  League/continental sandwiching was only a weak signal by itself (8.1% at
  >=70%), and low prior sample was not a broad problem (6.5% at >=70%).
  Recommendation: do not penalize all new teams or all congested fixtures; add
  conservative confidence/risk penalties for market disagreement and late-season
  motivation proxy, and surface continental sandwiching as a UI caution unless
  richer lineups/standings data confirms a stronger effect.
- 2026-06-20 confidence guardrails implemented: `predict_new.py` now applies
  post-prediction confidence subtractions before match serialization. If
  displayed confidence is >=60% and selected odds are >=1.8, subtract 10 points
  (`market_disagreement`). If displayed confidence is >=60%, fixture is a
  domestic league in April/May, and the picked team has no known future fixture
  in the current generated window, subtract 8 points (`late_season_motivation`).
  Both can stack. `max_cert` is converted from the adjusted confidence so
  top-call/ranking stats follow the displayed confidence; raw values are kept as
  `raw_total` and `raw_max_cert`, with `confidence_penalty` and
  `confidence_guardrails` for audit. `archive_persistence.py` persists those
  fields into fixture JSON. VPS helper test passed: 72% + odds 1.9 -> 62%;
  late-season -> 64%; both -> 54%; known future fixture suppresses late-season
  penalty. Pipeline was restarted in tmux `aigoalie` and was CPU-active during
  the next generation run at handoff.
- 2026-06-15 nav/auth follow-up: day-page About links now point to
  `about.html` (top nav + footer), static v12 pages use the same nav order
  (`Home`, `Track record`, `Contact`, `About`, ...), and Worker sign-in now
  uses Firebase redirect on mobile/coarse-pointer devices with popup fallback
  on desktop. Deployed Worker version `744917a3-a154-4d69-8090-08423c7ff2b1`.
- 2026-06-15 league/nav follow-up: day/Worker nav order now includes
  `Disclaimer` consistently (`Home`, `Track record`, `Contact`, `About`,
  `Disclaimer`, `API`). Day-page footer links now point to real
  `privacy-policy.html` / `disclaimer.html`. `html_generation.py` now builds
  `league_matches` from exact-day matches and populates `league_data.flag_url`
  from API enrichment or country-code fallback for v12 league headers. Remote
  venv checks passed; Worker version `cfaa1466-61e6-4391-ba33-c00b2dee7e55`.
- 2026-06-15 day-page expandability hint: v12 day templates now call
  `openDefaultRows()` after initial render/search/Pro API rendering so the first
  visible row in both Global and League views is expanded by default. This is
  intentional onboarding affordance for newcomers.
- 2026-06-15 matchup simulator v1: added `matchup_page.py`, generated
  `matchup.html` + `matchup_data.json`, and wired `build_matchup_assets()` into
  `html_generation.py`. Important: simulator now ships compact team features
  (`value`, `gf`, `ga`, recent `history`, `away_non_win`) and recalculates a
  hypothetical matchup formula client-side; it does NOT reuse a team's latest
  fixture-relative metric. Free quota is browser-local; Pro unlocks unlimited
  + advanced panel via existing Firebase `/me`. Published commit
  `1ee4004333`; Worker nav deployed version
  `2f90ca27-76d7-42d8-ae9d-c8f0af829d42`. At handoff, raw GitHub had
  `matchup.html` but `ai-goalie.com/matchup.html` still returned 404, likely
  GitHub Pages/Cloudflare propagation; recheck before linking hard in UX.
- 2026-06-15 matchup integration follow-up: simulator page now has visible
  auth/account state, Firebase `/me` Pro unlock, Umami, Moneytizer CMP/ad slot
  hidden for Pro, and Pro/free quota UI. Day-page templates and current generated
  day pages include a prominent `matchup-teaser` above the match toolbar.
  Published commits `69456d8b4b` (simulator UX) and `23fb7c1165` (day-page
  teaser). `ai-goalie.com/matchup.html` returns 200 via Worker fallback because
  old Cloudflare route `ai-goalie.com/match*` still intercepts `/matchup*`; the
  route should be manually removed in Cloudflare dashboard. At handoff, raw
  GitHub `index.html` had the teaser but the custom domain still served the
  previous Pages body despite fresh headers, so recheck after Pages/CDN settles.
- **systemd hardening** — `aigoalie.service` is now WRITTEN (repo root +
  /home/aigoalie-monetized/aigoalie.service): Type=simple, User=root,
  WorkingDirectory=/home/aigoalie-monetized,
  ExecStart=venv2/bin/python auto-script.py, Restart=always,
  EnvironmentFile=/etc/aigoalie.env, logs to aigoalie-service.log. NOT yet
  installed/started — installing a persistent root service + reading the live
  env (secrets) are both classifier-blocked for the agent, so the OWNER runs the
  install/cutover (2026-06-21). RUNBOOK (owner): (1) cp the unit to
  /etc/systemd/system/; (2) snapshot the live env into /etc/aigoalie.env from the
  RUNNING process — `tr '\0' '\n' < /proc/$(pgrep -f auto-script.py)/environ |
  grep -E '^(API_FOOTBALL_KEY|APISPORTS_KEY|API_FOOTBALL_BASE|CF_API_TOKEN|CF_ZONE_ID|CLOUDFLARE_API_TOKEN|R2_|GCS_|AIGOALIE_|ARCHIVE_DIR|PATH|HOME|LANG|LC_)=' > /etc/aigoalie.env; chmod 600`
  (this is the fragility-killer — bakes the known-good env incl. the API key whose
  persisted source was never pinned down); (3) `systemctl daemon-reload && enable`;
  (4) cutover — STOP the tmux loop first (never run both: double R2 writes + git
  conflicts), then `systemctl start`; verify aigoalie-service.log is fetching.
  boto3 now in venv.
- **Roll exposed credentials** — R2 secret + CF token were pasted in chat
  multiple times; roll and update /etc/environment + /etc/aigoalie.env.
- Wire build_team_form() into the nightly loop if not already.

NOT STARTED (the calmer feature work):
- Home-page / day-page redesign (the big conversion play; staged carefully).
  Match page should be unified into this design system at the same time.
- League hub pages (/league/...) — standings already cached in R2 to feed these.
- Pro analytics expansion + the $0.99 checkout wiring (small Cloud Run change).
- Methodology + author page — PINNED (owner not ready to be named / reveal
  Transfermarkt mechanism).
- PWA push, daily email, Telegram autopost (own-the-audience).
- H2H enable (set env vars once 1-3 proven stable).

DEFERRED:
- Rebuild the ML model (someday-maybe; explicitly not a priority).

---

## 9. How to work on this (conventions)

- Verify against real code/data before patching; this codebase has surprised us
  repeatedly (date formats, two fixture builders, env drift). Prefer a quick
  diagnostic command over a blind multi-file patch.
- Stage risky changes; never break the live revenue surface (vis_gp.html),
  especially during World Cup.
- Budget every new API call against ~250/day. Shared/cached > per-fixture.
- Keep stats honest — no cherry-picking. The trust asset is the strategy.
- After a substantive session, UPDATE THIS FILE: bump the date, move items
  between status sections, record any new gotcha discovered.




-----


# AIGoalie Day-Page Revamp — Codex Context & Handover

## Project Overview

AIGoalie is a football prediction website with a large legacy HTML/Jinja codebase.

The primary revenue-generating page is the daily prediction page generated from:

```text
vis_gp.html
```

This page currently renders prediction tables and contains years of accumulated functionality.

The goal of this project is NOT a complete rewrite.

The goal is to replace the visual match-list presentation with the newer card-based "Today View" design while preserving all existing business-critical functionality.

---

# Critical Rule

DO NOT redesign the site.

DO NOT redesign navigation.

DO NOT redesign monetization flows.

DO NOT redesign authentication.

ONLY replace the match-list presentation layer.

Everything else should continue to work exactly as before.

---

# Source Of Truth

## Visual Source Of Truth

The design that should be implemented is:

```text
day_page_prototype_v12.html
```

This file is the desired final appearance.

If there is any conflict between:

```text
day_page_prototype_v12.html
```

and

```text
vis_gp_redesign.html
styles_redesign.css
aigoalie_cards.js
```

then:

```text
day_page_prototype_v12.html
```

wins.

---

# Legacy Redesign Files

The following files are OLD:

```text
vis_gp_redesign.html
styles_redesign.css
aigoalie_cards.js
```

These were created before the current "Today View" design direction.

They should NOT be treated as the target design.

However they contain useful information about:

* Pro integration
* selector compatibility
* migration strategy
* card rendering ideas

Use them as reference only.

---

# Existing Production Architecture

Current production page:

```text
vis_gp.html
```

Characteristics:

* ~4000 lines
* Jinja template
* desktop DOM tree
* mobile DOM tree
* extensive embedded JavaScript

The page is highly coupled.

Many systems assume:

```html
<tr class="match">
```

exists.

This must be audited carefully.

---

# Business-Critical Systems

These MUST continue working.

## Authentication

Firebase authentication.

## Subscription

Stripe Pro subscription flow.

Includes:

```text
#proBox
#proBox_m
```

and all checkout logic.

## Pro Unlock System

This is revenue-critical.

Must remain functional.

Existing hooks include:

```text
.pro-xgh
.pro-xga
.pro-opp
.pro-btts
```

These selectors MUST remain available.

---

## Analytics

Keep:

```text
Umami
```

and related scripts.

---

## Consent

Keep:

```text
cookie consent
```

and related scripts.

---

## Search

Current search functionality must remain operational.

---

## CSV Export

Current export functionality must remain operational.

---

## League / Global Switching

Must continue working.

Current users rely heavily on:

```text
Global View
League View
```

---

## Language Switching

Must continue working.

---

## Account Dropdown

Must continue working.

---

# Navigation

Current navbar system should remain.

Files:

```text
navbar.html
navbar_global.html
navbar_m.html
```

Do not redesign navigation.

Do not replace it with the v12 prototype.

The v12 work starts BELOW the existing navigation.

---

# Mobile Strategy

Important:

Current architecture has:

```text
desktop tree
mobile tree
```

This duplication is ugly but intentional.

DO NOT attempt to collapse into a single responsive layout.

That is a future project.

For this revamp:

Maintain the two-tree architecture.

Apply changes to both.

---

# Pro Gating Policy

Current desired product positioning:

## Public

Show:

* Win %
* Confidence
* Total-goals band

Examples:

```text
Low scoring
Around 2-3 goals
High scoring
```

## Pro

Lock:

* home xG
* away xG
* BTTS
* advanced metrics

Use the same visual blur convention as the newer match pages.

Consistency with:

```text
/match/<slug>
```

is more important than experimentation.

---

# Match Page Consistency

The day page should visually feel like:

```text
/match/<slug>
```

Design language should be shared:

* cards
* spacing
* confidence colours
* green palette
* chips
* prediction presentation

The site should feel like one product.

---

# Data Attributes To Preserve

These are known integration points.

Cards must preserve:

```html
data-match-index
data-league
data-home
data-away
data-date
data-time
```

Do not remove them.

---

# Known Selector Risk

Audit code for assumptions such as:

```javascript
querySelectorAll("tr.match")
```

```javascript
row.cells[x]
```

```javascript
getElementsByTagName("tr")
```

These are likely breakpoints during migration.

Create a list of all occurrences.

---

# Migration Strategy

## Stage 1

Do NOT modify production.

Create:

```text
test_day_page_v12.html
```

or equivalent.

Use real generated data.

---

## Stage 2

Verify:

* search
* Pro unlock
* Stripe modal
* CSV export
* league/global switching
* desktop
* mobile

---

## Stage 3

Only after verification:

Switch generator output.

---

# Existing Match Pages

The site now has:

```text
/match/<slug>
```

served via Cloudflare Worker.

These pages already contain the newer design language.

Use them as visual reference.

However:

DO NOT modify the Worker.

This project is day-page only.

---

# Deployment Philosophy

The site currently receives significant traffic.

Especially around major tournaments.

Therefore:

* additive-first
* reversible changes
* small diffs
* test before rollout

Avoid large rewrites.

Avoid architecture changes.

Avoid "cleanups" unrelated to the migration.

---

# Desired Deliverables

1. Inventory of JS selectors that assume table rows.
2. Test-page integration using v12 design.
3. Minimal diff strategy for production rollout.
4. Explicit list of required JS compatibility changes.
5. Mobile integration plan.
6. Final production patch set.

---

# Explicit Non-Goals

Do NOT:

* rewrite authentication
* rewrite Stripe
* rewrite navigation
* merge desktop/mobile trees
* redesign static pages
* redesign homepage
* redesign match pages
* migrate frameworks
* convert to React/Vue/etc

Only migrate the day-page match list to the v12 design.

Keep everything else operational.

---

## 2026-06-23 Umami usage-limit mitigation

Umami Cloud hit the 100k free monthly event limit. Custom interaction events
are disabled for now, while the base Umami pageview script remains in place.
Sources patched:

* `vis_gp.html` — `trackEvent(...)` is a no-op.
* `worker/worker.mjs` — fixture and Worker day-page custom event calls are
  no-ops.
* `matchup_page.py` — generated simulator `trackEvent(...)` is a no-op.

Do not reintroduce high-volume custom events without sampling, allowlisting, or
self-hosted analytics.

---

## 2026-06-25 Pro data source-leak mitigation

Static day pages were embedding locked Pro values directly in HTML
(`.pro-xgh`, `.pro-xga`, `.pro-btts`, hidden `.pro-opp`, and Pro-locked
league/team accuracy cards). This meant anyone reading page source, including
LLMs/crawlers, could recover some Pro-only values.

Mitigation:

* `vis_gp.html` now renders static day-page Pro fields as locks only.
* Authenticated Pro users populate xG/BTTS/opponent-strength via
  `/pro/day/full` after Firebase auth.
* Current generated GitHub Pages HTML was sanitized and redeployed immediately.
* Worker fixture pages were already safer: they render locks in HTML and fetch
  Pro values through `/pro/day/full` with a Firebase bearer token.

Do not put Pro-only numerical values into static HTML, `data-*` attributes,
inline JSON, hidden nodes, comments, or CSS-obscured text. Blur/hidden CSS is
presentation only, not access control.

---

## 2026-06-25 Pro checkout sign-in gate

Users could previously open the Stripe Pricing Table while signed out. In that
case Stripe could collect payment without a Firebase UID in
`client-reference-id`, leaving no reliable `entitlements/{uid}` target.

Mitigation:

* `vis_gp.html` now requires Firebase sign-in before rendering
  `stripe-pricing-table`.
* `stripe-pricing-table` is only created after `window.__auth.currentUser`
  exists, and always gets `client-reference-id=<firebase uid>` plus
  `customer-email` when available.
* `/?pro=1` now starts the sign-in → checkout flow, including mobile redirect
  sign-in via `AIGOALIE_CHECKOUT_PENDING`.
* Current generated GitHub Pages day pages were patched and redeployed
  immediately (`deploy 2026-06-25_19:32Z`).

Longer-term preferred path: replace raw Stripe Pricing Table checkout with the
authenticated `/checkout/session/live` backend endpoint so the server always
sets Stripe metadata `{uid: firebase_uid}`.

---

## 2026-06-25 Compact expanded-card metric rail

Day-page expanded cards were too tall on mobile because prediction tiles and
accuracy-history cards stacked into multiple rows. `vis_gp.html` now uses one
compact `.metric-rail` for expanded cards:

* `xG/team` is the wider first tile and preserves `.pro-xgh` / `.pro-xga`.
* `Goals` removes the low/medium/high text to save vertical space.
* `BTTS` preserves `.pro-btts`.
* Public accuracy is labeled `Accuracy at pick %`.
* Pro league accuracy is labeled `League accuracy`.
* Hidden `.pro-opp` remains for compatibility but is not displayed.

Deployed to GitHub Pages as `8a48b88ab6` after the pipeline generated the new
root HTML. Verified live: `https://ai-goalie.com/?v=compact-metrics-3` contains
`metric-rail` and no `pred-strip`.

---

## 2026-06-25 Language selector parity + localized matchup data fix

Language switching was inconsistent after the multilingual rollout: only the
English index reliably showed the selector; localized day/static pages and
Worker fixture pages often did not. Localized matchup pages also fetched
`matchup_data.json` relative to `/ja/matchup/`, so datalist suggestions did not
load outside English.

Fixes applied:

* `matchup_page.py` now fetches `/matchup_data.json` absolute, so suggestions
  work from `/ja/matchup/`, `/es/matchup/`, etc.
* `vis_gp.html` / `html_generation.py` now keep full `LANGS` in localized day
  pages and include a real Japanese selector label (`🇯🇵 日本語`).
* Static pages (`results`, `matchup`, `contact`, `about`) now get language
  selectors in English and localized variants; current deployed localized
  static/day pages were patched directly as well.
* `worker/worker.mjs` now renders language selectors on fixture pages and
  injects a selector into Worker-served localized static pages if the cached raw
  page lacks one. Raw/day cache version bumped to `2026-06-25-lang-selector-v2`.
* Worker deploy versions during this fix ended at
  `60e9d4fd-5392-47da-bc16-4a363719d587`; GitHub Pages deploy ended at
  `583e6d06d0` plus localized day patch `50297cabf3`.

Live verification with cache-busters passed for:
`/ja/football-predictions/2026-06-25/`, `/ja/results/`, `/ja/matchup/`,
`/match/<slug>`, and `/ja/match/<slug>`.

---

## 2026-06-26 Future Pro day-page render fix

Future day pages beyond the public window ship no static rows, then Pro users
load rows client-side via `/pro/day/full`. That Pro JSON currently includes
prediction values and legacy `fixture_html`, but not the normal day-page team
ids/logo URLs/slugs. This caused Pro-only future pages to render placeholder
logo squares, miss some special grouping behavior, and keep newly-rendered Pro
fields visually locked after auth.

Fixes applied in `vis_gp.html` and patched into current generated Pages HTML:

* Client Pro conversion now reads xG from `home_xg`/`away_xg` and
  `pro_home_xg`/`pro_away_xg` fallbacks.
* Client Pro conversion parses home/away logo URLs from legacy `fixture_html` /
  `fixture_m_html` and normalizes `./new_logos/...` to `/new_logos/...`.
* World Cup detection now accepts any league ending in `World Cup`, not only the
  exact string `International - World Cup`.
* Newly-rendered future Pro cards call `applyProUnlockedDom()` immediately when
  `window.__isPro === true`, removing `.locked` and hiding `.pro-tag` after the
  client render.
* Current deployed generated HTML was patched directly (`deploy 9b6fd85950`),
  and the synced `vis_gp.html` covers the next normal pipeline generation.

Verified live `https://ai-goalie.com/02.07.2026.html?v=futurepro2` contains
`legacyFixtureLogo` and `applyProUnlockedDom`; localized future pages such as
`ja/football-predictions/2026-07-02/index.html` contain the same fix.

---

## 2026-06-26 Hotfix: index JS syntax regression

A future-Pro logo fallback added `legacyFixtureLogo()` with a single-quoted
`new RegExp('<div... ["\\'] ...')` string. In generated HTML this produced a
browser syntax error (`missing ) after argument list`) and stopped all following
index JS, including day navigation.

Hotfix:

* `vis_gp.html` now uses a double-quoted `RegExp` string:
  `new RegExp("<div[^>]*class=[\"'][^\"']*" + cls + ... , "i")`.
* Current generated day pages were patched directly and redeployed as
  `8ed56850ea`.
* Verified live `/` and `/index.html` no longer contain `new RegExp('<div` and
  do contain `function navigateToDate` / `function adjustDate`.

Root `/` lagged `/index.html` briefly because it is cached separately; it
refreshed after propagation and now serves the fixed JS.

---

## 2026-06-26 Hotfix: future Pro cards missing accuracy context

Future Pro-only day pages rendered match cards client-side from `/pro/day/full`.
The compact accuracy rail was still using hardcoded placeholders, so expanded
future cards showed `Accuracy at XX% — More history needed` and Pro-looking
`League accuracy` locks even though `model_context.json` had usable stats.

Fixes applied in `vis_gp.html` and patched into current generated Pages HTML:

* Client-rendered cards now display confidence-bucket accuracy from
  `/model_context.json` (`context.confidence`).
* Client-rendered cards now display league accuracy from `leagues_conf50` when
  available, falling back to all-picks league accuracy.
* `renderV12MatchesFromApi()` is async and loads model context before drawing
  client-rendered cards.
* Current generated future/localized pages were patched directly and redeployed
  as `1d0a2695dd`.

Verified live `https://ai-goalie.com/02.07.2026.html?v=accuracyfix1` contains
`loadModelContext`, `m.context_conf`, and `await renderV12MatchesFromApi`.
Verified live `model_context.json` has confidence buckets and league coverage;
`International - Friendlies Clubs` falls back to all-picks league accuracy.

---

## 2026-06-27 Hotfix: homepage Pro league accuracy + CTA state

Homepage expanded cards had two Pro-state issues:

* Server-rendered `League accuracy` tiles hardcoded `🔒` instead of embedding the
  hidden real league stat, so Pro unlock removed blur classes but had no value to
  reveal.
* The navbar `Go Pro` CTA remained visible after `/me` reported an active Pro
  subscription.

Fixes applied in `vis_gp.html` and patched into current generated Pages HTML:

* Server-rendered match cards now put the league accuracy percentage and sample
  count into the Pro-locked tile when `match.context_league` exists, otherwise
  they show `— / More history needed`.
* Client-rendered future Pro cards use the same `— / More history needed`
  fallback rather than a fake lock when league stats are unavailable.
* Added `body.pro-unlocked [data-buy-pro]{display:none!important}` so the `Go
  Pro` buttons disappear for Pro users after auth state resolves.
* Current generated pages were patched directly and redeployed as `13563b89e5`.

Verified live `https://ai-goalie.com/index.html?v=proleague2` contains the Pro
CTA hide rule and the first World Cup card now embeds `League accuracy` as
`69% / 48 calls` instead of `🔒`.

---

## 2026-06-28 SEO brand alias pass: AI Goalie / AI-Goalie

Google was indexing the brand for `aigoalie` but not reliably for the spaced /
hyphenated variants `AI Goalie` and `AI-Goalie`. Fixed by adding brand aliases
centrally rather than creating duplicate pages.

Source/template changes:

* `vis_gp.html` now emits Organization + WebSite JSON-LD with
  `alternateName: ["AI Goalie", "AI-Goalie", "ai-goalie.com"]`, plus
  `og:site_name`, `og:title`, `twitter:title`, and logo alt text
  `AIGoalie / AI Goalie logo`.
* `html_generation.py` now gives the English homepage the title
  `AIGoalie — AI Goalie Football Predictions` and mentions the alias in the
  homepage meta description.
* `about.html`, `contact_v12.html`, `disclaimer_v12.html`, and
  `results_page.py` now include natural `AI Goalie` copy/social metadata and
  Organization JSON-LD aliases.
* `worker/worker.mjs` fixture pages now include the alias in English meta
  descriptions, JSON-LD author alternateName, OpenGraph site name, Twitter title,
  and logo alt text.

Production:

* Current generated Pages HTML was patched directly for immediate effect and
  deployed as `ad5cc9f0cd`.
* Worker deployed as version `cc7153d7-ebec-4900-b777-4152c0f4118d`.
* Verified live `/index.html`, `/about.html`, and a `/match/...` fixture contain
  `AI Goalie`, `alternateName`, and `og:site_name` signals.

Recommended follow-up: request reindexing in Google Search Console for `/`,
`/about.html`, `/results.html`, and one representative fixture page.

---

## 2026-06-28 SEO audit cleanup: stale pages + fixture title length

Follow-up from the uploaded Ubersuggest audit and `AI-Goalie_SEO_GEO_Guide.docx`.
The actionable issue was stale generated HTML still deployed in GitHub Pages:
old root `DD.MM.YYYY.html` archive pages, `*-v12.html` QA pages, old localized
suffix pages like `index-de.html` / `DD.MM.YYYY-de.html`, legacy `navbar*.html`,
and `1120.html` / `1220.html`. These carried duplicate titles/meta and old
"betting tips" copy.

Fixes:

* `github_job.py` no longer includes legacy `navbar*.html`, root localized suffix
  pages, or localized v12 suffix pages in the deploy allowlist. Clean localized
  static paths include disclaimer/privacy-policy as needed.
* Removed 109 stale HTML artifacts from `site/AI-Goalie` and deployed the
  deletions as Pages commit `81a6975929`.
* `worker/worker.mjs` fixture titles now use compact SEO titles such as
  `Germany vs Paraguay Prediction | AIGoalie`, with a 65-character-safe fallback
  for long team names. Worker deployed as
  `139f3d1e-f8bf-498a-b0a3-34dd3a311fd7`.
* Shortened the one remaining Spanish static title in `i18n/static_localize.py`
  (`Simulador AIGoalie | Predicciones IA`) and deployed Pages commit
  `7f3096afc0`.

Verification after deploy:

* Current production Pages audit: `long titles 0`, `duplicate titles 0`,
  `duplicate meta descriptions 0`; only `googleb2e4a727c00cdd33.html` lacks H1,
  which is a Google verification file and should be ignored.
* Root stale counts: `v12=0`, `localized_suffix=0`, `navbar=0`.
* `https://ai-goalie.com/01.02.2026.html` now returns `404`.
* Fixture title verified live as `Germany vs Paraguay Prediction | AIGoalie`.

Remaining intentional SEO debt: English day pages still use the rolling
`DD.MM.YYYY.html` structure. A full migration to
`/football-predictions/YYYY-MM-DD/` needs redirect planning and should be a
separate staged change.

---

## 2026-07-05 Hotfix: day-page total goals mismatch after Pro unlock

Bug: expanded day-page cards could show `xG/team` values that summed to a
number different from the visible `Total goals` tile, e.g. `1.30 - 0.48` but
`Total goals 0.59`. Root cause: server-rendered cards kept legacy `goal_prob`
in the public Total goals tile, while Pro unlock JS populated xG/team from
`home_xg`/`away_xg` or `pro_home_xg`/`pro_away_xg` without updating the Total
goals tile.

Fix:

* `vis_gp.html` marks the Total goals tile with `.total-goals-metric`.
* `populateRenderedProFields()` now reads `total_xg` / `pro_total_xg`, falling
  back to `home_xg + away_xg`, and updates the visible Total goals value when
  Pro data is loaded.
* Current generated Pages HTML was patched directly and deployed as
  `8277b17674`.

Verified live `/index.html?v=totalxg-js` contains `populateRenderedProFields`,
`const totalXg = numOrNull(match.total_xg ?? match.pro_total_xg)`, and updates
`.total-goals-metric` from the same xG source.

---

## 2026-07-07 Hotfix: Moneytizer inline slot id

Bug: day-page inline rectangle format `19` threw `Cannot read properties of null
(reading 'appendChild')` from Moneytizer `formatrequest_refactor_desktop.js`.
Root cause: the slot used custom id `dayInlineAd`, but Moneytizer format tags
expect the DOM id to match the account/format id, e.g. `128244-19`.

Fix:

* `vis_gp.html` now renders the inline rectangle as `id="128244-19"` with
  `.day-inline-ad` for our own placement logic.
* `placeFeaturedInlineAd()` now finds it via `document.querySelector('.day-inline-ad')`
  instead of the old custom id.
* Existing generated Pages HTML was patched directly and deployed as
  `c37d6e41c9`.

Verified live `index.html?v=ad-id-fix-c37d6e41c9`: `dayInlineAd` absent,
`id="128244-19"` present, and `document.querySelector(".day-inline-ad")` present.

---

## 2026-07-11 AdSense verification-only meta tag

Added Google AdSense verification meta tag only, without changing ad serving or
removing Moneytizer:

```html
<meta name="google-adsense-account" content="ca-pub-1341511551805856">
```

Patched `vis_gp.html` and the current generated Pages HTML, then deployed Pages
commit `0a3b8d4d63`. Verified live on `https://ai-goalie.com/index.html` with a
cache-busting query. No AdSense script snippet and no Google `ads.txt` line were
added yet; this was intentionally minimal for domain/account verification.

---

## 2026-07-11 GA4 minimal install

Installed the Google tag for GA4 measurement ID `G-DP174X78CW` immediately after
`<head>` on the main generated day pages, static pages, matchup/results
surfaces, and Worker-rendered fixture/localized pages. Moneytizer was left in
place; this was analytics setup, not an ad-network migration.

Deployed Pages commit `99c9cd5c1b` and Worker version
`5b3f3ad1-781f-4f27-b682-f92db8b9203a`. Verified live with cache-busting URLs:
`index.html`, `results.html`, `matchup.html`, `contact.html`, and one `/match/*`
fixture each contain exactly one `gtag/js?id=G-DP174X78CW` script and one
`gtag('config', 'G-DP174X78CW')` call.

---

## 2026-07-22 Featured league priority fix

Changed day-page featured-section selection so the front page no longer blindly
features the first league in `league_matches` order. Durable pipeline fix in
`html_generation.py`: `_league_feature_priority()` ranks World Cup first, then
Champions League/Europa/Conference/Libertadores/Sudamericana/Nations League and
qualifiers, while penalizing friendlies. Browser fallback in `vis_gp.html` now
uses the same priority via `leagueFeaturePriority()` / `bestFeaturedLeague()`
and can replace an already-rendered low-priority featured section from current
static files.

Patched current generated Pages HTML and deployed commits `0d98540651` and
`048d96968f`. Verified with headless Chrome on live `/index.html`: post-JS first
visible global section is `International - UEFA Champions League` instead of
`England - Friendlies Clubs`.

---

## 2026-07-22 League header logo fix

International/continental league headers previously had no visual marker because
only country `flag_url`s were rendered. Added durable `league_games[league]['logo_url']`
from `sample_game['league_logo_url']` in `html_generation.py`; day template now
renders `league-logo` first, then country flag, then emoji fallback. Client-side
league header rendering also prefers `league.logo_url` and keeps emoji fallback
for missing logos.

Patched current generated Pages HTML using `games.pkl` league logo URLs and
deployed Pages commit `73b3aa8f8b`. Verified live `/index.html` contains real
API-Football league logos such as UEFA Champions League
`https://media.api-sports.io/football/leagues/2.png`, Europa League `3.png`,
Sudamericana `11.png`, and Conference League `848.png`.

The API-Sports competition marks use dark artwork on transparent backgrounds;
`vis_gp.html` now gives all league logos a compact light badge, border, and
padding so the lettering remains readable on the dark site theme.

Follow-up: some fresh records lacked `league_logo_url`, which caused the
featured-section clone to contain no logo element at all. Added durable
competition-ID fallbacks in `html_generation.py` and `vis_gp.html`, plus a
client-side insertion safeguard for already-generated sections.

Added fallback logo mappings for CONMEBOL Sudamericana (league 11) and
Friendlies (league 10) after fresh generated headers still lacked marks.

League view ordering now also uses the same competition-priority sort in the
client renderer, ensuring Champions League/continental competitions precede
friendlies even when client data arrives in a different insertion order.

International league headers now always have a fallback mark: API-Sports logo
when mapped/available, competition icon for known competitions, or a globe
badge for any remaining international competition. Domestic leagues continue
to use their country flags.

To avoid unreliable external competition-logo assets, the stable image fallback
is now limited to the working Champions League mark; all other international
competitions deliberately use local emoji/globe badges.

The long-running pipeline had retained the previous generator in memory, so a
runtime league-priority guard was also injected into the current generated
Pages HTML. It reorders the league tab immediately; the pipeline was restarted
to load the durable source fix for future cycles.

Featured selection now requires a ranking value of at least 40, excludes
friendlies, and labels the promoted section `Featured league`. This leaves the
all-matches view unfeatured when only low-value leagues are available.

Client promotion now respects the generated `data-featured-eligible` flag and
will not promote an unqualified league; when the flag is absent on legacy HTML,
only named major competitions are eligible as a safe fallback.

AdSense was approved on 2026-07-28. Added the required publisher declaration
`google.com, pub-1341511551805856, DIRECT, f08c47fec0942fa0` to the durable
`ads.txt` source alongside the existing Moneytizer seller lines.

AdSense responsive units were wired into the day template and Worker pages:
day top `9058921308`, day inline `1152511125`, and fixture `5127983370`.
The AdSense library loads once per page and Pro users still receive no ad
requests. These replace the Moneytizer slot injection in those positions.

2026-07-28 follow-up: the Worker was redeployed as version
`c9223801-080c-4792-b92a-cc9a6ee57a7d` with AdSense-only page slots. The static
Pages source was regenerated/patched and pushed as commit `732cc71b57`; the
live homepage may continue serving the prior Moneytizer HTML until the
Cloudflare/GitHub Pages cache expires (the zone token lacks cache-purge scope).
Moneytizer names remaining in page source refer to the legacy CMP/compatibility
function names, not active Moneytizer ad slots.

2026-07-30 AdSense zero-width fix: the loader now waits for each slot's
`getBoundingClientRect().width > 1` before calling `adsbygoogle.push`, retries
briefly while layout settles, and only marks a slot loaded after the push. This
is in `vis_gp.html`, both Worker render paths, and generated Pages commit
`c00f634ab7`; Worker version `a8fa960d-c80e-4a7d-8d93-c56a68f85b8e`.
The `uspDnsText`/`__gpp` console messages are from the remaining InMobi
Moneytizer CMP and are separate from the AdSense slot error; remove/replace
that CMP only after the Google-certified CMP configuration is ready.

2026-07-30 follow-up: explicit `width:100%` was added to the AdSense `<ins>`
and each push now marks the slot before calling AdSense, preventing repeated
pushes after a provider-side error. Generated Pages commit `1ae1bf0b3e` and
Worker version `260e96ec-a85b-4ef5-b07d-7e2e98de6849` are deployed.

2026-07-30 ad-shape/final Worker update: homepage day-page slot `9058921308`
is constrained to a square/rectangle presentation, while inline slot
`1152511125` is constrained to a smaller horizontal presentation. The same
width-safe loader is deployed to fixture pages. Pages commit `35f6f28a60`;
Worker version `b9e6ca34-5a57-40e2-b4f7-20f13f03a9ac`.

2026-07-31 correction: prior multi-file `scp ... /home/aigoalie-monetized/`
flattened `worker/worker.mjs` into the project root, so Wrangler kept deploying
the stale file from `/worker/worker.mjs`. Sync Worker changes explicitly to
`/home/aigoalie-monetized/worker/worker.mjs`. Correct Worker version
`f02ce537-3ba8-401d-aac0-496af064e979` now renders fixture slot `5127983370`
at 300x250 with no AdSense console error. Homepage Pages commit `bedfc2bc08`
uses rectangle slot `9058921308` plus dedicated horizontal slot `8259703311`.

2026-07-31 fixture horizontal ad: added slot `8259703311` after fixture
prediction prose/context accuracy and before lineups/recent details. Existing
top fixture slot `5127983370` remains 300x250. Both are Pro-hidden and verified
live at 300x250 + 468x100 with no AIGoalie AdSense errors. Worker version
`02740abf-ff6b-4d73-a7a5-54d2830b01d8`.

2026-07-31 ad-order swap: both day and fixture pages now show horizontal slot
`8259703311` first and the square/rectangle unit lower in the content. Day-page
lower unit is `9058921308`; fixture lower unit is `5127983370`. Verified the
Worker live at 468x100 then 300x250 with no AdSense errors. Pages commit
`e9b7ff4026`; Worker version `3c65aa16-63ea-4fcb-b673-b731582b19ab`.

2026-08-01 compact match controls: day pages now use one responsive controls
row with a layout select (`All matches` / `By league`), direct status filters
(`All`, `Live`, `Next`, `FT`), and an overflow menu for confidence/time sorting
and CSV export; search remains directly below. Added localized short labels for
en/ja/es/de/fr/pt, combined search + status filtering, explicit time sorting,
and preserved the existing CSV/search/view analytics and functionality. The
durable implementation is in `vis_gp.html`; generated production pages were
updated without restarting the API pipeline via `hotfix_day_controls.py`.
Pages commit `cf03fc5602`; verified at 390px with zero horizontal overflow and
local interaction tests for status filtering, league switching, and sorting.

2026-08-02 fixture top-ad correction: the Worker top slot still used
`data-full-width-responsive="true"` and had no fixed height, allowing AdSense to
choose a square creative despite `data-ad-format="horizontal"`. Fixture top ad
`8259703311` now matches the day-page contract: 468x60 desktop, 100px reserved
height on small mobile screens, horizontal format, and full-width-responsive
disabled. Bumped `MATCH_PAGE_CACHE_VERSION` to
`2026-08-02-fixture-horizontal-top-v1`; Worker version
`d6bbeb3d-7df0-425d-b825-e93ffdab4e25` verified live.

2026-08-02 fixture horizontal-ad placement follow-up: moved slot `8259703311`
from above the fixture title to directly below the complete score/confidence
hero and above the prediction tiles. Horizontal dimensions remain fixed.
`MATCH_PAGE_CACHE_VERSION=2026-08-02-fixture-horizontal-after-hero-v1`;
Worker version `3a108450-98a0-403e-8e4a-9d9bcc9c1a13`. Live HTML order verified
as hero → horizontal ad → prediction strip.

2026-08-15 Pro Picks price-aware refinement: restored one concise supporting
evidence label per shortlist row and made the trust claim explicit as `Pro Picks
historical win rate`. Seven-fold expanding-window testing showed that increasing
the capped estimated-value ranking weight from `0.08` to `0.20` reduced priced
picks below 1.20 from 30.4% to 23.5%, improved flat-stake ROI from 2.5% to 4.7%,
and retained a 79.2% win rate across 524 historical picks. Hard value-first
variants reached roughly 8.6-9.0% ROI but fell to about 76% accuracy, so they
were rejected. Production remains quality-gated and uses price only to rank
otherwise qualified candidates; no low-quality match is added to fill the list.

2026-08-15 Pro Picks stale-score guard: a completed Galatasaray vs Corum FK
pick contained a refreshed `result` (`2:2`) but a stale cached `score` (`1:2`).
The day-page renderer now parses the authoritative current `result` first and
uses the cached `score` only as a fallback. The archived/local/GCS record was
also synchronized to `2:2`.

2026-08-15 Pro Picks footer polish: reduced the member-table footer padding and
background weight to remove redundant whitespace below the picks. Today's
published shortlist remains intentionally immutable; the new price-aware policy
starts with future unarchived dates so selections cannot be changed after users
have already seen them.

2026-08-15 Pro Picks value research: added leakage-safe seven-fold comparison
of continuous value weights, price-first rules, and reliability-anchor hybrids.
The best product candidate is one highest-reliability anchor plus up to two
positive-value qualified picks, using reliability/quality gates 0.76/0.40. It
backtested at 81.6% wins and 7.4% flat-stake ROI across 477 picks / 188 of 235
evaluation days, versus 79.2% / 4.7% for the current 0.20 blend. Day-bootstrap
ROI interval was 1.9–12.6%, but a fixed spring validation period lost money, so
do not market ROI as established. Full report:
`PRO_PICKS_VALUE_RESEARCH_2026-08-15.md`. Production was NOT changed in this
research step.

2026-08-15 Pro Picks `anchor-value-v2` rollout: production now requires internal
reliability >=0.76 and quality >=0.40, selects one highest-reliability anchor,
then prefers up to two remaining qualified matches with odds >=1.20 and
estimated EV >=0, falling back to blended reliability/value ranking when fewer
value candidates exist. Exact rolling backtest claim is 81.6% across 477 picks.
Today's already-published shortlist stays immutable; future Pro JSON is refreshed
under the versioned policy.
