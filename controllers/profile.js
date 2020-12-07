const profileRouter = require("express").Router();
const axios = require("axios");
const Profile = require("../models/Profile");
const Upload = require("../models/Upload");
const AWS = require("aws-sdk");
const config = require("../utils/config");

// Middleware
const verify = require("../middleware/verifyToken");

// Create AWS S3 instance
const s3 = new AWS.S3({
  accessKeyId: config.AWS_ID,
  secretAccessKey: config.AWS_SECRET,
});

function sortProfilesAlphabetically(a, b) {
  if (a.profileName < b.profileName) {
    return -1;
  }
  if (a.profileName > b.profileName) {
    return 1;
  }
  return 0;
}

// Get profiles route
// @route POST api/profiles
// @desc retrieve profiles for user
// @access Public
profileRouter.get("/profiles", verify, async (req, res) => {
  try {
    console.log("HERE--------------------");
    console.log(req.user.id);
    const userId = req.user.id;
    const profileArray = [];
    let profileObj = {};

    const profiles = await Profile.find({ userId: userId });

    profiles.map((profile) => {
      profileObj = {
        id: profile.id,
        profileName: profile.profileName,
        image: profile.imageUrl,
      };

      profileArray.push(profileObj);
    });

    res.json({
      profiles: profileArray,
    });
  } catch (err) {
    console.log(err);
  }
});

// Get Facial matches for profiles
// @route GET api/profiles
// @desc Get matches for profiles
// @access Public
profileRouter.get("/getProfileMatches", verify, async (req, res) => {
  console.log("PROFILE MATCHES");
  const userId = req.user.id;
  // Object with profile with matches
  const profileObject = {};
  let collectionArray = [];
  // Array for all matched images
  let allMatches = [];
  // Array for images with no matches
  let noMatches = [];

  try {
    const resp = await axios.get(
      `https://cnl6xcx67l.execute-api.eu-west-2.amazonaws.com/live/getprofilematches?collectionId=${userId}`
    );

    const data = resp.data;

    // Get all uploads from user
    // Store uploads imageUrls in array
    uploadsArr = [];
    const uploadsRes = await Upload.find({ userId: userId });
    console.log("UPLOADS: ", uploadsRes);
    console.log("MATCHES: ", data);

    uploadsRes.forEach((upload) => {
      uploadsArr.push(upload.imageUrl);
    });

    // console.log("UPLOADS: ", uploadsArr);
    // console.log("DATA: ", data);

    // Loop through profiles
    for (i = 0; i < data["profiles"].length; i++) {
      let matchArr = [];

      let profile = await Profile.findOne({
        imageName: data["profiles"][i]["source"],
      });

      let profileMatches = data["profiles"][i]["matches"];
      for (x = 0; x < profileMatches.length; x++) {
        // Match profile name with corresponding image
        let matchR = uploadsArr.find((res) => res.includes(profileMatches[x]));
        matchArr.push(matchR);
      }

      allMatches = allMatches.concat(matchArr);

      if (profile) {
        let profileObj = {
          profileName: profile.profileName,
          matchLength: matchArr.length,
          matches: matchArr,
        };
        collectionArray.push(profileObj);
      }
    }

    // Filter matches array for duplicates
    let matched = allMatches.filter(
      (item, index) => allMatches.indexOf(item) === index
    );

    // Loop through uploads and filter images that had no matches
    uploadsArr.map((upload) => {
      if (!matched.includes(upload)) {
        noMatches.push(upload);
      }
    });

    // Sort Alphabetically
    collectionArray.sort(sortProfilesAlphabetically);

    // Create object for no matches profile
    let otherObj = {
      profileName: "Other",
      matchLength: noMatches.length,
      matches: noMatches,
    };

    // Push no matches to collection
    collectionArray.push(otherObj);
    console.log("COLLECTION: ", collectionArray);

    res.json(collectionArray);
  } catch (err) {
    console.log(err);
  }
});

// Delete profile route
// @route POST api/profiles
// @desc Delete a specific profile
// @access Public
profileRouter.post("/deleteProfile", verify, async (req, res) => {
  const profileId = req.body.id;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ _id: profileId });

    const imageName = profile.imageName;

    // AWS S3 Bucket config
    const params = {
      Bucket: "face-watch-profiles",
      Key: `${userId}/${imageName}`,
    };

    // Remove profile from S3 bucket
    await s3.deleteObject(params).promise();
    await profile.remove();

    res.json({
      status: 200,
      msg: "ok",
    });
  } catch (err) {
    res.json({
      status: 500,
      msg: "Something went wrong!",
    });
  }
});

// Delete Image route
// @route POST api/profiles
// @desc Delete a specific Image from the gallery
// @access Public
profileRouter.post("/deleteImage", verify, async (req, res) => {
  console.log("DELETE IMAGE");

  // console.log(req.body.image);
  // console.log(req.user.id);

  try {
    // Check if image req passed
    if (req.body.image) {
      const userId = req.user.id;
      const imageUrl = req.body.image;

      // Check if image exist in db
      const uploadedImage = await Upload.findOne({ imageUrl });
      console.log(uploadedImage);
      const imageKey = `${userId}/${imageUrl.split("/")[4]}`;
      console.log(imageKey);

      // Set AWS image params
      const params = {
        Bucket: "face-watch",
        Key: imageKey,
      };

      // Delete image from aws
      await s3.deleteObject(params).promise();

      // Delete image from db
      await uploadedImage.remove();

      res.json({
        status: 200,
        msg: "ok",
      });
    }
  } catch (err) {
    res.json({
      status: 500,
      msg: "Something went wrong!",
    });
  }

  // res.json({ status: 200, msg: "hello" });
});

module.exports = profileRouter;
