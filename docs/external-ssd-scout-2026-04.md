# External SSD scout — `G:\` content opportunities, April 2026

> **PO autonomous-mode reconnaissance, 2026-04-26.** Per Eduard's directive: scout `G:\` (his external SSD with all documents/photos) for public-portfolio-relevant material **without** opening anything sensitive (CPR, contracts, citizenship documents, banking, personal correspondence, photos of others without consent).
>
> **What was read**: only directory listings (`ls`) of folders one or two levels deep. No file contents. No documents opened. This doc reports folder names and structural inferences only.

## Privacy guard applied

| Folder | Decision | Reason |
|---|---|---|
| `G:\Citizenship` / `G:\Citizenship_Application` | **Avoided** | Sensitive personal data (residency, ID). |
| `G:\Important Documents` | **Avoided** | Self-labeled by Eduard as important — likely contracts, government docs. |
| `G:\Documents` | **Avoided** | General-purpose personal docs folder. |
| `G:\Desktop Files (Before Reinstall)` | **Avoided** | Mixed bag, can contain anything. |
| `G:\OneDrive` | **Avoided** | Cloud-sync — likely overlaps with Important Documents. |
| `G:\Whatsapp` | **Avoided** | Personal correspondence. |
| `G:\backup NC (24.02.2026)` | **Avoided** | Netcompany backup — likely confidential client work / NDA-bound. |
| `G:\backup media telefon` | **Avoided** | Phone backup — personal photos / messages. |
| `G:\Calendars` | **Avoided** | Personal scheduling. |
| `G:\Pagini web` | **Avoided** | Saved web pages, includes a "BoardingCard" file — personal travel data. |

## Top-level structure observed (counts and themes)

`G:\` has **68 top-level folders**. Categorising by Eduard-public-portfolio relevance:

### Likely portfolio-relevant (worth Eduard's review)
- `G:\Dev` — main code-projects parent, 20+ subfolders covering bachelor and beyond. Notable subfolders surfaced:
  - `Dev\SEP4_IoT`, `Dev\SEP4_IoT_Dev_4`, `Dev\SEP4_IoT_Test`, `Dev\SEP4_Group_2_IoT` — Software Engineering Project semester 4, IoT theme. **Currently not on the portfolio.**
  - `Dev\Aeldra` — name unfamiliar; could be a student project or hackathon entry.
  - `Dev\JustCook` — sounds like a personal-project app.
  - `Dev\FreeRTOS`, `Dev\FreeRTOS_Win32_Tests`, `Dev\Atmel_Studio_Projects` — embedded / firmware. Adds an "embedded" angle that the current portfolio doesn't surface.
  - `Dev\Nexus_Docker`, `Dev\Proto-Bundle`, `Dev\IdeaLearningProject` — exploration / spike work.
  - `Dev\ADS_Java`, `Dev\DNP` — coursework.
- `G:\AND_PROJECT`, `G:\AndroidStudioProjects` — Android development history.
- `G:\AU-MSC` — Aarhus University master's coursework. Already partially surfaced via the master's-thesis MDX; possible additional articles.
- `G:\IBA Studies` — bachelor-level (AP Marketing & Management at IBA Kolding). Mostly business-school content; lower portfolio relevance.
- `G:\VIA_UCL` and `G:\VIA_UCL (Courses, assignments, etc.)` — VIA bachelor coursework, organised by semester. Same shape as IBA but software-engineering-relevant.
- `G:\University` — possibly older university material; not opened.
- `G:\master thesis` — duplicate-or-archive of the Aarhus master's thesis already surfaced on `/writing/articles/`.
- `G:\Courses` — generic course material; could be public certifications.
- `G:\Archive` — opaque label, skipped to be safe.

### Tools and dependencies (zero portfolio relevance)
- `ASUS SSD Toolbox`, `Astah Professional`, `Blender`, `DB Browser for SQLite`, `HP Drivers`, `HTerm`, `Heroku`, `Hyper_CLI`, `JBL_Quantum`, `MS SQL Server`, `Notepad++`, `NTI Backup Now EZ`, `Omen SDK`, `SeleniumDrivers`, `Steam`, `SteamLibrary`, `Visual Studio Cache`, `Visual Studio Resources (Tools, SDKs)`, `Wireshark`, `WinRar`, `Windows Kits`, `XAMPP`, `XboxGames`, `Apache Tomcat`, `League of legends`, `LoL`, `maven`, `neo4j-community-4.4.6`, `SQLiteStudio` — installed software / caches. Skip.

### Personal media (private; skip)
- `G:\Music`, `G:\Video`, `G:\Poze` (Romanian: "photos") — personal media, not for portfolio.
- `G:\WD_EXT_HDD` — older external-disk backup. Skip.

### Miscellaneous
- `G:\Stuff`, `G:\SWA` (empty), `G:\Text files`, `G:\F21 - Engineering Project Management - Class F01 - HERNING[480172U004] - 1042021 - 909 AM (1).zip` — ambiguous; Eduard knows what these are.

## Concrete recommendations (Eduard reviews)

### High-leverage additions if Eduard chooses

1. **A new `/work/sep4-iot` case study or `/writing/articles/sep4-iot` summary**
   - Source: `G:\Dev\SEP4_IoT` family of folders (SEP4 = Software Engineering Project, semester 4 at VIA).
   - Why it converts: closes the "no embedded / IoT background" gap on the portfolio. IoT is a real Danish hiring sector (Grundfos, Velux, Universal Robots, Demant, Beko Grundig, Coloplast). Even a 200-word summary of what the project shipped + tech stack + Eduard's role lifts the resume without requiring Eduard to write a full case study from scratch.

2. **An "Embedded / Firmware" tech surface**
   - Sources: `G:\Dev\FreeRTOS`, `G:\Dev\FreeRTOS_Win32_Tests`, `G:\Dev\Atmel_Studio_Projects`. These are real bachelor-era embedded work.
   - Action: add `freertos`, `arduino` (likely the Atmel target), and possibly `c-embedded` to `src/lib/tech.ts`. Wire to a "Bachelor-era projects" sub-section on `/work` or `/writing/articles`.

3. **Aeldra and JustCook side-projects**
   - Sources: `G:\Dev\Aeldra`, `G:\Dev\JustCook`. These are personal-named projects (not obviously coursework).
   - Action: ask Eduard whether either is shippable as a `/work` micro-case-study with a short demo or a "project shelf" section on the home page. If they're small / abandoned, "Side bets" on `/now` is a good home.

4. **`G:\Pagini web\Eduard Fischer-Szava.html`**
   - Looks like an old saved version of Eduard's portfolio or LinkedIn page. Worth Eduard's eye — could be the OLD portfolio Eduard had before this rebuild. A historical reference, not portfolio content itself.

### Low-priority follow-ups

5. `G:\AndroidStudioProjects` and `G:\AND_PROJECT` likely contain personal Android side-projects. Check if any are publishable to GitHub (closing the OSS-contribution gap from `docs/recruiter-deep-dive-2026-04.md`).
6. `G:\Courses` — if any include publicly-issued certifications (Microsoft / AWS / Coursera), surface them on the existing CV PDF or a `/writing/certifications` micro-page.

### Out of scope / explicitly avoided

- `G:\Citizenship` and similar — Privacy-sensitive. Even photos of certificates show numbers / personal data. Eduard handles directly.
- `G:\backup NC` — Netcompany code backup. NDA-bound. Eduard handles directly.

## Method notes

- Listings used: `ls G:/`, then `ls G:/Dev`, `ls G:/SEP4_IoT`, `ls G:/AND_PROJECT`, `ls G:/CFE-project`, `ls G:/IBA Studies`, `ls G:/VIA_UCL (Courses, assignments, etc.)`, `ls "G:/Pagini web"` (last one is the only file-level listing, and only because the folder name and file extensions clearly indicated saved web pages, not personal documents).
- No file contents read.
- No quotes / excerpts in this doc.
- No commits to `D:\Portfolio` were made during this scout (D was already covered by Sr Dev C's prior trip-clusters work).

## Update to backlog

Suggested additions (Eduard reviews):
- "Bachelor SEP4 IoT case study" *(M, depends on Eduard providing the canonical project description from `G:\Dev\SEP4_IoT`)*
- "Embedded / Firmware tech additions to `src/lib/tech.ts`" *(S, can add immediately based on observed folder names)*
- "Personal Android side-projects audit" *(S — Eduard checks `G:\AndroidStudioProjects` and decides which to surface)*
- "Certifications micro-page" *(S, depends on Eduard confirming which certs are still valid + publicly-issued)*
