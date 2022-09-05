const { Telegraf } = require("telegraf");
const { MongoClient, ObjectId } = require("mongodb");

const cors = require("cors");
const express = require("express");

const { config } = require("dotenv");
const Base64ToFile = require("./utils/Base64ToFile.js");
const Caption = require("./utils/Caption.js");
const Keyboards = require("./utils/Keyboards.js");

const app = express();
config();
app.use(cors());

app.use(express.json({ limit: "50mb" }));

const uri = process.env.MONGOURI;

const client = new MongoClient(uri);
const db = client.db("Yuksalish");
const bot = new Telegraf(process.env.TOKEN);

const web_link = process.env.WEBAPP;

const SubmitedAnketText = (surname, name, middleName) => {
  return `Хурматли ${surname} ${name} ${middleName}! Вақтингиз учун раҳмат, анкета кўриб чиқиш учун қабул қилинди... 3 кун ичида сиз билан боғланамиз...
Ўзингизга ва яқинларингизга ғамхўрлик қилинг...
  
Ҳурмат билан,
@yuksalish_anketabot
  _______________________________________________________________
  
Уважаемый(-ая) ${surname} ${name} ${middleName}! Благодарим Вас за уделённое время, анкета принята на рассмотрение... Свяжемся с Вами в течении 3-х дней...
Берегите себя и своих близких...
  
С Уважением,
@yuksalish_anketabot`;
};

const startText = `Ассалому алайкум, Хурматли номзод... Компаниямизга бўлган қизиқишингиз учун ташаккур... Сиздан стандарт саволларимизга жавоб беришингизни сўраймиз ва шу билан ўзингиз ҳақингиздаги маълумотларни базамизда қолдирасиз…
_______________________________________________________________

Доброго времени суток, Уважаемый кандидат… Благодарим за проявленный интерес к нашей компании… Просим Вас ответить на наши стандартные вопросы, тем самым оставив заявку в нашей базе данных…`;
bot.start(async ctx => {
  try {
    ctx.reply(startText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Анкета тўлдириш", web_app: { url: web_link } }],
        ],
      },
    });
  } catch (error) {}
});
const recievers = [5727877786, 1425768258];

bot.context.state = {
  message: 0,
};

bot.command("message", async ctx => {
  if (!recievers.includes(ctx.message.from.id)) {
    ctx.reply("Siz admin emassiz!!!");
    return;
  }
  try {
    ctx.state.message = 1;
    const fils = await db.collection("filials").find().toArray();
    const mapedFils = fils.map(f => ({ text: f.nomi }));
    const keys = Keyboards(mapedFils);
    ctx.reply("Filial tanlang!", {
      reply_markup: {
        keyboard: keys,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

bot.on("message", async ctx => {
  if (ctx.state.message === 1) {
    const work_district_id = await db
      .collection("filials")
      .findOne({ nomi: ctx.message.text }, { _id: 1 });
    ctx.state.message = 2;
    ctx.state.filial_id = work_district_id.nomi;
    ctx.reply("SMS so'zini jo'nating");
    return;
  }

  if (ctx.state.message === 2 && ctx.state.filial_id) {
    try {
      ctx.reply("SMS habar jo'natilmoqda...");
      const users = await db
        .collection("anketas_of_users")
        .aggregate([
          {
            $match: {
              work_district_id_nomi: ctx.state.filial_id,
            },
          },
          {
            $project: {
              user_id: 1,
            },
          },
        ])
        .toArray();

      for (const user of users) {
        bot.telegram.sendMessage(user.user_id, ctx.message.text);
      }

      ctx.reply("Barchaga sms xabar jo'natilindi");

      ctx.state.message = 0;
      ctx.state.filial_id = null;
    } catch (error) {
      console.log(error);
    }
  }
});

app.post("/create-anketa", async (req, res) => {

  try {
    await db
      .collection("anketas_of_users")
      .insertOne({ ...req.body, createdAt: new Date() });

    const send = async (obj, path) => {
      bot.telegram.sendPhoto(
        obj.user_id,
        { source: path || "avatar.png" },
        {
          caption: await Caption(obj, db),
        }
      );
      setTimeout(() => {
        bot.telegram.sendMessage(
          obj.user_id,
          SubmitedAnketText(obj.surname, obj.name, obj.middleName)
        );
      }, 1000);

      for (const re of recievers) {
        bot.telegram.sendPhoto(
          re,
          { source: path || "avatar.png" },
          {
            caption: await Caption(obj, db),
          }
        );
      }
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
