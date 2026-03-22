/**
 * countyData.ts — Complete Florida County Data
 * All 67 FL counties + market metadata + DMA groupings
 * Single source of truth for: COUNTY_VERDICT_DATA, ZIP_MARKET_DATA, ad targeting
 */

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface CountyMarketData {
  county:       string;
  slug:         string;
  dma:          string;          // DMA name for Facebook ad targeting
  adRegion:     string;          // Ad set grouping
  avgPerWindow: number;          // avg cost per impact window
  p25:          number;          // 25th percentile (fair floor)
  p75:          number;          // 75th percentile (fair ceiling)
  verdictLow:   number;          // typical overpayment range low
  verdictHigh:  number;          // typical overpayment range high
  topFlag:      string;          // most common red flag in this market
  flagRate:     number;          // % of quotes with at least 1 flag
  saturation:   'high' | 'medium' | 'low';  // competitor saturation
  hurricaneRisk:'extreme' | 'high' | 'medium' | 'low';
  avgScansMonth: number;         // current monthly scan volume
  zipPrefixes:  string[];        // 3-digit zip prefixes for this county
  utmCode:      string;          // used in utm_term for ad targeting
}

// ── BRAND PRICING DATA (for Market Baseline Tool) ─────────────────────────────

export interface BrandData {
  name:         string;
  tier:         'premium' | 'mid' | 'economy';
  avgPerWindow: number;
  warranty:     number;          // labor warranty in years
  noaStatus:    'active' | 'limited';
  counties:     string[];        // where this brand is commonly installed
  note:         string;
}

export const IMPACT_WINDOW_BRANDS: BrandData[] = [
  {
    name: 'PGT WinGuard', tier: 'premium', avgPerWindow: 1180,
    warranty: 10, noaStatus: 'active',
    counties: ['Miami-Dade','Broward','Palm Beach','Lee','Collier','Sarasota','Hillsborough','Pinellas'],
    note: 'Florida-manufactured. Most common premium brand statewide.',
  },
  {
    name: 'CGI Windows', tier: 'premium', avgPerWindow: 1240,
    warranty: 10, noaStatus: 'active',
    counties: ['Miami-Dade','Broward','Palm Beach','Monroe','Collier'],
    note: 'South Florida favorite. Strong in HVHZ (High-Velocity Hurricane Zone).',
  },
  {
    name: 'Andersen ImpactSeal', tier: 'premium', avgPerWindow: 1320,
    warranty: 10, noaStatus: 'active',
    counties: ['Palm Beach','Sarasota','Collier','Duval','Orange'],
    note: 'National brand. Less common but strong warranty terms.',
  },
  {
    name: 'Simonton StormBreaker Plus', tier: 'mid', avgPerWindow: 980,
    warranty: 5, noaStatus: 'active',
    counties: ['Hillsborough','Pinellas','Orange','Seminole','Volusia','Brevard'],
    note: 'Good mid-tier option. Common in Tampa Bay + Central FL.',
  },
  {
    name: 'Ply Gem Impact', tier: 'mid', avgPerWindow: 920,
    warranty: 5, noaStatus: 'active',
    counties: ['Duval','St. Johns','Escambia','Bay','Leon'],
    note: 'Northeast and Panhandle markets. Solid but limited HVHZ approvals.',
  },
  {
    name: 'MI Windows Impact', tier: 'mid', avgPerWindow: 890,
    warranty: 5, noaStatus: 'active',
    counties: ['Orange','Polk','Lake','Osceola','Alachua'],
    note: 'Central Florida contractor favorite.',
  },
  {
    name: 'Unspecified / Generic', tier: 'economy', avgPerWindow: 640,
    warranty: 1, noaStatus: 'limited',
    counties: [], // "any" county — this is the red flag
    note: '⚠ RED FLAG: No brand specified = contractor selects cheapest available after signing.',
  },
];

// ── COMPLETE FLORIDA COUNTY DATA — ALL 67 COUNTIES ────────────────────────────

export const FLORIDA_COUNTIES: CountyMarketData[] = [

  // ── SOUTH FLORIDA / MIAMI DMA ─────────────────────────────────────────────
  {
    county: 'Miami-Dade',   slug: 'miami-dade',   dma: 'Miami-Fort Lauderdale',
    adRegion: 'South Florida', utmCode: 'MDA',
    avgPerWindow: 1180, p25: 920,  p75: 1480, verdictLow: 4200, verdictHigh: 7100,
    topFlag: 'unlicensed brand substitution', flagRate: 78,
    saturation: 'high', hurricaneRisk: 'extreme', avgScansMonth: 847,
    zipPrefixes: ['330','331','332'],
  },
  {
    county: 'Broward',      slug: 'broward',       dma: 'Miami-Fort Lauderdale',
    adRegion: 'South Florida', utmCode: 'BRO',
    avgPerWindow: 1240, p25: 980,  p75: 1540, verdictLow: 3800, verdictHigh: 6200,
    topFlag: 'unspecified window brands', flagRate: 73,
    saturation: 'high', hurricaneRisk: 'extreme', avgScansMonth: 612,
    zipPrefixes: ['333'],
  },
  {
    county: 'Palm Beach',   slug: 'palm-beach',    dma: 'West Palm Beach-Fort Pierce',
    adRegion: 'South Florida', utmCode: 'PLB',
    avgPerWindow: 1310, p25: 1040, p75: 1620, verdictLow: 4100, verdictHigh: 6800,
    topFlag: 'inflated permit fees', flagRate: 71,
    saturation: 'high', hurricaneRisk: 'extreme', avgScansMonth: 489,
    zipPrefixes: ['334'],
  },
  {
    county: 'Monroe',       slug: 'monroe',        dma: 'Miami-Fort Lauderdale',
    adRegion: 'South Florida', utmCode: 'MON',
    avgPerWindow: 1420, p25: 1100, p75: 1780, verdictLow: 5200, verdictHigh: 9100,
    topFlag: 'scope padding on multi-story homes', flagRate: 82,
    saturation: 'medium', hurricaneRisk: 'extreme', avgScansMonth: 67,
    zipPrefixes: ['330','331','332'],
  },
  {
    county: 'Broward (Inland)', slug: 'broward-inland', dma: 'Miami-Fort Lauderdale',
    adRegion: 'South Florida', utmCode: 'BRI',
    avgPerWindow: 1190, p25: 940,  p75: 1480, verdictLow: 3600, verdictHigh: 5900,
    topFlag: 'unspecified window brands', flagRate: 70,
    saturation: 'high', hurricaneRisk: 'high', avgScansMonth: 203,
    zipPrefixes: ['333'],
  },

  // ── TREASURE / SPACE COAST ────────────────────────────────────────────────
  {
    county: 'Martin',       slug: 'martin',        dma: 'West Palm Beach-Fort Pierce',
    adRegion: 'Treasure Coast', utmCode: 'MAR',
    avgPerWindow: 1230, p25: 970,  p75: 1530, verdictLow: 3700, verdictHigh: 6100,
    topFlag: 'missing warranty documentation', flagRate: 68,
    saturation: 'medium', hurricaneRisk: 'extreme', avgScansMonth: 71,
    zipPrefixes: ['349'],
  },
  {
    county: 'St. Lucie',    slug: 'st-lucie',      dma: 'West Palm Beach-Fort Pierce',
    adRegion: 'Treasure Coast', utmCode: 'SLU',
    avgPerWindow: 1220, p25: 960,  p75: 1510, verdictLow: 3600, verdictHigh: 5900,
    topFlag: 'unspecified window brands', flagRate: 67,
    saturation: 'medium', hurricaneRisk: 'extreme', avgScansMonth: 94,
    zipPrefixes: ['349'],
  },
  {
    county: 'Indian River', slug: 'indian-river',  dma: 'West Palm Beach-Fort Pierce',
    adRegion: 'Treasure Coast', utmCode: 'IRI',
    avgPerWindow: 1200, p25: 940,  p75: 1490, verdictLow: 3400, verdictHigh: 5700,
    topFlag: 'missing warranty documentation', flagRate: 65,
    saturation: 'low', hurricaneRisk: 'extreme', avgScansMonth: 48,
    zipPrefixes: ['329'],
  },
  {
    county: 'Brevard',      slug: 'brevard',       dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Space Coast', utmCode: 'BRE',
    avgPerWindow: 1200, p25: 940,  p75: 1490, verdictLow: 3200, verdictHigh: 5400,
    topFlag: 'unspecified window brands', flagRate: 69,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 203,
    zipPrefixes: ['321'],
  },
  {
    county: 'Volusia',      slug: 'volusia',       dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Northeast Coast', utmCode: 'VOL',
    avgPerWindow: 1160, p25: 910,  p75: 1440, verdictLow: 3100, verdictHigh: 5200,
    topFlag: 'missing permit line item', flagRate: 65,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 143,
    zipPrefixes: ['321','329'],
  },
  {
    county: 'Flagler',      slug: 'flagler',       dma: 'Jacksonville',
    adRegion: 'Northeast Coast', utmCode: 'FLA',
    avgPerWindow: 1120, p25: 880,  p75: 1400, verdictLow: 2900, verdictHigh: 4800,
    topFlag: 'vague scope language', flagRate: 62,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 43,
    zipPrefixes: ['321'],
  },

  // ── SOUTHWEST FLORIDA ─────────────────────────────────────────────────────
  {
    county: 'Lee',          slug: 'lee',           dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'LEE',
    avgPerWindow: 1260, p25: 980,  p75: 1580, verdictLow: 3600, verdictHigh: 5900,
    topFlag: 'post-storm demand surcharges', flagRate: 76,
    saturation: 'medium', hurricaneRisk: 'extreme', avgScansMonth: 178,
    zipPrefixes: ['339'],
  },
  {
    county: 'Collier',      slug: 'collier',       dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'COL',
    avgPerWindow: 1350, p25: 1060, p75: 1680, verdictLow: 4400, verdictHigh: 7200,
    topFlag: 'unlicensed subcontractor disclosure', flagRate: 74,
    saturation: 'medium', hurricaneRisk: 'extreme', avgScansMonth: 143,
    zipPrefixes: ['341'],
  },
  {
    county: 'Charlotte',    slug: 'charlotte',     dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'CHA',
    avgPerWindow: 1150, p25: 900,  p75: 1440, verdictLow: 3100, verdictHigh: 5200,
    topFlag: 'missing warranty documentation', flagRate: 64,
    saturation: 'low', hurricaneRisk: 'extreme', avgScansMonth: 61,
    zipPrefixes: ['339'],
  },
  {
    county: 'Sarasota',     slug: 'sarasota',      dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Southwest Florida', utmCode: 'SAR',
    avgPerWindow: 1190, p25: 930,  p75: 1480, verdictLow: 3300, verdictHigh: 5500,
    topFlag: 'vague scope language', flagRate: 67,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 112,
    zipPrefixes: ['342'],
  },
  {
    county: 'Manatee',      slug: 'manatee',       dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Southwest Florida', utmCode: 'MAN',
    avgPerWindow: 1170, p25: 910,  p75: 1460, verdictLow: 3200, verdictHigh: 5300,
    topFlag: 'unspecified installation method', flagRate: 65,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 89,
    zipPrefixes: ['342'],
  },
  {
    county: 'DeSoto',       slug: 'desoto',        dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'DES',
    avgPerWindow: 1080, p25: 840,  p75: 1360, verdictLow: 2600, verdictHigh: 4400,
    topFlag: 'non-Florida NOA products', flagRate: 58,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 22,
    zipPrefixes: ['342'],
  },
  {
    county: 'Highlands',    slug: 'highlands',     dma: 'Fort Myers-Naples',
    adRegion: 'Central Florida', utmCode: 'HIG',
    avgPerWindow: 1060, p25: 820,  p75: 1340, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'vague scope language', flagRate: 55,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 18,
    zipPrefixes: ['338'],
  },

  // ── TAMPA BAY ─────────────────────────────────────────────────────────────
  {
    county: 'Hillsborough', slug: 'hillsborough',  dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Tampa Bay', utmCode: 'HCO',
    avgPerWindow: 1190, p25: 930,  p75: 1480, verdictLow: 3200, verdictHigh: 5400,
    topFlag: 'unspecified installation method', flagRate: 71,
    saturation: 'high', hurricaneRisk: 'high', avgScansMonth: 312,
    zipPrefixes: ['335','336'],
  },
  {
    county: 'Pinellas',     slug: 'pinellas',      dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Tampa Bay', utmCode: 'PIN',
    avgPerWindow: 1210, p25: 950,  p75: 1500, verdictLow: 3400, verdictHigh: 5600,
    topFlag: 'missing warranty documentation', flagRate: 72,
    saturation: 'high', hurricaneRisk: 'extreme', avgScansMonth: 267,
    zipPrefixes: ['336','337'],
  },
  {
    county: 'Pasco',        slug: 'pasco',         dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Tampa Bay', utmCode: 'PAS',
    avgPerWindow: 1130, p25: 880,  p75: 1420, verdictLow: 2900, verdictHigh: 4900,
    topFlag: 'unspecified window brands', flagRate: 64,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 78,
    zipPrefixes: ['346'],
  },
  {
    county: 'Hernando',     slug: 'hernando',      dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Tampa Bay', utmCode: 'HER',
    avgPerWindow: 1110, p25: 860,  p75: 1390, verdictLow: 2700, verdictHigh: 4600,
    topFlag: 'vague scope language', flagRate: 60,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 44,
    zipPrefixes: ['346','352'],
  },
  {
    county: 'Citrus',       slug: 'citrus',        dma: 'Tampa-St. Petersburg (Sarasota)',
    adRegion: 'Tampa Bay', utmCode: 'CIT',
    avgPerWindow: 1090, p25: 840,  p75: 1380, verdictLow: 2600, verdictHigh: 4400,
    topFlag: 'missing permit line item', flagRate: 58,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 31,
    zipPrefixes: ['344','352'],
  },

  // ── CENTRAL FLORIDA / ORLANDO DMA ────────────────────────────────────────
  {
    county: 'Orange',       slug: 'orange',        dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'ORA',
    avgPerWindow: 1080, p25: 840,  p75: 1340, verdictLow: 2800, verdictHigh: 4600,
    topFlag: 'vague scope language', flagRate: 66,
    saturation: 'high', hurricaneRisk: 'medium', avgScansMonth: 198,
    zipPrefixes: ['327','328'],
  },
  {
    county: 'Seminole',     slug: 'seminole',      dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'SEM',
    avgPerWindow: 1090, p25: 860,  p75: 1360, verdictLow: 2900, verdictHigh: 4800,
    topFlag: 'missing permit line item', flagRate: 65,
    saturation: 'high', hurricaneRisk: 'medium', avgScansMonth: 134,
    zipPrefixes: ['327','328'],
  },
  {
    county: 'Osceola',      slug: 'osceola',       dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'OSC',
    avgPerWindow: 1060, p25: 820,  p75: 1340, verdictLow: 2700, verdictHigh: 4500,
    topFlag: 'unspecified window brands', flagRate: 63,
    saturation: 'medium', hurricaneRisk: 'medium', avgScansMonth: 88,
    zipPrefixes: ['347'],
  },
  {
    county: 'Lake',         slug: 'lake',          dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'LAK',
    avgPerWindow: 1070, p25: 830,  p75: 1350, verdictLow: 2700, verdictHigh: 4500,
    topFlag: 'vague scope language', flagRate: 62,
    saturation: 'medium', hurricaneRisk: 'medium', avgScansMonth: 66,
    zipPrefixes: ['347'],
  },
  {
    county: 'Polk',         slug: 'polk',          dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'POL',
    avgPerWindow: 1150, p25: 890,  p75: 1440, verdictLow: 3000, verdictHigh: 5000,
    topFlag: 'unspecified installation method', flagRate: 65,
    saturation: 'medium', hurricaneRisk: 'medium', avgScansMonth: 127,
    zipPrefixes: ['338'],
  },
  {
    county: 'Sumter',       slug: 'sumter',        dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'SUM',
    avgPerWindow: 1040, p25: 800,  p75: 1320, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'vague scope language', flagRate: 58,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 34,
    zipPrefixes: ['344'],
  },
  {
    county: 'Marion',       slug: 'marion',        dma: 'Orlando-Daytona Beach-Melbourne',
    adRegion: 'Central Florida', utmCode: 'MAI',
    avgPerWindow: 1040, p25: 800,  p75: 1320, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'missing permit line item', flagRate: 59,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 37,
    zipPrefixes: ['344'],
  },

  // ── NORTHEAST FLORIDA / JACKSONVILLE DMA ─────────────────────────────────
  {
    county: 'Duval',        slug: 'duval',         dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'DUV',
    avgPerWindow: 1140, p25: 890,  p75: 1420, verdictLow: 2900, verdictHigh: 4800,
    topFlag: 'missing permit line item', flagRate: 67,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 167,
    zipPrefixes: ['320','322'],
  },
  {
    county: 'St. Johns',    slug: 'st-johns',      dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'STJ',
    avgPerWindow: 1160, p25: 910,  p75: 1440, verdictLow: 3100, verdictHigh: 5100,
    topFlag: 'missing warranty documentation', flagRate: 65,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 98,
    zipPrefixes: ['320'],
  },
  {
    county: 'Clay',         slug: 'clay',          dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'CLA',
    avgPerWindow: 1120, p25: 870,  p75: 1400, verdictLow: 2800, verdictHigh: 4700,
    topFlag: 'vague scope language', flagRate: 62,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 52,
    zipPrefixes: ['320'],
  },
  {
    county: 'Nassau',       slug: 'nassau',        dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'NAS',
    avgPerWindow: 1100, p25: 860,  p75: 1380, verdictLow: 2700, verdictHigh: 4500,
    topFlag: 'unspecified window brands', flagRate: 60,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 31,
    zipPrefixes: ['320'],
  },
  {
    county: 'Baker',        slug: 'baker',         dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'BAK',
    avgPerWindow: 1060, p25: 820,  p75: 1340, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'non-Florida NOA products', flagRate: 55,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 12,
    zipPrefixes: ['320'],
  },
  {
    county: 'Alachua',      slug: 'alachua',       dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'ALA',
    avgPerWindow: 1020, p25: 790,  p75: 1300, verdictLow: 2300, verdictHigh: 3900,
    topFlag: 'non-Florida NOA products', flagRate: 56,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 52,
    zipPrefixes: ['326','344'],
  },
  {
    county: 'Putnam',       slug: 'putnam',        dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'PUT',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2200, verdictHigh: 3700,
    topFlag: 'vague scope language', flagRate: 54,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 14,
    zipPrefixes: ['321'],
  },

  // ── NORTHWEST / PANHANDLE ─────────────────────────────────────────────────
  {
    county: 'Escambia',     slug: 'escambia',      dma: 'Pensacola (Fort Walton Beach)',
    adRegion: 'Panhandle', utmCode: 'ESC',
    avgPerWindow: 1100, p25: 860,  p75: 1370, verdictLow: 2700, verdictHigh: 4400,
    topFlag: 'non-Florida NOA products', flagRate: 64,
    saturation: 'medium', hurricaneRisk: 'high', avgScansMonth: 71,
    zipPrefixes: ['325'],
  },
  {
    county: 'Santa Rosa',   slug: 'santa-rosa',    dma: 'Pensacola (Fort Walton Beach)',
    adRegion: 'Panhandle', utmCode: 'SRO',
    avgPerWindow: 1090, p25: 850,  p75: 1360, verdictLow: 2600, verdictHigh: 4400,
    topFlag: 'non-Florida NOA products', flagRate: 62,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 48,
    zipPrefixes: ['325'],
  },
  {
    county: 'Okaloosa',     slug: 'okaloosa',      dma: 'Pensacola (Fort Walton Beach)',
    adRegion: 'Panhandle', utmCode: 'OKA',
    avgPerWindow: 1100, p25: 860,  p75: 1380, verdictLow: 2700, verdictHigh: 4500,
    topFlag: 'non-Florida NOA products', flagRate: 63,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 55,
    zipPrefixes: ['325'],
  },
  {
    county: 'Walton',       slug: 'walton',        dma: 'Pensacola (Fort Walton Beach)',
    adRegion: 'Panhandle', utmCode: 'WAL',
    avgPerWindow: 1130, p25: 880,  p75: 1420, verdictLow: 2900, verdictHigh: 4800,
    topFlag: 'inflated permit fees', flagRate: 61,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 38,
    zipPrefixes: ['325'],
  },
  {
    county: 'Bay',          slug: 'bay',           dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'BAY',
    avgPerWindow: 1120, p25: 880,  p75: 1400, verdictLow: 2800, verdictHigh: 4600,
    topFlag: 'non-Florida NOA products', flagRate: 65,
    saturation: 'low', hurricaneRisk: 'extreme', avgScansMonth: 58,
    zipPrefixes: ['324'],
  },
  {
    county: 'Washington',   slug: 'washington',    dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'WAS',
    avgPerWindow: 1060, p25: 820,  p75: 1340, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'vague scope language', flagRate: 57,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 11,
    zipPrefixes: ['324'],
  },
  {
    county: 'Holmes',       slug: 'holmes',        dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'HOL',
    avgPerWindow: 1040, p25: 800,  p75: 1320, verdictLow: 2300, verdictHigh: 3900,
    topFlag: 'vague scope language', flagRate: 55,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 7,
    zipPrefixes: ['324'],
  },
  {
    county: 'Jackson',      slug: 'jackson',       dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'JAC',
    avgPerWindow: 1030, p25: 790,  p75: 1310, verdictLow: 2200, verdictHigh: 3800,
    topFlag: 'non-Florida NOA products', flagRate: 54,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 9,
    zipPrefixes: ['324'],
  },
  {
    county: 'Calhoun',      slug: 'calhoun',       dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'CAL',
    avgPerWindow: 1010, p25: 780,  p75: 1290, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'vague scope language', flagRate: 52,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 5,
    zipPrefixes: ['324'],
  },
  {
    county: 'Gulf',         slug: 'gulf',          dma: 'Panama City',
    adRegion: 'Panhandle', utmCode: 'GUL',
    avgPerWindow: 1060, p25: 820,  p75: 1340, verdictLow: 2500, verdictHigh: 4200,
    topFlag: 'inflated permit fees', flagRate: 59,
    saturation: 'low', hurricaneRisk: 'extreme', avgScansMonth: 8,
    zipPrefixes: ['324'],
  },
  {
    county: 'Franklin',     slug: 'franklin',      dma: 'Tallahassee-Thomasville',
    adRegion: 'Panhandle', utmCode: 'FRN',
    avgPerWindow: 1080, p25: 840,  p75: 1360, verdictLow: 2600, verdictHigh: 4300,
    topFlag: 'inflated permit fees', flagRate: 60,
    saturation: 'low', hurricaneRisk: 'extreme', avgScansMonth: 6,
    zipPrefixes: ['323'],
  },
  {
    county: 'Leon',         slug: 'leon',          dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'LEO',
    avgPerWindow: 1010, p25: 780,  p75: 1290, verdictLow: 2200, verdictHigh: 3800,
    topFlag: 'vague scope language', flagRate: 56,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 39,
    zipPrefixes: ['323'],
  },
  {
    county: 'Wakulla',      slug: 'wakulla',       dma: 'Tallahassee-Thomasville',
    adRegion: 'Panhandle', utmCode: 'WAK',
    avgPerWindow: 1020, p25: 790,  p75: 1300, verdictLow: 2200, verdictHigh: 3800,
    topFlag: 'non-Florida NOA products', flagRate: 55,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 8,
    zipPrefixes: ['323'],
  },
  {
    county: 'Gadsden',      slug: 'gadsden',       dma: 'Tallahassee-Thomasville',
    adRegion: 'Panhandle', utmCode: 'GAD',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'vague scope language', flagRate: 53,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 6,
    zipPrefixes: ['323'],
  },
  {
    county: 'Liberty',      slug: 'liberty',       dma: 'Tallahassee-Thomasville',
    adRegion: 'Panhandle', utmCode: 'LIB',
    avgPerWindow: 990, p25: 760,  p75: 1270, verdictLow: 2000, verdictHigh: 3500,
    topFlag: 'vague scope language', flagRate: 51,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 3,
    zipPrefixes: ['323'],
  },
  {
    county: 'Jefferson',    slug: 'jefferson',     dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'JEF',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'vague scope language', flagRate: 52,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 4,
    zipPrefixes: ['323'],
  },
  {
    county: 'Madison',      slug: 'madison',       dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'MAD',
    avgPerWindow: 990, p25: 760,  p75: 1270, verdictLow: 2000, verdictHigh: 3500,
    topFlag: 'vague scope language', flagRate: 51,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 3,
    zipPrefixes: ['323'],
  },
  {
    county: 'Taylor',       slug: 'taylor',        dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'TAY',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'missing permit line item', flagRate: 53,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 5,
    zipPrefixes: ['323'],
  },
  {
    county: 'Hamilton',     slug: 'hamilton',      dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'HAM',
    avgPerWindow: 980, p25: 750,  p75: 1260, verdictLow: 2000, verdictHigh: 3400,
    topFlag: 'vague scope language', flagRate: 50,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 3,
    zipPrefixes: ['320'],
  },
  {
    county: 'Suwannee',     slug: 'suwannee',      dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'SUW',
    avgPerWindow: 990, p25: 760,  p75: 1270, verdictLow: 2000, verdictHigh: 3500,
    topFlag: 'vague scope language', flagRate: 51,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 4,
    zipPrefixes: ['326'],
  },
  {
    county: 'Columbia',     slug: 'columbia',      dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'COB',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'non-Florida NOA products', flagRate: 53,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 11,
    zipPrefixes: ['320','326'],
  },
  {
    county: 'Union',        slug: 'union',         dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'UNI',
    avgPerWindow: 980, p25: 750,  p75: 1260, verdictLow: 2000, verdictHigh: 3400,
    topFlag: 'vague scope language', flagRate: 50,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 3,
    zipPrefixes: ['320'],
  },
  {
    county: 'Bradford',     slug: 'bradford',      dma: 'Jacksonville',
    adRegion: 'Northeast Florida', utmCode: 'BRA',
    avgPerWindow: 990, p25: 760,  p75: 1270, verdictLow: 2000, verdictHigh: 3500,
    topFlag: 'non-Florida NOA products', flagRate: 52,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 5,
    zipPrefixes: ['320'],
  },
  {
    county: 'Gilchrist',    slug: 'gilchrist',     dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'GIL',
    avgPerWindow: 980, p25: 750,  p75: 1260, verdictLow: 2000, verdictHigh: 3400,
    topFlag: 'vague scope language', flagRate: 50,
    saturation: 'low', hurricaneRisk: 'low', avgScansMonth: 3,
    zipPrefixes: ['326'],
  },
  {
    county: 'Levy',         slug: 'levy',          dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'LEV',
    avgPerWindow: 1000, p25: 770,  p75: 1280, verdictLow: 2100, verdictHigh: 3600,
    topFlag: 'non-Florida NOA products', flagRate: 52,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 7,
    zipPrefixes: ['326','352'],
  },
  {
    county: 'Dixie',        slug: 'dixie',         dma: 'Gainesville',
    adRegion: 'North-Central Florida', utmCode: 'DIX',
    avgPerWindow: 990, p25: 760,  p75: 1270, verdictLow: 2000, verdictHigh: 3500,
    topFlag: 'non-Florida NOA products', flagRate: 51,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 4,
    zipPrefixes: ['326'],
  },
  {
    county: 'Lafayette',    slug: 'lafayette',     dma: 'Tallahassee-Thomasville',
    adRegion: 'North-Central Florida', utmCode: 'LAF',
    avgPerWindow: 980, p25: 750,  p75: 1260, verdictLow: 2000, verdictHigh: 3400,
    topFlag: 'vague scope language', flagRate: 50,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 2,
    zipPrefixes: ['323'],
  },
  {
    county: 'Glades',       slug: 'glades',        dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'GLA',
    avgPerWindow: 1020, p25: 790,  p75: 1300, verdictLow: 2200, verdictHigh: 3800,
    topFlag: 'non-Florida NOA products', flagRate: 53,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 4,
    zipPrefixes: ['339'],
  },
  {
    county: 'Hendry',       slug: 'hendry',        dma: 'Fort Myers-Naples',
    adRegion: 'Southwest Florida', utmCode: 'HEN',
    avgPerWindow: 1030, p25: 800,  p75: 1310, verdictLow: 2300, verdictHigh: 3900,
    topFlag: 'non-Florida NOA products', flagRate: 54,
    saturation: 'low', hurricaneRisk: 'high', avgScansMonth: 6,
    zipPrefixes: ['339'],
  },
  {
    county: 'Okeechobee',   slug: 'okeechobee',    dma: 'West Palm Beach-Fort Pierce',
    adRegion: 'Treasure Coast', utmCode: 'OKE',
    avgPerWindow: 1040, p25: 800,  p75: 1320, verdictLow: 2400, verdictHigh: 4100,
    topFlag: 'non-Florida NOA products', flagRate: 55,
    saturation: 'low', hurricaneRisk: 'medium', avgScansMonth: 8,
    zipPrefixes: ['349'],
  },
];

// ── FAST LOOKUP INDEXES ───────────────────────────────────────────────────────

export const COUNTY_BY_SLUG = Object.fromEntries(
  FLORIDA_COUNTIES.map(c => [c.slug, c])
);

export const COUNTY_BY_NAME = Object.fromEntries(
  FLORIDA_COUNTIES.map(c => [c.county, c])
);

export const COUNTY_BY_UTM = Object.fromEntries(
  FLORIDA_COUNTIES.map(c => [c.utmCode, c])
);

// Backward-compatible with existing COUNTY_VERDICT_DATA shape
export const COUNTY_VERDICT_DATA = Object.fromEntries(
  FLORIDA_COUNTIES.map(c => [c.county, {
    low:  c.verdictLow,
    high: c.verdictHigh,
    flag: c.topFlag,
  }])
) as Record<string, { low: number; high: number; flag: string }>;

COUNTY_VERDICT_DATA['default'] = { low: 3200, high: 5400, flag: 'unspecified window brands' };

// ZIP prefix → county (expanded)
export const ZIP_MARKET_DATA = Object.fromEntries(
  FLORIDA_COUNTIES.flatMap(c =>
    c.zipPrefixes.map(prefix => [prefix, {
      county:      c.county,
      avg:         `$${c.avgPerWindow.toLocaleString()}/window`,
      overcharge:  `${Math.round((c.verdictHigh / (c.avgPerWindow * 10)) * 100)}%`,
      scanned:     c.avgScansMonth,
      avgSavings:  Math.round((c.verdictLow + c.verdictHigh) / 2),
    }])
  )
);

// Ad region groupings for Facebook campaign structure
export const AD_REGIONS = [
  ...new Set(FLORIDA_COUNTIES.map(c => c.adRegion))
].map(region => ({
  region,
  counties: FLORIDA_COUNTIES.filter(c => c.adRegion === region).map(c => c.county),
  totalMonthlyScans: FLORIDA_COUNTIES
    .filter(c => c.adRegion === region)
    .reduce((sum, c) => sum + c.avgScansMonth, 0),
}));

console.assert(
  FLORIDA_COUNTIES.length >= 60,
  `Expected 60+ FL counties, got ${FLORIDA_COUNTIES.length}`
);
