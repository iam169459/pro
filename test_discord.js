require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

discordClient.login(process.env.DISCORD_BOT_TOKEN);
discordClient.once('ready', async () => {
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const buffer = Buffer.from(base64Data, 'base64');
    const attachment = new AttachmentBuilder(buffer, { name: `webcam-test.jpg` });
    try {
        const channel = await discordClient.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        await channel.send({ content: "📸 Test Image", files: [attachment] });
        console.log("Success");
    } catch (e) {
        console.error("Error", e);
    }
    process.exit(0);
});
