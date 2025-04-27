## What it does
Reads your logs and sends the public channel info to the API.  If your mule hasn't gotten a message for 5 minutes, it will close and re-open the Client1 window (aka the first initially opened everquest client) and log back in.

## Requires:
- Windows
- AutoHotKey
- A separate EQ client folder just for your mule, so the last server/character is always quarm/your mule

## To run it:
- Open log-reader.exe, which will create a config.json file and maybe crash
- Update config.json with your  eqMulePassword, eqDirectory (like "C:\Games\EverQuest Mule"), and apiKey (which should match the admin apiKey on the API).
- Re-open log-reader.exe

## Build:
Run `npm run build` to generate a log-reader.exe
