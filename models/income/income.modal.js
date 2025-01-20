const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const incomeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

incomeSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
incomeSchema.index({ user: 1, submissionDate: 1 });
incomeSchema.index({ branch: 1, submissionDate: 1 });

incomeSchema.pre("save", function (next) {
  this.quarterAmount = this.amount * 0.25;
  this.tenthAmount = this.amount * 0.1;
  this.twentiethAmount = this.amount * 0.05;
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model("Income", incomeSchema);