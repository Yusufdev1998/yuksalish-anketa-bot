const ViloyatData = require("../data/ViloyatData.js");
const ShaharTumanData = require("../data/ShaharTumanData.js");

const moment = require("moment");
module.exports = async (obj, db) => {
  const fils = await db
    .collection("filials")
    .find({}, { _id: 1, nomi: 1 })
    .toArray();
  const lavs = await db.collection("lavozims").find().toArray();

  return `👤: ${obj.name} ${obj.surname} ${obj.middleName}\n📆: ${moment(
    obj.birthday
  ).format("DD/MM/yyyy")}\n📍: ${
    ViloyatData.find(d => d.id == obj.living_region_id)?.nomi
  } ${ShaharTumanData.find(d => d.id == obj.living_district_id)?.nomi} ${
    obj.address
  }\n👨‍👩‍👧‍👦: ${obj.marriage_state}\n💼: ${obj.specialization}\n📞: ${
    obj.phone
  }\n🧳: ${obj.experience}\n🎓: ${obj.position}\n🏫: ${
    obj.talim_info
  }\n🧑‍💻: ${obj.softwares.join(", ")}\n🇷🇺🇺🇿🇺🇸: ${obj.languages.join(
    ", "
  )}\n🔍📍: ${fils.find(d => d._id == obj.work_district_id)?.nomi}\n🧰: ${
    lavs.find(d => d._id == obj.occupation_type)?.nomi
  }\n💰: ${obj.salary}\n👪: ${obj.relative_info}\n🚕: ${
    obj.far_away_working
  }\n🤗: ${obj.happy}`;
};
