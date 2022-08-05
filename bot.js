const { Telegraf } = require("telegraf");
const { MongoClient } = require("mongodb");

const fs = require("fs");
const cors = require("cors");
const express = require("express");

const ViloyatData = require("./data/ViloyatData.js");
const ShaharTumanData = require("./data/ShaharTumanData.js");
const OccupationData = require("./data/OccupationData.js");

const moment = require("moment");
const Base64ToFile = require("./utils/Base64ToFile.js");

const app = express();

app.use(cors());

app.use(express.json({ limit: "30mb" }));

const uri =
  "mongodb+srv://codapp:nThMt1A3wrqQd8EV@cluster0.izhwl.mongodb.net/Yuksalish?retryWrites=true&w=majority";

const client = new MongoClient(uri);
const db = client.db("Yuksalish");

const bot = new Telegraf("5593163136:AAFfYEFGJwobMOlL2MZHOnb2_nsjUAh9O2M");

const web_link = "https://zippy-fairy-cf8470.netlify.app";
bot.start(async ctx => {
  const user_id = ctx.message.from.id;
  const chat_id = ctx.message.chat.id;
  try {
    await db
      .collection("anketa_users")
      .updateOne({ user_id }, { $set: { chat_id } }, { upsert: true });
    ctx.reply(
      "Assalomu alaykum Yuksalish Anketa to'ldirish botiga xush kelibsiz!",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Anketa to'ldirish", web_app: { url: web_link } }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

app.post("/create-anketa", (req, res) => {
  console.log("hi");
  try {
    db.collection("anketas_of_users").insertOne(req.body);

    Base64ToFile(req.body.photo, path => {
      const obj = req.body;
      bot.telegram.sendPhoto(
        req.body.user_id,
        { source: path || "image.png" },
        {
          caption: `👤: ${obj.name} ${obj.surname} ${
            obj.middleName
          }\n📆: ${moment(obj.birthday).format("DD/MM/yyyy")}\n📍: ${
            ViloyatData.find(d => d.id == obj.living_region_id)?.nomi
          } ${
            ShaharTumanData.find(d => d.id == obj.living_district_id)?.nomi
          } ${obj.address}\n👨‍👩‍👧‍👦: ${obj.marriage_state}\n💼: ${
            obj.specialization
          }\n📞: ${obj.phone}\n🧳: ${obj.experience}\n🎓: ${
            obj.position
          }\n🏫: ${obj.talim_info}\n🧑‍💻: ${obj.softwares.join(
            ", "
          )}\n🇷🇺🇺🇿🇺🇸: ${obj.languages.join(", ")}\n🔍📍: ${
            obj.work_district_id
          }\n🧰: ${
            OccupationData.find(d => d.id == obj.occupation_type)?.nomi
          }\n💰: ${obj.salary}`,
        }
      );

        // setTimeout(() => {
        //   fs.unlinkSync(path)
        // }, 1000);
    });

    res.send("done");
  } catch (error) {}
});


app.listen(process.env.PORT || 5002, () => {
  console.log("lisening ");
});
