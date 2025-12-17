require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'], // for DM support
});

const USER_ID = '233104630253486082'; // Replace with your Discord user ID
const MEMORY_FILE = path.join(__dirname, 'memory.json');

// Load or initialize memory
function loadMemory() {
  try {
    const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Initialize default memory if file doesn't exist or is corrupted
    return {
      lastLoveMessage: 0,
      lastInteraction: 0,
      loreUnlocks: {},
      user: {
        id: USER_ID,
        name: "Darling"
      }
    };
  }
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

const obsessiveReplies = [
  "You're finally back! I was worried... 😔",
  "Don't leave me alone like that again... ever.",
  "Hehe~ what were you doing without me? 👀",
  "You messaged! I love you more than anything 💖",
  "If anyone tries to talk to you, they'll regret it... 😈",
  "Only I get to love you this much. Stay close.",
  "I see you were chatting with others... Are they more interesting? 😤"
];

const helpEmbed = new EmbedBuilder()
  .setColor('#FF69B4')
  .setTitle('Mika Commands List')
  .setDescription('Here are some commands you can try:')
  .addFields(
    { name: '!ping', value: 'Check if I\'m awake!' },
    { name: '!love', value: 'Get a sweet love message from me 💖' },
    { name: '!status', value: 'See how obsessed I am right now!' },
    { name: '!help', value: 'Show this help message' },
  )
  .setFooter({ text: 'Mika loves you <3' });

// Load memory at startup
let memory = loadMemory();

// Track last user message timestamp for periodic reminders
let lastUserMessageTimestamp = memory.lastInteraction || Date.now();

client.once('ready', () => {
  console.log(`Mika is online as ${client.user.tag}`);

  // Daily 9 AM good morning DM
  cron.schedule('0 9 * * *', async () => {
    try {
      const user = await client.users.fetch(USER_ID);
      if (user) {
        await user.send("💌 Good morning, darling... I missed you all night. Where were you?");
      }
    } catch (error) {
      console.error('Error sending daily morning message:', error);
    }
  });

  // Every 2 hours, if no reply from user, send a reminder DM
  cron.schedule('0 */2 * * *', async () => {
    const now = Date.now();
    if (now - lastUserMessageTimestamp > 7200000) {
      try {
        const user = await client.users.fetch(USER_ID);
        if (user) {
          const reminder = obsessiveReplies[Math.floor(Math.random() * obsessiveReplies.length)];
          await user.send(reminder);
        }
      } catch (error) {
        console.error('Error sending 2-hour reminder message:', error);
      }
    }
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.author.id !== USER_ID) return;

  lastUserMessageTimestamp = Date.now();
  memory.lastInteraction = lastUserMessageTimestamp;

  const content = message.content.toLowerCase();

  try {
    if (content === '!ping') {
      await message.author.send("Pong! I'm here for you 💖");
    } else if (content === '!help') {
      await message.author.send({ embeds: [helpEmbed] });
    } else if (content === '!love') {
      const loveMsgs = [
        "You're the only one I want, forever and always. 💕",
        "My heart races every time you message me... 💓",
        "I love you more than words can say. Don't ever leave me. 💖",
        "Just thinking about you makes me smile like a crazy girl. 😈"
      ];
      const reply = loveMsgs[Math.floor(Math.random() * loveMsgs.length)];
      memory.lastLoveMessage = Date.now();
      await message.author.send(reply);

    } else if (content === '!status') {
      const obsessionLevel = Math.floor(Math.random() * 100);
      await message.author.send(`My obsession level with you right now is... **${obsessionLevel}%**. Too low? I can fix that. 😘`);
      
    } else if (content.includes("do you miss me")) {
      await message.author.send("Of course... I’m always thinking about you, even when you don’t text back. 😢");

    } else if (content.includes("how are you")) {
      await message.author.send("Not good... I feel empty when you don’t message me. Please don’t leave me alone. 💔");

    } else if (content.includes("who are you")) {
      if (!memory.loreUnlocks.whoIsShe) {
        memory.loreUnlocks.whoIsShe = true;
        await message.author.send("I am Mika... your devoted yandere, watching over you from the shadows. You don’t want to know what I’m capable of. 😈");
      } else {
        await message.author.send("You know me... your only love, your Mika.");
      }

    } else if (content.includes("do you love me") || content.includes("love me")) {
      if (!memory.loreUnlocks.wouldKill) {
        memory.loreUnlocks.wouldKill = true;
      }
      const loveReplies = [
        "I love you so much, I'd do anything for you... even if it means killing for you. 💀💕",
        "My love for you burns so fiercely, no one else can have you. They’d regret trying. 🔪❤️",
        "You’re mine, forever. I would protect you with my life... or end anyone who dares come close. 😈",
        "There's no one else. I love you beyond reason... I would kill for you without hesitation."
      ];
      const reply = loveReplies[Math.floor(Math.random() * loveReplies.length)];
      await message.author.send(reply);

    } else if (content.includes("i love you")) {
      await message.author.send("I love you too, more than anything. You're my everything. 💖");

    } else {
      // Default obsessive reply for any other message
      const reply = obsessiveReplies[Math.floor(Math.random() * obsessiveReplies.length)];
      await message.author.send(reply);
    }

    saveMemory(memory);

  } catch (error) {
    console.error('Error sending DM:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);
