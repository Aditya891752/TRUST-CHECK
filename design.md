# TrustCheck Design System

## 1. Design intent
TrustCheck should feel like a serious verification instrument, not a generic AI landing page. Evidence must be easier to inspect than the model's prose. The first screen is the tool itself.

## 2. Visual principles
- Light background with high, readable contrast.
- One primary accent used consistently for interactive states and selected emphasis.
- Flat surfaces with a soft shadow and subtle neutral separators.
- No gradients anywhere. No glassmorphism. No decorative grain.
- No low-contrast dark mode. Light mode only for v1.
- No excessive iconography. No badge above the headline.
- Follow the exact ban list in rules.md section B.

## 3. Color tokens
| Token | Hex | Use |
|-------|-----|-----|
| bg | F4F8F8 | Page background |
| surface | FFFFFF | Cards, input |
| ink | 14262F | Body and headings |
| muted | 4A5D66 | Secondary text |
| primary | 0E7C86 | Buttons, links, focus |
| primary-hover | 0A5F67 | Button hover (instant swap) |
| on-primary | FFFFFF | Text on primary |
| supported-bg | E3F5EC | Supported highlight |
| supported-ink | 11603F | Supported label text |
| uncertain-bg | FCF1D9 | Uncertain highlight |
| uncertain-ink | 6B4400 | Uncertain label text |
| unsupported-bg | FADFDF | Unsupported highlight |
| unsupported-ink | 8F2323 | Unsupported label text |
| line | D5E0E3 | Dividers, input outline |

Check every text and background pair against WCAG AA (4.5:1 for body text) before shipping. Unsupported uses a clear but restrained warning treatment, not sensational red styling.

## 4. Typography
- IBM Plex Sans for UI and body. IBM Plex Mono for source URLs and counts only. Self-host the files.
- Not allowed: Inter as the universal typeface, Space Grotesk with Instrument Serif, serif italic accents.
- Scale (px / line-height): 14/20 caption, 16/24 body, 18/28 lead, 24/32 section title, 36/44 page title (display up to 48 to 64 on large desktop, lower on mobile).
- Weights: 400 body, 600 labels and buttons, 700 titles. Evidence metadata 12 to 13 px.
- Use hierarchy instead of decorative font mixing. No em dashes in UI copy.

## 5. Spacing scale
Base unit 4 px. Use only: 4, 8, 12, 16, 24, 32, 48, 64.
- 8 micro gap, 12 inline gap, 16 standard gap, 24 component gap, 32 section gap, 48 and up major separation.
- Card padding 24. Gap between cards 16. Do not mix arbitrary values. Forbid arbitrary spacing values in code review.

## 6. Page structure
```text
Header: TrustCheck wordmark, small utility links if needed
Workspace (first screen):
  - clear headline and one-sentence explanation
  - answer input, optional question, primary action
  - processing state
  - summary strip
  - highlighted answer
  - claim list with expandable evidence
Footer: utility links
```
Max content width 880 px, centered.

## 7. Verification UI
### Answer input
Large textarea (8 rows minimum) with a visible label "AI answer", optional "Original question", character counter. Primary button "Check reliability". "Use sample" as a text button.

### Progress
Plain status line: "Extracting claims", "Searching for evidence", "Verifying claims". A determinate bar with solid fill. No shimmer or spinner-only state. Loading skeletons are allowed.

### Highlighted answer
The original text with each claim tinted by verdict. Clicking a highlight scrolls to and expands its claim card. Underline on keyboard focus.

### Summary strip
One line: "7 claims: 4 supported, 2 uncertain, 1 unsupported", with a segmented bar of solid colors beneath. Not three icon boxes.

### Claim card
- Top: claim number, verdict label with shape marker, claim text.
- Middle: reasoning (14/20 muted).
- Bottom: expandable evidence list with title, domain in mono, and an external link (`rel="noopener noreferrer"`).
- Never hide the verdict behind hover.

### Verdict presentation
Supported: restrained positive. Uncertain: neutral warning with high text contrast. Unsupported: clear warning. Always a text label plus a shape marker (filled circle, half circle, square). Color is never the only signal.

## 8. Buttons
- Primary: primary background, white text, 8 px radius, 12 px vertical and 24 px horizontal padding.
- Hover: instant swap to primary-hover. No opacity fade, no layout shift.
- Focus: 2 px ink ring with 2 px offset, always visible.
- Disabled: gray surface with muted text, not-allowed cursor.

## 9. Errors
Inline message under the input with plain language and a Retry button. Never show codes, paths or traces. Show the request id in small muted text so it can be reported.

## 10. Icons
At most 8 custom SVG icons, 20 px, stroke 1.5, only where text is unclear (external link, copy, close). Do not decorate rows or headings with icons.

## 11. Motion
Only motion that communicates state: progress changes, accordion expansion at 150 ms or less, loading skeletons. No fade-in on scroll, no cursor-following effects, no fade-only hover. Respect `prefers-reduced-motion`.

## 12. Responsive behavior
- Breakpoints at 640 and 1024 px.
- Mobile: single column, full-width input and button, claims stack, evidence metadata wraps. Tap targets at least 44 px.
- Desktop: centered column, the report gets visual priority after submission. A secondary evidence column only if it stays readable.

## 13. Accessibility
Keyboard-first interaction, visible focus, semantic headings, accessible names on inputs and buttons, WCAG AA contrast, verdict never color-only.

## 14. Content tone
Short, plain sentences. Say "evidence found" and "no evidence found". Never claim certainty: TrustCheck reports evidence and people decide.

## 15. Design brief for AI tools
Paste into any AI design or coding tool before it generates screens:
"Calm light interface, background F4F8F8, white card surfaces with a soft shadow, IBM Plex Sans, primary color 0E7C86, verdict tints green E3F5EC, amber FCF1D9, red FADFDF with dark text labels. No gradients, no glass effects, no colored card borders, no emojis, no icon grid, no badge above the headline, spacing in multiples of 4 only, hover changes color instantly."
