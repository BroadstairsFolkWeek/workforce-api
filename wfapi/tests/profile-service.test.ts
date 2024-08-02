import { ModelProfileId } from "../src/model/interfaces/profile";
import { initialiseAddableProfile } from "../src/services/profile";

const testProfileId = ModelProfileId.make("profileId");
const testDisplayName = "displayName";
const testEmail = "email";

test("Initialised profile includes given profileId, displayName and email", () => {
  const actual = initialiseAddableProfile(
    testProfileId,
    testDisplayName,
    testEmail
  );

  expect(actual.profileId).toEqual(testProfileId);
  expect(actual.displayName).toEqual(testDisplayName);
  expect(actual.email).toEqual(testEmail);
});

test("Initialised profile has version 1", () => {
  const actual = initialiseAddableProfile(
    testProfileId,
    testDisplayName,
    testEmail
  );

  expect(actual.version).toEqual(1);
});

test("Initialised profile derives givenName from displayName", () => {
  const getGivenName = (dn: string) =>
    initialiseAddableProfile(testProfileId, dn, testEmail).givenName;

  expect(getGivenName("")).toEqual("");

  expect(getGivenName("AAA")).toEqual("AAA");

  expect(getGivenName(" AAA")).toEqual("AAA");

  expect(getGivenName(" AAA ")).toEqual("AAA");

  expect(getGivenName("AAA BBB")).toEqual("AAA");

  expect(getGivenName("AAA  BBB")).toEqual("AAA");

  expect(getGivenName("AAA  BBB  CCC")).toEqual("AAA BBB");
});

test("Initialised profile derives surname from displayName", () => {
  const getSurname = (dn: string) =>
    initialiseAddableProfile(testProfileId, dn, testEmail).surname;

  expect(getSurname("")).toEqual("");

  expect(getSurname("AAA")).toEqual("");

  expect(getSurname(" AAA")).toEqual("");

  expect(getSurname(" AAA ")).toEqual("");

  expect(getSurname("AAA BBB")).toEqual("BBB");

  expect(getSurname("AAA  BBB")).toEqual("BBB");

  expect(getSurname("AAA  BBB  CCC")).toEqual("CCC");

  expect(getSurname("AAA  BBB  CCC ")).toEqual("CCC");
});
