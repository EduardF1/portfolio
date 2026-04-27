# BVB Yellow Wall photo — attribution & provenance

## Final asset
- File: `bvb-yellow-wall-final.jpg`
- Dimensions: 980 x 504
- File size: 196 KB
- Format: progressive JPEG (mozjpeg), quality 85

## Source

- Article: "The spectacular 'yellow wall' of Dortmund stadium that seduces Messi"
- Article URL: <https://m.allfootballapp.com/news/EPL/The-spectacular-yellow-wall-of-Dortmund-stadium-that-seduces-Messi/1783948>
- Image URL (raw): <https://img.allfootballapp.com/www/M00/58/3B/rB8ApF2AeUiAR7QxAAKrwcwg3vo285.jpg>
- Site: All Football (m.allfootballapp.com), a fan-oriented football news aggregator
  operated by Dongqiudi (CDN: `img.allfootballapp.com`, `dongqiudi.com`).

## Original photographer / credit

The image is published by All Football without an explicit photographer credit
visible in the article. There is no on-image watermark, no Getty/AP/Reuters
banner, and no caption attribution in the article body. This is consistent
with much of All Football's editorial use of widely-circulated press-pool
match-day photography of Borussia Dortmund's Südtribüne.

Best-guess origin: a press-pool match photograph from a Dortmund home fixture
(framing, BVB-logo midfield projection, and "evonik" perimeter board place it
during the Evonik shirt-sponsor era — i.e. Bundesliga 2014-onwards). I could
not confirm the original photographer; All Football appears to re-syndicate
without crediting the source agency.

## License terms

- All Football is a fan-content / news aggregator that re-shares
  press-pool material without explicit licensing notices on individual photos.
  No license, photographer credit, or copyright statement is present alongside
  this image.
- This is **not** a Creative Commons / Wikimedia Commons sourced asset —
  the rights status is therefore **unclear**.
- Eduard chose this source over Wikimedia per his prior-session direction:
  *"I want specifically that image from that link, download it, edit it and
  make it ours as such."*
- For a personal portfolio used non-commercially, fair-use / editorial use is
  the operating assumption. If the portfolio is later monetised or this asset
  is used in commercial contexts, the photo should be re-licensed via Getty
  Images or replaced with a Wikimedia-Commons-licensed alternative.

## Treatment / edits applied

Performed locally with the `sharp` library (already a dep of Next.js in this
repo). See `scripts/.round5/_treat.mjs` for the exact pipeline.

1. **Crop**: 20 px off the top (dead stadium-roof void) and 30 px off the
   bottom (excess grass before the BVB midfield crest), giving 980 x 504.
   Composition is now tightened on the wall + crest.
2. **Saturation**: +10 % to lift the BVB yellow.
3. **Brightness**: +2 % to recover detail in the darker stand interior.
4. **Contrast**: linear slope 1.06 / intercept -8 — modestly deeper blacks
   and brighter highlights.
5. **Sharpen**: light unsharp mask (sigma 0.6, m1 0.5, m2 1.0) to restore
   fine flag-edge detail after the crop.
6. **Encode**: progressive JPEG, mozjpeg encoder, quality 85.

No content was added, removed, or composited. Treatment is purely tonal.

## Notes / flags for Eduard

- Source image native resolution is **only 980 x 554**. The All Football
  CDN will serve a `2000x-` variant on demand, but I verified it is just a
  bicubic upscale of the same 980 px source (channel stdev essentially
  identical). The final asset is therefore the true native size minus the
  crop.
- Other candidate articles on All Football carried a stunning Champions
  League tifo photo (the "Klopp goat" choreography) but it had a visible
  **Getty Images watermark** plus Mastercard "priceless" perimeter
  branding — rejected on licensing grounds.
- A second strong candidate was the "Und jedes Mal war es wert..." pilgrim
  tifo, but it was a stitched composite with sponsor logos along the
  bottom (Heineken, Pepsi, Turkish Airlines, etc.) — rejected for
  cleanliness reasons.
- The chosen photo is from a Dortmund home league fixture during the
  Evonik shirt-sponsor era. The wall is the unambiguous subject; no
  player portraits; no sponsor banners dominate the frame.
