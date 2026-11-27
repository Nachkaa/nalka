# Premium group homepage

## Goal
- Present friends and colleagues as the leading Christmas audiences, with family included.
- Give the homepage a calmer editorial hierarchy, stronger real photography and fewer boxed sections.
- Keep consumer-led group organization and explicit module choice intact.

## Scope and constraints
- Presentation, imagery, metadata and creation suggestions only.
- Reuse the existing seasonal rule and Christmas entry URL.
- No auth, reservation, invitation, data model or recommendation changes.
- Retain a year-round hero and generic event creation entry.
- Use licensed photography as illustration, without implying customer endorsement.

## Direction
- Headline: “Un petit cadeau. Un grand moment.”
- Audience framing: “Entre amis, entre collègues, en famille.”
- Serif headline, restrained violet accents, generous spacing and flat editorial sections.
- One clear seasonal CTA, with optional gift lists and shared preparations explained below.

## Image shortlist
| Candidate | Direction | Decision |
| --- | --- | --- |
| RDNE / Pexels 6519190 | Close gift handoff with visible people and a lively group | Hero: clearest human action and seasonal context |
| RDNE / Pexels 6519188 | Wider group around a table | Considered; the action is less immediate at small sizes |
| Katrin Bolovtsova / Pexels 6690454 | Colleagues at a desk | Considered; the office composition is more formal |

Source pages:
- https://www.pexels.com/photo/happy-people-celebrating-christmas-6519190/
- https://www.pexels.com/photo/people-sitting-at-a-wooden-table-exchanging-gifts-during-christmas-6519188/
- https://www.pexels.com/photo/happy-colleagues-exchanging-presents-at-work-6690454/
- License checked 2026-11-27: https://www.pexels.com/license/

## Implementation
1. Replace the floating mock event card with an editorial photo and audience navigation.
2. Simplify feature, process and privacy sections without dropping their explanations.
3. Give friends, colleagues and family distinct photographic examples.
4. Align the signed-in welcome, creation examples and metadata with the audience framing.

## Verification
- Typecheck, full lint, production build and existing seasonal/module regression tests.
- Local rendering and route checks for seasonal and evergreen entry points.
- Existing GitHub release gate before fast-forwarding the same commit to main.
- Inspect the deployed page in the browser and verify the Christmas CTA.
