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

app.use(express.json({ limit: "50mb" }));

const uri = process.env.MONGOURI;

const client = new MongoClient(uri);
const db = client.db("Yuksalish");

const bot = new Telegraf(process.env.TOKEN);

const web_link = process.env.WEBAPP;

const submitAnketText = "";

const startText = `Доброго времени суток, Уважаемый кандидат… Благодарим за проявленный интерес к нашей компании… Просим Вас ответить на наши стандартные вопросы, тем самым оставив заявку в нашей базе данных… 

Assalomu alaykum, Xurmatli nomzod... Kompaniyamizga bo'lgan qiziqishingiz uchun tashakkur... Sizdan standart savollarimizga javob berishingizni so'raymiz va shu bilan o'zingiz haqingizdagi ma'lumotlarni bazamizda qoldirasiz …`;
bot.start(async ctx => {
  try {
    ctx.reply(startText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Anketa to'ldirish", web_app: { url: web_link } }],
        ],
      },
    });
  } catch (error) {}
});

app.post("/create-anketa", async (req, res) => {
  const HR = 1430918021;
  try {
    await db
      .collection("anketas_of_users")
      .insertOne({ ...req.body, createdAt: new Date() });

    const send = async (obj, path) => {
      bot.telegram.sendMessage(obj.user_id, submitAnketText);
      bot.telegram.sendPhoto(
        HR,
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
  } catch (error) {
    console.log(error);
  }
});

bot.launch();
app.listen(process.env.PORT || 5002, () => {
  console.log("lisening ");
});
