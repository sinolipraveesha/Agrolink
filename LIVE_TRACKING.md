# 🚚 Live Tracking Feature - Uber Style

## Overview
AgroLink idapan Uber wage real-time driver tracking thiyenawa! Buyers/Farmers ta driver location live pennuwan map eke, auto-updates wenawa every 10 seconds.

## Features

### For Drivers 🚛
- **Automatic Location Sync**: Driver location automatic update wenawa Supabase eke every 10 seconds
- **Throttled Updates**: Too many database writes nane - smart throttling thiyenawa
- **Works on All Pages**: 
  - Driver Dashboard (`/driver/dashboard`)
  - Active Trip (`/driver/active-trip`)

### For Buyers/Farmers 👨‍🌾
- **Live Map Tracking**: Real-time driver location map eke
- **Smooth Animations**: Marker eka smooth way eke animate wenawa
- **Status Updates**: Trip status real-time pennuwa
- **Driver Info**: Driver name, vehicle, phone number
- **Route Display**: Pickup and dropoff locations clear way eke
- **Online Indicator**: Driver online da offline da kiyala pennuwa

## How to Use

### Step 1: Driver Side Setup
Driver login una gaman automatic location tracking start wenawa:

1. Driver dashboard ekata yanna: `http://localhost:5173/driver/dashboard`
2. Location permission allow karanna (browser prompt ekaka)
3. System Settings > Privacy & Security > Location Services enable karanna (macOS)
4. Location eka automatic every 10s walata update wenawa database eke

### Step 2: Buyer/Farmer Tracking
Buyer/Farmer ta special link ekak denna ona:

**URL Format:**
```
http://localhost:5173/track?jobId=JOB_ID&driverId=DRIVER_ID
```

**Example:**
```
http://localhost:5173/track?jobId=123&driverId=abc-def-ghi
```

### Step 3: Testing Live Tracking

#### Quick Test:
1. **Driver Browser** eke login wela dashboard ekata yanna
2. **Another Browser/Tab** eke tracking link eka open karanna
3. Driver browser eke location change wenakota (IP change unoth) automatic buyer side eke update wenawa!

#### Manual Location Change for Testing:
Driver dashboard eke:
- Search box eke city name ekak type karanna (e.g., "Kandy", "Galle")
- "Find" click karanna
- Buyer side eke marker eka automatic move wenawa 10 seconds walata!

## Technical Details

### Database Schema
Driver location save wenawa `driver_profiles` table eke:
```sql
current_lat DECIMAL
current_lng DECIMAL
last_updated TIMESTAMP
```

### Real-time Updates
- **Supabase Realtime** use karanawa
- PostgreSQL `UPDATE` events listen karanawa
- Automatic marker animation thiyenawa

### Hooks Used
1. **`useGeolocation`** - GPS/IP location detection
2. **`useSyncDriverLocation`** - Auto-sync to database (drivers)
3. **`useTrackDriver`** - Live tracking subscription (buyers)

### Performance
- Location updates: Every 10 seconds (configurable)
- Smooth marker animations: 1 second transition
- Online status: Last 2 minutes walata
- Throttling: Prevents excessive database writes

## URL Parameters

### Required for `/track` page:
- `jobId` - Transport job ID
- `driverId` - Driver's user ID

### Example with real IDs:
When accepting a load, driver_id save wenawa database eke. Then tracking link eka share karanna:
```javascript
const trackingUrl = `/track?jobId=${job.id}&driverId=${job.driver_id}`;
```

## Browser Compatibility
- ✅ Chrome/Edge (Best)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (GPS permission needed)

## Troubleshooting

### Location not updating?
1. Check browser console for errors
2. Ensure Location Services enabled (System Settings)
3. Check network connection
4. Verify Supabase realtime is working

### "Location unavailable" error?
- GPS nane nam IP-based fallback use wenawa
- Approximate location (city-level) show wenawa
- Manual search use karanna exact location ekata

### Marker not animating smoothly?
- Refresh the page
- Check if `leaflet.smooth_marker_bouncing` installed
- Browser performance issues nam animation disable wenawa

## Production Deployment

### Important:
1. Enable RLS (Row Level Security) on `driver_profiles` table
2. Add proper authentication for tracking URLs
3. Consider rate limiting for location updates
4. Use production Supabase URL and keys
5. Enable HTTPS for geolocation to work on mobile

## Future Enhancements
- [ ] ETA calculation
- [ ] Turn-by-turn navigation
- [ ] Push notifications on status changes
- [ ] Live chat between driver and buyer
- [ ] Route optimization
- [ ] Traffic data integration

---

Made with ❤️ by AgroLink Team
