const mongoose = require("mongoose");

const mpSchema = new mongoose.Schema(
  {
    mpName: {
      type: String,
      required: true,
      trim: true,
    },

    constituency: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    house: {
      type: String,
      required: true,
      enum: ["Lok Sabha", "Rajya Sabha"],
    },

    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalExpenditure: {
      type: Number,
      required: true,
      min: 0,
    },

    utilizationPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    completedWorks: {
      type: Number,
      required: true,
      min: 0,
    },

    recommendedWorks: {
      type: Number,
      required: true,
      min: 0,
    },

    completionRatePercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    unspentAmount: {
      type: Number,
      min: 0,
    },

    transactionCount: {
      type: Number,
      min: 0,
    },

    successfulPayments: {
      type: Number,
      min: 0,
    },

    pendingPayments: {
      type: Number,
      min: 0,
    },

    averageRating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("mps", mpSchema);
