const Keyboards = extraKeyboards => {
  return new Array(Math.ceil(extraKeyboards.length / 2))
    .fill()
    .map(_ => extraKeyboards.splice(0, 2));
};

module.exports = Keyboards;
