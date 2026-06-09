const { AttachmentBuilder, Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_CHANNEL_ID = "1513852109441990696";

discordClient.login(DISCORD_BOT_TOKEN);
discordClient.once('ready', async () => {
    console.log('Logged in.');
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const buffer = Buffer.from(base64Data, 'base64');
    const attachment = new AttachmentBuilder(buffer, { name: `webcam-test.png` });
    try {
        const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
        await channel.send({ content: "test", files: [attachment] });
        console.log('Sent successfully');
    } catch(e) {
        console.error('Error:', e);
    }
    process.exit(0);
});
