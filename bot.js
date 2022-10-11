const { Telegraf } = require("telegraf");
const { MongoClient, ObjectId } = require("mongodb");

const cors = require("cors");
const express = require("express");

const { config } = require("dotenv");
const Base64ToFile = require("./utils/Base64ToFile.js");
const Caption = require("./utils/Caption.js");
const Keyboards = require("./utils/Keyboards.js");
const SMSText = require("./utils/SMSText.js");

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
bot.start(async (ctx) => {
  try {
    ctx.reply(startText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Анкета тўлдириш", web_app: { url: web_link } }],
        ],
      },
    });
  } catch (error) {
    console.log(error);
  }
});
const recievers = [451397829, 5727877786, 1425768258];

bot.context.state = {
  message: 0,
};

bot.command("text", (ctx) => {
  ctx.reply(SMSText);
});

bot.command("message", async (ctx) => {
  if (!recievers.includes(ctx.message.from.id)) {
    ctx.reply("Siz admin emassiz!!!");
    return;
  }
  try {
    ctx.state.message = 1;
    const fils = await db.collection("filials").find().toArray();
    const mapedFils = fils.map((f) => ({ text: f.nomi }));
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

// member status

bot.on("my_chat_member", async ctx=> {
  const status = ctx.myChatMember.new_chat_member.status
  const user_id = ctx.myChatMember.chat.id
  let member_status

  if (status === "member") {
    member_status = 1
  }else {
    member_status = 0
  }
  const res =  await db.collection("anketas_of_users").updateMany({user_id: user_id}, {$set:{member_status: member_status}})
  console.log(res);
  
})

bot.on("message", async (ctx) => {
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
      let i = 0;
      ctx.reply("SMS habar jo'natilmoqda...");
      const users = await db
        .collection("anketas_of_users")
        .aggregate([
          {
            $match: {
              work_district_id_nomi: ctx.state.filial_id,
              status: { $ne: false },
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
        i += 1;

        bot.telegram.sendMessage(user.user_id, ctx.message.text);
      }

      ctx.reply(
        "Barchaga sms xabar jo'natilindi(" + i + "ta shaxsga yetkazildi"
      );

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
      .insertOne({ ...req.body, member_status: 1, fio: `${req.body.surname} ${req.body.name} ${req.body.middleName}`, status: 0, createdAt: new Date() });

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
      Base64ToFile(req.body.photo, (path) => {
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


app.post("/send-message", async (req, res)=> {
  const body = req.body
     if (body.user_id && body.message) {
        try { 
          bot.telegram.sendMessage(body.user_id, body.message);
          await db.collection("history_of_anketas").insertOne({user_id: body.user_id, message: body.message, createdAt: new Date()})
          res.status(200).send("done")
        } catch (error) {
          console.log(error);
          res.status(400).json({error})
        }
     }
})

app.post("/send-group-message",async (req, res)=> {
    const body = req.body
    if (body.text && body.users) {
       const sendedUsers = []
       const userIDs = body.users
       for (const userID of userIDs) {
          try {
            bot.telegram.sendMessage(userID, body.text);
            await db.collection("history_of_anketas").insertOne({user_id: userID, message: body.text, createdAt: new Date()})
            sendedUsers.push(userID)
          } catch (error) {
            console.log(error);
          }
       }

       const left = userIDs.filter(x => !sendedUsers.includes(x))

       res.status(200).json(left)
    }else {
      res.status(400).send("provide fields")
    }
})

bot.launch();
app.listen(process.env.PORT || 5002, () => {
  console.log("lisening ");
});
