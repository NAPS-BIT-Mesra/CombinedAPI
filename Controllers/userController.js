const User = require("../Models/UserModel");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const filterObj = (updateObj, filter) => {
  const objkeys = Object.keys(updateObj);
  objkeys.forEach((el) => {
    if (!filter.includes(el)) {
      delete updateObj[el];
    }
  })
  return updateObj;
}

exports.protect = async (req, res, next) => {
  const user = await User.findOne({ rollNum: req.body.rollNum }).select(
    "+password"
  );
  if (!user) {
    return res.status(400).json({
      message: "Either UserName or Password Wrong",
    });
  }
  if(user.active===false){
    return res.status(400).json({
      status: "fail",
      message: "User inactive, contact Admin"
    });
  }
  const compare = await user.correctPassword(req.body.password, user.password);
  if (compare) return next();
  if (!user || !compare) {
    return res.status(401).json({
      message: "Either UserName or Password Wrong",
    });
  }
};

exports.checkJWT = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (req.cookies) {
    if (req.cookies.jwt) token = req.cookies.jwt;
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    res.status(401).json({
      message: "Invalid User",
    });
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(400).json({
      message: "Token Expired, Login again",
    });
  }
  req._id = decoded.id;
  next();
};

exports.UpdateUser = async (req, res, next) => {
  const updateObj = {...req.body};
  const filteredObj = filterObj(updateObj,["name","profilePhoto","email","rollNum"]);
  const ExistingUser = await User.findById(req._id);
  if(!ExistingUser){
    return res.status(400).json({
      "status": "fail",
      "message": "User does not exist"
    });
  }
  ExistingUser.name = filteredObj.name;
  ExistingUser.rollNum = filteredObj.rollNum;
  ExistingUser.profilePhoto = filteredObj.profilePhoto;
  ExistingUser.email = filteredObj.email;
  await ExistingUser.save();
  res.status(200).json({"status": "Success" ,"message": "User updated", ExistingUser });
};

exports.DeleteUser = async (req, res, next) => {
  const ExistingUser = await User.findById(req.params.id);
  if(!ExistingUser){
    return res.status(400).json({
      "status": "fail",
      "message": "User not found"
    });
  }
  const curUser = await User.findById(req._id);
  if(curUser.role==="owner"||String(curUser._id)===String(ExistingUser._id)){
    await User.findOneAndUpdate({_id:String(ExistingUser._id)},{active:false});
  } else {
    return res.status(400).json({
      "status": "fail",
      "message": "You are not authorized to perform this action"
    });
  }
  return res.status(200).json({ "status": "Success","message": "User Deleted"});
};

exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req._id).select("+password");
  if (!req.body.currentPassword)
    return res.status(400).json({
      status: "fail",
      message: "Please provide the current password",
    });
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return res.status(400).json({
      status: "fail",
      message: "Invalid current Password",
    });
  if (!(await bcrypt.compare(req.body.password, user.password)))
    return res.status(400).json({
      status: "fail",
      message: "New password shall not be same as the old one",
    });
  user.password = req.body.password;
  user.cnfrmPassword = req.body.cnfrmPassword;
  const status = await user.save({ validateBeforeSave: true });
  res.status(201).json({
    status: "success",
    message: "Password Changed",
  });
};
