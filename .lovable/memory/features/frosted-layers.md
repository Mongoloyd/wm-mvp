Frosted Layers background design system applied to all section components

## Design
- Page background: `hsl(216 25% 94%)` (#EEF2F7) cool blue-gray via `.frosted-page-bg`
- Light sections: `.frosted-card-light` — white/90 + backdrop-blur + soft shadow + rounded-1rem
- Dark sections: `.frosted-card-dark` — navy/95 + cyan radial gradient highlight + glow shadow
- All sections have `.frosted-section-spacing` for margin gaps so bg shows through
- CSS classes defined in `src/index.css` (bottom of file)

## Components updated
- AuditHero, SocialProofStrip, ScamConcernImage, InteractiveDemoScan, TruthGateFlow
- IndustryTruth, MarketMakerManifesto, ProcessSteps, NarrativeProof, ClosingManifesto
- FlowBEntry (both sections)
- Index.tsx wrapper: `frosted-page-bg` + top padding
