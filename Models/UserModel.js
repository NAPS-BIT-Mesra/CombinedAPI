const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Kindly, provide the name"],
    validate: {
      validator: function (el) {
        if (!validator.isAlpha(el, "en-US", { ignore: " " })) {
          return false;
        }
        return true;
      },
      message: "Name should not contain special keys or digits",
    },
  },
  email: {
    type: String,
    required: [true, "Kindly, provide the mailId"],
    validate: {
      validator: function (el) {
        if (!validator.isEmail(el)) return false;
        return true;
      },
      message: "Invalid mail Id",
    },
  },
  rollNum: {
    type: String,
    required: [true, "Kindly, provide the roll number"],
    validate: {
      validator: function (el) {
        if (!el.includes("/")) return false;
        regexp = /\//gi;
        const array = [...el.matchAll(regexp)];
        if (array.length < 2) return false;
        const attribute = el.split("/");
        const attribute1 = attribute[0].toUpperCase();
        const allattribute = [
          "BTECH",
          "IMH",
          "IMS",
          "BARC",
          "IHM",
          "BARC",
          "BPH",
          "BHMCT",
          "IED",
          "MCA",
          "MTECH",
        ];
        if (!allattribute.includes(attribute1)) return false;
      },
      message: "Invalid roll number",
    },
  },
  workEditorial: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "naps_blog",
    },
  ],
  workMediaReport: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "naps_blog",
    },
  ],
  workSiteReport: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "naps_blog",
    },
  ],
  designation: {
    type: String,
    enum: {
      values: [
        "Naps-Member",
        "President",
        "Vice President",
        "Editors-In-Chief",
        "Media Head",
        "Epistle Head",
        "Events' Head",
        "Interviews' Head",
        "Technical Head",
        "Senior Executive Member",
        "General Secretary",
        "Joint-Secretary",
        "Treasure",
        "Joint Treasurer",
        "Deputy Editor",
        "Media Coordinator",
        "Epistle Coordinator",
        "Interviews' Coordinator",
        "Events' Coordinator",
        "Design Head",
        "Technical Coordinator",
        "Executive Member",
      ],
      message: "Designation did not match any of the following list",
    },
    default: "Naps-Member",
  },
  profilePhoto: String,
  password: {
    type: String,
    required: [true, "Kindly, provide the password"],
    minlength: [8, "A password should have minimum length of 8"],
    select: false,
  },
  cnfrmPassword: {
    type: String,
    required: [true, "Kindly, provide the confirm password"],
    validate: {
      validator: function (el) {
        return this.password === el;
      },
      message: "Passwords does not match",
    },
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: ["stage1", "stage2", "stage3", "owner"],
      message:
        "Role cannot be anything other than stage1, stage2, stage3 or owner",
    },
    default: "stage1",
  },
  active: {
    type: Boolean,
    default: true,
  },
  passwordChangedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
userSchema.pre("save", async function (next) {
  // console.log('hi i am in befor e hashing ');
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.cnfrmPassword = undefined;
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("rollNum")) return next();
  const attribute = this.rollNum.split("/");
  const attribute1 = attribute[0].toUpperCase();
  let regex = `${attribute1}`;
  regex = new RegExp(regex, "i");
  next();
});
userSchema.pre(/^update/, async function (next) {
  if (!this.update.rollNum) return next();
  const attribute = this.update.rollNum.split("/");
  const attribute1 = attribute[0].toUpperCase();
  let regex = `${attribute1}`;
  regex = new RegExp(regex, "i");
  next();
});
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const User = mongoose.model("User", userSchema);
module.exports = User;
