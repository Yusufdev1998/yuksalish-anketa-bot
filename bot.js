const { Telegraf } = require("telegraf");
const { MongoClient } = require("mongodb");

const cors = require("cors");
const express = require("express");

const { config } = require("dotenv");
const Base64ToFile = require("./utils/Base64ToFile.js");
const Caption = require("./utils/Caption.js");

const app = express();
config();
app.use(cors());

app.use(express.json({ limit: "30mb" }));

const uri = process.env.MONGOURI;

const client = new MongoClient(uri);
const db = client.db("Yuksalish");

const bot = new Telegraf(process.env.TOKEN);

const web_link = process.env.WEBAPP;

const startText = `Salom 👋🏻 
Ushbu bot Yuksalishda labor️ anketalarni to‘ldirish va mehnat uchun mo‘ljallangan!
Bu yerda siz o‘zingizning arizangizni 📄 to‘ldirishingiz ✍️ va bizning kompaniyamizdagi mavjud bo‘sh ish o‘rinlari haqida bilib olishingiz mumkin!`;
bot.start(async ctx => {
  try {
    ctx.reply(startText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Anketa to'ldirish", web_app: { url: web_link } }],
        ],
      },
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/create-anketa", async (req, res) => {
  try {
    await db
      .collection("anketas_of_users")
      .insertOne({ ...req.body, createdAt: new Date() });

    const send = async (obj, path) => {
      bot.telegram.sendPhoto(
        req.body.user_id,
        { source: path || "avatar.png" },
        {
          caption: await Caption(obj, db),
        }
      );
    };
    const obj = req.body;
    if (req.body.photo) {
      Base64ToFile(req.body.photo, path => {
        send(obj, path);
      });
    } else {
      send(obj);
    }

    res.send("done");
  } catch (error) {}
});

bot.launch();
app.listen(process.env.PORT || 5002, () => {
  console.log("lisening ");
});
