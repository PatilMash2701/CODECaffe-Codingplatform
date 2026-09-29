const mongoose = require('mongoose');

const solutionVideoSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SolutionVideo', solutionVideoSchema);
