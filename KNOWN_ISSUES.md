# Known Issues

## 🎨 Color Contrast Issue (User Reported)

Status: Not yet investigated
User Report: "UIUX is unreadable. Colors blending."
Priority: High — affects usability

Investigation Needed
- Check WCAG contrast ratios (target: AAA 21:1)
- Test in both light and dark modes
- Verify glassmorphism tokens in `lib/design/tokens.ts`
- Check CSS variables in `app/globals.css`

Potential Causes
- Insufficient contrast between text and glassmorphism backgrounds
- Border opacity too low (`rgba(255, 255, 255, 0.1)`)
- Text hierarchy not distinct enough

---

Last Updated: 2025-10-08
Platform Status: ✅ Functional and usable for studying
