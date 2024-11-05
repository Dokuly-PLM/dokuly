import React, { Component } from "react";

let profileImageUrl = "";
let formatedProfileImageUrl = "";

export function getProfileImageUrl(profiles, id) {
  let profileImageUrl = "";
  let formatedProfileImageUrl = "";

  if (profiles != null) {
    profiles.map((profile) =>
      id == profile.user ? (profileImageUrl = profile.profile_image) : "",
    );

    if (profileImageUrl != null) {
      var n = profileImageUrl.search("8000");
      let str = profileImageUrl.substring(n + 5);

      formatedProfileImageUrl = "../../static/" + str;
    } else return "";
  }
  return formatedProfileImageUrl;
}

export function getProfileAndImageUrl(profiles, id) {
  let filePath = "../../static";
  if (profiles?.length > 0) {
    for (let i = 0; i < profiles.length; i++) {
      if (parseInt(profiles[i].user) == id) {
        if (
          profiles[i].profile_image !== "" &&
          profiles[i].profile_image !== null &&
          profiles[i].profile_image !== undefined
        ) {
          return filePath + profiles[i].profile_image;
        }
        return "";
      }
    }
  }
  return "";
}

export function formatProfileImageUrl(profileImageUrl) {
  let formatedProfileImageUrl = "";
  if (profileImageUrl != null) {
    var n = profileImageUrl.search("8000");
    let str = profileImageUrl.substring(n + 5);

    formatedProfileImageUrl = "../../static/" + str;
  } else return "";
  return formatedProfileImageUrl;
}

export function formatProfileImageV2(url) {
  let filePath = "../../static" + url;
  return filePath;
}

export function loadProfileName(profiles, id) {
  let fullName = "";
  profiles.map((profile) =>
    parseInt(id) === parseInt(profile.id)
      ? (fullName = profile.first_name + " " + profile.last_name)
      : "",
  );
  return fullName;
}
