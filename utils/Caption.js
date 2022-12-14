const ViloyatData = require("../data/ViloyatData.js");
const ShaharTumanData = require("../data/ShaharTumanData.js");

const moment = require("moment");
module.exports = async (obj, db) => {
  const fils = await db
    .collection("filials")
    .find({}, { _id: 1, nomi: 1 })
    .toArray();
  const lavs = await db.collection("lavozims").find().toArray();

  return `π€: ${obj.name} ${obj.surname} ${obj.middleName}\nπ: ${moment(
    obj.birthday
  ).format("DD/MM/yyyy")}\nπ: ${
    ViloyatData.find(d => d.id == obj.living_region_id)?.nomi
  } ${ShaharTumanData.find(d => d.id == obj.living_district_id)?.nomi} ${
    obj.address
  }\nπ¨βπ©βπ§βπ¦: ${obj.marriage_state}\nπΌ: ${obj.specialization}\nπ: ${
    obj.phone
  }\nπ§³: ${obj.experience}\nπ: ${obj.position}\nπ«: ${
    obj.talim_info
  }\nπ§βπ»: ${obj.softwares.join(", ")}\nπ·πΊπΊπΏπΊπΈ: ${obj.languages.join(
    ", "
  )}\nππ: ${fils.find(d => d._id == obj.work_district_id)?.nomi}\nπ§°: ${
    lavs.find(d => d._id == obj.occupation_type)?.nomi
  }\nπ°: ${obj.salary}\nπͺ: ${obj.relative_info}\nπ: ${
    obj.far_away_working
  }\nπ€: ${obj.happy}`;
};
