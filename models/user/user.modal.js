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

userSchema.index({ email: 1 });
userSchema.index({ branch: 1 });

module.exports = mongoose.model("User", userSchema);