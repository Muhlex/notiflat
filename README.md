<img src="https://user-images.githubusercontent.com/21311428/194729516-d0bf84dd-7300-49fc-b8a2-3239e82131cc.png" alt="Example Telegram notification" align="right">

# Notiflat

This small Node.js tool written in TypeScript allows users to receive instant notifications (currently Telegram only) for new real estate listings on online platforms (currently German "eBay Kleinanzeigen" and "WG-Gesucht.de").

## Usage
- Use Node.js version 16 or above
- Set your configuration options in `src/config.json`
	- Provide a Telegram bot HTTP token and chat IDs to send the notifications to (https://core.telegram.org/bots#how-do-i-create-a-bot). When not providing Telegram data, only unformatted output will be sent to console.
	- Provide search query URLs (the address of the search results page) for the services and search filters you want to be notified of. Make sure they are sorted by newest listings first. Examples are already setup.
	- Use the `detailed` option to allow an extra HTTP request to fetch extended data of a listing.
- Start the tool:
```shell
npm install
npm run start
```
- While the script is running, notifications will be sent to the specified Telegram chats.
