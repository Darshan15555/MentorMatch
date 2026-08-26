// Applied to every schema so API responses look the same as before:
// `id` instead of `_id`, no __v, dates as ISO strings.
function idTransform(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    },
  });
}

module.exports = { idTransform };
