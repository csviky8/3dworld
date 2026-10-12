// GOVERNMENT CAMPUS CRM WORLD
// Parliament (HQ) = centre dome
// 4 Territory Wings = Lead districts (Area Heads)
// Each wing has Company clusters (Customers) + Staff houses (Members)
// Ring boulevards connect everything

export const WORLD_DISTRICTS = [
  { id: 'hq',         name: 'Parliament HQ',      eyebrow: 'GOVERNMENT HQ',      color: '#c8a84b', position: [0,   0,  0],   height: 9.0, summary: 'Central government — all CRM authority flows from here.' },
  { id: 'sales',      name: 'North Territory',    eyebrow: 'AREA HEAD · LEADS',  color: '#4a8fc4', position: [0,   0, -38], height: 6.8, summary: 'North territory lead pipeline and area head office.' },
  { id: 'contracts',  name: 'East Territory',     eyebrow: 'AREA HEAD · LEADS',  color: '#4daa7a', position: [38,  0,  0],  height: 6.4, summary: 'East territory contracts and area head office.' },
  { id: 'customers',  name: 'South Territory',    eyebrow: 'AREA HEAD · LEADS',  color: '#c46a4a', position: [0,   0,  38], height: 6.8, summary: 'South territory customer companies and area head.' },
  { id: 'support',    name: 'West Territory',     eyebrow: 'AREA HEAD · LEADS',  color: '#9b6ec8', position: [-38, 0,  0],  height: 6.4, summary: 'West territory support and area head office.' },
  { id: 'quotes',     name: 'NE Commerce Zone',   eyebrow: 'QUOTATION DISTRICT', color: '#d4a03a', position: [24,  0, -24], height: 5.2, summary: 'North-east commerce — quotations and proposals.' },
  { id: 'onboarding', name: 'SW Service Zone',    eyebrow: 'SERVICE DISTRICT',   color: '#5aaa9a', position: [-24, 0,  24], height: 5.2, summary: 'South-west service zone — onboarding and delivery.' },
]

export const WORLD_PEOPLE_LAYOUT = {
  teamsRow:     { startX: -6,  z: -6,  gapX: 4,   perRow: 4 },
  workRow:      { startX: -6,  z:  6,  gapX: 4,   perRow: 4 },
  staffRow:     { startX: -18, z: 6.6, gapX: 3.6, perRow: 9 },
  customersRow: { startX: -19, z: -4.8,gapX: 3.2, perRow: 10 },
}

export function districtById(id) {
  return WORLD_DISTRICTS.find((d) => d.id === id) || null
}
