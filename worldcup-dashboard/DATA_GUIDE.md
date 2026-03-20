# World Cup Deal Dashboard — Data Guide

This document explains how the Salesforce report data was filtered, transformed, and mapped into the dashboard so users understand exactly what they see and what was excluded.

---

## 1. Data Source

The dashboard data is sourced from a **Salesforce Opportunity Product report** containing line items from World Cup-related opportunities. Each row in the report includes:

- **Product Name** — the full Salesforce SKU name
- **Quantity** — number of units
- **Total Price** — dollar value
- **Opportunity Owner** — the Dedrone sales rep
- **Account Name** — the purchasing agency
- **Opportunity Name** — the deal name (used to identify the city/event)
- **Document Display Category** — one of: Hardware, Software, Services, Warranty

---

## 2. Filtering Rules

### What IS included

Only rows where **Document Display Category = "Hardware"** are shown in the dashboard. This includes:

| Category | Examples |
|----------|----------|
| RF Sensors | RF-360, RF-560, RF-900, RF-310 |
| Radar Systems | ESR Radar, RI Radar, EchoGuard (inside trailers) |
| Mitigation / Counter-UAS | Dedrone Defender II, D-Fend EnforceAir2, Titan 3, Titan 4 |
| Mobile Platforms | Aluma Trailer w/ EchoGuard, Advanced Trailer, RapidResponse (DRR) |
| Fixed Sites | Fixed Site Standard+ |
| Integration Hardware | AI Connector, Box Server, Multi-Node Full Spectrum Kit |
| Cameras | Standard PTZ Camera, FLIR Ranger HDC 350, Tactical PTZ Camera |
| Accessories | Starlink HW Kit, Camera Mount, 3M Mast, Battery Pack, Tripod, Network Kit, Offline Server |

### What is EXCLUDED

| Category | Reason |
|----------|--------|
| **Software** | Software licenses, subscriptions, and hosted software are not physical assets to deploy. **DedroneTracker.AI is software** — all Tracker-related items are excluded (RF Software Hosted, Camera Software, Radar Software, C2 Online, Tactical Software, Standard Range Software, etc.). Also excluded: Titan 3 Software License, Defender Software, D-Fend SW, EchoShield Radar Software License, ESR Software License, Starlink Internet Access, Tracker AI Mitigation Software, Data Portal |
| **Services** | Installation and professional services (e.g., Install Services) |
| **Warranty** | Extended warranty line items (e.g., Titan 3 Ext Warranty, ESR Ext Warranty, FLIR Ext Warranty, RI Radar Ext Warranty, D-Fend EnforceAir2 Warranty, Advanced Trailer Warranty) |

> **Note:** DedroneTracker.AI (sometimes referred to as "D=Tracker" or "DT") is a **software platform**, not hardware. It appears frequently in Salesforce opportunities but is always categorized as Software and is fully excluded from this dashboard.

---

## 3. Product Name Cleanup

Salesforce SKU names are long and include prefixes. They are shortened for readability:

| Salesforce Product Name | Dashboard Display Name |
|-------------------------|----------------------|
| AXON DEDRONE RF-560 (9003 ATT US) | RF-560 Sensor |
| AXON DEDRONE RF-360 (9003 ATT US) | RF-360 Sensor |
| AXON DEDRONE RF-900 (9003 US) | RF-900 Sensor |
| AXON DEDRONE ESR RADAR | ESR Radar |
| AXON DEDRONE RI RADAR | RI Radar |
| DEDRONE DEFENDER II (USA W/ GPS JAMMING) | Dedrone Defender II |
| AXON DEDRONE - D-FEND ENFORCEAIR2 | D-Fend EnforceAir2 |
| AXON DEDRONE US ALUMA TRAILER WITH ECHOGUARD (SHORT RANGE) | Aluma Trailer w/ EchoGuard |
| AXON DEDRONE ADVANCED TRAILER | Advanced Trailer |
| AXON DEDRONERAPIDRESPONSE WITH ELR RADAR | RapidResponse w/ ELR Radar |
| AXON DEDRONE - REFRESH - RAPIDRESPONSE SHORT RANGE | RapidResponse (Short Range) |
| AXON DEDRONE - REFRESH - FIXED SITE STANDARD + | Fixed Site Standard+ |
| AXON DEDRONE MULTI-NODE FULL SPECTRUM KIT | Multi-Node Full Spectrum Kit |
| AXON DEDRONE AI CONNECTOR 1.0 (US) | AI Connector |
| AXON DEDRONE STANDARD PTZ CAMERA | PTZ Camera |
| AXON DEDRONE FLIR RANGER HDC 350 | FLIR Ranger HDC 350 |
| AXON DEDRONE BOX SERVER | Box Server |
| AXON DEDRONE - STARLINK HW KIT - MINI | Starlink HW Kit |
| AXON DEDRONE MAST - 3M | 3M Mast |
| AXON DEDRONE BATTERY USA - NC | Battery Pack |
| AXON DEDRONE CAMERA MOUNT | Camera Mount |
| AXON DEDRONE PORTABLE (TACTICAL) ... | Tactical ... |
| AXON DEDRONE - TITAN 4 | Titan 4 |

---

## 4. Titan 3 Consolidation

**Titan 3 is sold as two separate SKUs in Salesforce** — one for the High Band module and one for the Low Band module — but together they form **one physical Titan 3 unit**.

### How it works

When both of these appear on the same opportunity with the same quantity:

- `AXON DEDRONE TITAN3 KIT - HIGH BAND` (qty X)
- `AXON DEDRONE TITAN3 KIT - LOW BAND` (qty X)

They are **consolidated into a single line** showing **X Titan 3 units**.

### Example — Dallas PD

The Salesforce report shows:

| SKU | Qty |
|-----|-----|
| AXON DEDRONE TITAN3 KIT - HIGH BAND | 2 |
| AXON DEDRONE TITAN3 KIT - LOW BAND | 2 |
| AXON DEDRONE TITAN3 KIT - HIGH BAND | 5 |
| AXON DEDRONE TITAN3 KIT - LOW BAND | 5 |

The dashboard displays: **Titan 3 — Qty: 7** (2 + 5 units)

The same logic applies to the Portable (Tactical) variant:

- `AXON DEDRONE PORTABLE (TACTICAL) TITAN 3 KIT - HIGH BAND`
- `AXON DEDRONE PORTABLE (TACTICAL) TITAN 3 KIT - LOW BAND`

These are consolidated into **Tactical Titan 3** in the dashboard.

---

## 5. Agency-to-City Mapping

Each agency is mapped to the **closest FIFA World Cup 2026 host city** based on the opportunity name and geographic location.

### Clear mappings (FIFA/World Cup explicitly in the opportunity name)

| Salesforce Account | Clean Name | Mapped To | Rationale |
|--------------------|-----------|-----------|-----------|
| Dallas Police Dept. - TX | Dallas PD | **Dallas** (AT&T Stadium) | City PD, "FIFA Grant Funding" in opty |
| Georgia Bureau of Investigation - GA | GA Bureau of Investigation | **Atlanta** (Mercedes-Benz Stadium) | State agency, "FIFA Grant" in opty, Atlanta is only GA host city |
| Kansas City Police Dept. - KS | Kansas City PD | **Kansas City** (Arrowhead Stadium) | City PD, "World Cup" in opty |
| Miami Dade Sheriff Office - FL | Miami-Dade Sheriff Office | **Miami** (Hard Rock Stadium) | County agency, "FIFA WC Grant" in opty, Hard Rock Stadium is in Miami-Dade County |
| New York City Police Dept - NY | NYPD | **New York/NJ** (MetLife Stadium) | City PD, "World Cup Funding" in opty |
| Philadelphia Police Dept. - PA | Philadelphia PD | **Philadelphia** (Lincoln Financial Field) | City PD, "World Cup Funding" in opty |
| DDL-DHS-S&T | DHS S&T | **Federal Pool** (all venues) | Federal agency, "FIFA WORLD CUP" in opty, not city-specific |

### Mappings requiring attention

| Salesforce Account | Clean Name | Mapped To | Note |
|--------------------|-----------|-----------|------|
| Moniteau County Sheriff's Dept. - MO | Moniteau County Sheriff | **Kansas City** (Arrowhead Stadium) | "World Cup" is in the opty name, but Moniteau County is ~130 miles from KC. Mapped to KC as the closest and only MO host city. |
| Morris County Department of Law and Public Safety | Morris County DPS | **New York/NJ** (MetLife Stadium) | **No FIFA/World Cup reference** in opportunity name. Morris County is ~30 miles from MetLife Stadium in NJ. Included because it was in the Salesforce report, but may be a separate (non-World Cup) deal. |

---

## 6. Ownership Types

Each piece of equipment is tagged with an ownership type:

| Type | Meaning | Examples in Data |
|------|---------|-----------------|
| **SLTT** | State, Local, Tribal, or Territorial government | Dallas PD, NYPD, GA Bureau of Investigation, Miami-Dade Sheriff Office, Morris County DPS |
| **Federal** | Federal government agency | DHS S&T |
| **Private** | Private sector / commercial (e.g., NFL stadium, venue security) | *None in current data — available for future deals* |

---

## 7. Deal Tracking Fields

Each equipment entry has three status fields that can be updated as deals progress:

| Field | Values | Meaning |
|-------|--------|---------|
| **Deal Status** | `Open` / `Closed` | Whether the Salesforce opportunity is still open or has been closed-won |
| **Delivery Ready** | `Yes` / `No` / `Partial` | Whether the equipment is manufactured, configured, and ready to ship |
| **Delivered** | `Delivered` / `In Transit` / `Pending` | Physical delivery status to the venue |

**Current defaults:** All deals from the Salesforce report are loaded as **Open / Not Ready / Pending** since delivery status was not in the source data. These should be updated manually as deals close and equipment ships.

---

## 8. Quantity Handling

- The **Quantity** field from Salesforce is used as-is for each hardware line item
- The **Record Count** (number of Salesforce line items) is **not** used — only the product quantity matters
- When the same product appears on multiple lines within the same opportunity (e.g., two separate line items for Dedrone Defender II at qty 4 each), the quantities are **summed** into a single entry (e.g., Defender II qty 8)

---

## 9. Map Marker Colors

| Color | Meaning |
|-------|---------|
| **Green** | All equipment at this city has been delivered |
| **Blue** | Equipment is in progress (some in transit, some delivered) |
| **Red** | City has open deals that need attention |
| **Gray** | No deals in the Salesforce pipeline for this city yet |
| **Amber (selected)** | The currently selected/clicked city |

---

## 10. Federal Pool

The **DHS S&T** opportunity (`DDL-DHS-S&T - ADVANCED TRAILER #1 (15) - FIFA WORLD CUP`) contains 15 Titan 4 units and 15 Advanced Trailers intended for deployment **across all World Cup venues**. Since these are not assigned to a specific city, they are displayed in a separate **Federal Pool** banner at the top of the dashboard rather than under any single city.

---

## 11. Cities With No Data

Six host cities currently have **no Salesforce opportunity data** in the loaded report:

- Los Angeles (SoFi Stadium)
- San Francisco Bay Area (Levi's Stadium)
- Houston (NRG Stadium)
- Seattle (Lumen Field)
- Boston (Gillette Stadium)
- Vancouver (BC Place)

These cities still appear on the map (gray markers) and in the sidebar (under "Awaiting Deals"). They will populate automatically when new Salesforce data is loaded for those venues.

---

## 12. How to Update Data

The data file is located at:

```
worldcup-dashboard/src/data/cities.ts      — per-city equipment and support teams
worldcup-dashboard/src/data/federalPool.ts  — DHS S&T federal pool assets
```

To update deal statuses, delivery readiness, or add new equipment, edit the relevant entries in these files. Each equipment item follows this structure:

```typescript
{
  id: 'unique-id',
  name: 'Display Name',
  model: 'Model/SKU',
  quantity: 5,
  ownership: 'SLTT',        // 'SLTT' | 'Federal' | 'Private'
  ownerName: 'Agency Name',
  dealStatus: 'open',       // 'open' | 'closed'
  deliveryReady: 'no',      // 'yes' | 'no' | 'partial'
  delivered: 'pending',     // 'delivered' | 'in-transit' | 'pending'
}
```
