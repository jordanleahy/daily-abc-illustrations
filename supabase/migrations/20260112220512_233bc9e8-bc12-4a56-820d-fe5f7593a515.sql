-- Add Whistler Blackcomb and Plattekill Mountain to all book creation agents
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'KEYSTONE: 🌙 Keystone (Colorado)
SKIP_LOCATION: ⏭️ Skip - No specific location',
  'KEYSTONE: 🌙 Keystone (Colorado)
WHISTLER_BLACKCOMB: 🇨🇦 Whistler Blackcomb (British Columbia)
PLATTEKILL: 🗽 Plattekill Mountain (New York)
SKIP_LOCATION: ⏭️ Skip - No specific location'
),
updated_at = now()
WHERE is_latest = true
  AND instructions LIKE '%VAIL_RESORT%'
  AND instructions NOT LIKE '%PLATTEKILL%';