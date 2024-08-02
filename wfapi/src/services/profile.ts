import {
  ModelAddableProfile,
  ModelProfileId,
} from "../model/interfaces/profile";

const getTrimmedWords = (stringToSplit: string) =>
  stringToSplit.trim().split(/\s+/);

const extractGivenNameFromDisplayName = (displayName: string) => {
  const displayNameWords = getTrimmedWords(displayName);

  if (displayNameWords.length >= 2) {
    displayNameWords.pop();
  }

  return displayNameWords.join(" ");
};

const extractSurnameFromDisplayName = (displayName: string) => {
  const displayNameWords = getTrimmedWords(displayName);

  if (displayNameWords.length >= 2) {
    return displayNameWords.pop();
  } else {
    return "";
  }
};

export const initialiseAddableProfile = (
  profileId: ModelProfileId,
  displayName: string,
  email: string
) => {
  const newProfile: ModelAddableProfile = {
    profileId,
    displayName,
    email,
    version: 1,
    givenName: extractGivenNameFromDisplayName(displayName),
    surname: extractSurnameFromDisplayName(displayName),
    address: "",
    telephone: "",
  };

  return newProfile;
};
