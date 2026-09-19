# Client actions

Things only you can decide or obtain. Nothing here blocks the page from working. Each entry says
what unblocks it.

You asked for every good live site on the shelf, minus Pour L'Amour and the NOOR shop, so thirteen are on it. That was your call to
make and it is made. The items below are the consequences that still need handling, ordered by how
much they could cost you.

---

## 1. RED. UCHI is on the shelf with two photographs you do not own

`fietsenrekk.github.io/isu-style-preview` has two homepage photographs taken from other people's
Instagram accounts, one of them `@joruhairstudio`. Your own README for that project already says
this needs fixing.

**Where it stands:** at your request the UCHI card now shows the homepage, so one of the borrowed photographs is the card image on your portfolio itself, not just one click away.

**What unblocks it:** written permission from both photographers with a credit line naming them, or
replace both frames with images you hold the rights to. Until then your portfolio is sending
prospects to a page using someone else's copyrighted work to advertise you.

## 2. RED. Client permission for eleven sites

Eleven of the thirteen are other people's businesses, named, with addresses and in some cases named
doctors. Showing a client's site on your portfolio is normal and expected in this industry. Asking
first is also normal, and it is the difference between a reference and a complaint.

Worth a message each: **Noor Perfumes**, **Bravo Dent** (Tariq), **La Framboise**, **Josh Stefs**,
**Elite Clinics** (Dr. Jhossy Villanueva), **Tandis**, **Dermadok**, **LACLINIC DENTAL**,
**Kaiso Sushi**, **Labi**.

The two that are more sensitive than the rest:

- **Elite Clinics** names a doctor and a street address. Medical practices are the most likely of
  the set to have something in writing about how their brand is used.
- **Kaiso Sushi** still has allergen data for 149 dishes listed as blocking for launch in its own
  CLIENT_ACTIONS. You are showing it as finished work. Either close that out or be ready to explain
  it if a prospect clicks through and starts reading.

**What unblocks it:** a yes. If any client says no, delete that object from `cleared` in
`src/data/projects.json` and run `npm run build`. One edit.

## 3. AMBER. Your Calendly timezone says New York

Your account timezone is `America/New_York`. You are in Antwerp. Visitors get their own timezone
from the widget automatically so this is not breaking bookings, but every slot in your own
dashboard is six hours off from your actual day.

**What unblocks it:** Calendly, Account Settings, `Europe/Brussels`. Two minutes, only you can do it.

While you are in there: the older event type is named `Online appearance ` with a trailing space.
The `Intro call` I created for the sheet is clean. The other two are inactive.

## 4. AMBER. Visuals by Fiets says NL, northsite says Antwerp

The Visuals by Fiets site footer reads `BASED IN NL`. northsite says `Antwerp, Belgium`. Both sit on
the same shelf, so the contradiction is one scroll apart and a prospect can see it.

**What unblocks it:** tell me which is right and I will make them agree. If you genuinely work across
both, say so on one of the two rather than leaving a reader to spot the mismatch.

## 5. AMBER. There is no email address on the page

Deliberate. The booking sheet is the contact route, and a contact form next to a working calendar is
exactly the thing the brief's own rules reject. Other than that, the only routes to you are
Instagram and TikTok.

I did not publish `charlesmuwangam@gmail.com`. Putting a personal Gmail on a public portfolio is a
spam decision that is yours, not mine.

**What unblocks it:** set up something like `hello@northsite.co` and I will add it to the footer.

## 6. GREEN. The domain

Both handles are `northsite.co`, which implies you intend the domain. Nothing in the build depends
on it: every asset path is relative, so it works at a repository subpath or at a custom domain
without changes.

**What unblocks it:** register it, point it at Pages, set `NS_BASE` and add a `CNAME`.

## 7. GREEN. Four built sites are not deployed

`Daily Bingsu` (192 pages), `El Gato Gordo`, `VOLTA` and `Pain Shop` are all built and all return
404, because GitHub Pages was never switched on for those repositories. They are in the `held`
array with that reason.

Daily Bingsu in particular is a 192-page bilingual build sitting in a folder doing nothing for you.

**What unblocks it:** enable Pages on each repo, then move them to `cleared` and rebuild. Pain Shop
also still needs the studio's portfolio images.

## 8. GREEN. Book one real slot yourself

I verified that the Calendly embed mounts inside the sheet, that the event type is active, that its
location is Google Meet, and that keyboard and Escape behave correctly. I did not book a real
meeting, because that creates a real event and sends real invitations from your account.

**What unblocks it:** open the page, tap the bar, pick a slot, confirm the Google Meet link arrives,
then cancel it. Two minutes, and it is the last unproven link in the chain.
