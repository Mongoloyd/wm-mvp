

## Delete AboutFooter

The About page already renders inside `PublicLayout` which provides `SiteFooter`. The `AboutFooter` is a redundant, simpler footer. Two changes:

1. **Delete file** `src/components/about/AboutFooter.tsx`
2. **Edit `src/pages/About.tsx`**: Remove the import (line 19) and usage (line 88) of `AboutFooter`

