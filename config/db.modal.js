const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: function () {
        return this.role === "user" || this.role === "admin";
      },
      validate: {
        validator: function (value) {
          if (this.role === "superadmin" && value) {
            return false;
          }
          return true;
        },
        message: "Superadmin should not be associated with any branch.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const branchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

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

incomeSchema.pre("save", function (next) {
  this.quarterAmount = this.amount * 0.25;
  this.tenthAmount = this.amount * 0.1;
  this.twentiethAmount = this.amount * 0.05;
  this.lastModified = new Date();
  next();
});

userSchema.index({ email: 1 });
userSchema.index({ branch: 1 });
incomeSchema.index({ user: 1, submissionDate: 1 });
incomeSchema.index({ branch: 1, submissionDate: 1 });

const User = mongoose.model("User", userSchema);
const Branch = mongoose.model("Branch", branchSchema);
const Income = mongoose.model("Income", incomeSchema);

module.exports = {
  User,
  Branch,
  Income,
};
