import { AST, Schema as S } from "@effect/schema";
import { ParseResult } from "@effect/schema";
import { ModelProfileId } from "./profile";

const returnParseResult = <T>(value: T | undefined, ast: AST.Transformation) =>
  value
    ? ParseResult.succeed(value)
    : ParseResult.fail(new ParseResult.Type(ast, value));

export const ModelTShirtSize = S.Literal("S", "M", "L", "XL", "XXL");
export type ModelTShirtSize = S.Schema.Type<typeof ModelTShirtSize>;
export const ModelTShirtSizeFromString = S.transformOrFail(
  S.String,
  ModelTShirtSize,
  {
    decode: (s, _, ast) => {
      const result = ModelTShirtSize.literals.find((el) => el === s);
      return returnParseResult(result, ast);
    },
    encode: (s) => ParseResult.succeed(s),
  }
);

export const ModelAgeGroup = S.Literal(
  "18-20",
  "21-25",
  "26-35",
  "36-55",
  "56-65",
  "66+"
);
export type ModelAgeGroup = S.Schema.Type<typeof ModelAgeGroup>;
export const ModelAgeGroupFromString = S.transformOrFail(
  S.String,
  ModelAgeGroup,
  {
    decode: (s, _, ast) => {
      const result = ModelAgeGroup.literals.find((el) => el === s);
      return returnParseResult(result, ast);
    },
    encode: (s) => ParseResult.succeed(s),
  }
);

export const ModelApplicationStatus = S.Literal(
  "info-required",
  "profile-required",
  "photo-required",
  "documents-required",
  "ready-to-submit",
  "submitted",
  "complete"
);
export type ModelApplicationStatus = S.Schema.Type<
  typeof ModelApplicationStatus
>;
export const ModelApplicationStatusFromString = S.transformOrFail(
  S.String,
  ModelApplicationStatus,
  {
    decode: (s, _, ast) => {
      const result = ModelApplicationStatus.literals.find((el) => el === s);
      return returnParseResult(result, ast);
    },
    encode: (s) => ParseResult.succeed(s),
  }
);

const ModelCoreApplication = S.Struct({
  telephone: S.optional(S.String).pipe(S.fromKey("Telephone")),
  address: S.optional(S.String).pipe(S.fromKey("Address")),
  emergencyContactName: S.optional(S.String).pipe(
    S.fromKey("EmergencyContactName")
  ),
  emergencyContactTelephone: S.optional(S.String).pipe(
    S.fromKey("EmergencyContactTelephone")
  ),
  previousVolunteer: S.optional(S.Boolean).pipe(S.fromKey("PreviousVolunteer")),
  previousTeam: S.optional(S.String).pipe(S.fromKey("PreviousTeam")),
  firstAidCertificate: S.optional(S.Boolean).pipe(
    S.fromKey("FirstAidCertificate")
  ),
  occupationOrSkills: S.optional(S.String).pipe(
    S.fromKey("OccupationOrSkills")
  ),
  dbsDisclosureNumber: S.optional(S.String).pipe(
    S.fromKey("DbsDisclosureNumber")
  ),
  dbsDisclosureDate: S.optional(S.String).pipe(S.fromKey("DbsDisclosureDate")),
  camping: S.optional(S.Boolean).pipe(S.fromKey("Camping")),
  tShirtSize: S.optional(ModelTShirtSizeFromString).pipe(
    S.fromKey("TShirtSize")
  ),
  ageGroup: S.optional(ModelAgeGroupFromString).pipe(S.fromKey("AgeGroup")),
  otherInformation: S.optional(S.String).pipe(S.fromKey("OtherInformation")),
  teamPreference1: S.optional(S.String).pipe(S.fromKey("TeamPreference1")),
  teamPreference2: S.optional(S.String).pipe(S.fromKey("TeamPreference2")),
  teamPreference3: S.optional(S.String).pipe(S.fromKey("TeamPreference3")),
  personsPreference: S.optional(S.String).pipe(S.fromKey("PersonsPreference")),
  availableFirstFriday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableFirstFriday")
  ),
  availableSaturday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableSaturday")
  ),
  availableSunday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableSunday")
  ),
  availableMonday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableMonday")
  ),
  availableTuesday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableTuesday")
  ),
  availableWednesday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableWednesday")
  ),
  availableThursday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableThursday")
  ),
  availableLastFriday: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AvailableLastFriday")
  ),
  constraints: S.optional(S.String).pipe(S.fromKey("Constraints")),
  whatsApp: S.propertySignature(S.Boolean).pipe(S.fromKey("WhatsApp")),
  acceptedTermsAndConditions: S.propertySignature(S.Boolean).pipe(
    S.fromKey("AcceptedTermsAndConditions")
  ),
  consentNewlifeWills: S.propertySignature(S.Boolean).pipe(
    S.fromKey("ConsentNewlifeWills")
  ),
  newlifeHaveWillInPlace: S.propertySignature(S.Boolean).pipe(
    S.fromKey("NewlifeHaveWillInPlace")
  ),
  newlifeHavePoaInPlace: S.propertySignature(S.Boolean).pipe(
    S.fromKey("NewlifeHavePoaInPlace")
  ),
  newlifeWantFreeReview: S.propertySignature(S.Boolean).pipe(
    S.fromKey("NewlifeWantFreeReview")
  ),
  photoId: S.optional(S.String).pipe(S.fromKey("PhotoId")),
  status: S.propertySignature(ModelApplicationStatusFromString).pipe(
    S.fromKey("Status")
  ),
  title: S.propertySignature(S.String).pipe(S.fromKey("Title")),
});

const ModelApplicationMetadata = S.Struct({
  applicationId: S.propertySignature(S.String).pipe(S.fromKey("ApplicationId")),
  profileId: S.propertySignature(ModelProfileId).pipe(S.fromKey("ProfileId")),
  version: S.propertySignature(S.Number).pipe(S.fromKey("Version")),
});

const ModelApplicationPersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  // modifiedDate: S.propertySignature(S.DateFromString).pipe(
  //   S.fromKey("Modified")
  // ),
  lastSaved: S.propertySignature(S.String).pipe(S.fromKey("Modified")),
});

export const ModelPersistedApplication = S.extend(
  ModelCoreApplication,
  S.extend(ModelApplicationMetadata, ModelApplicationPersistanceData)
);

export const ModelApplicationChanges = S.partial(ModelCoreApplication);
export const ModelApplicationChangesVersioned = S.extend(
  ModelApplicationChanges,
  S.Struct({
    version: S.propertySignature(S.Number).pipe(S.fromKey("Version")),
  })
);

export interface ModelPersistedApplication
  extends S.Schema.Type<typeof ModelPersistedApplication> {}

export interface ModelApplicationChanges
  extends S.Schema.Type<typeof ModelApplicationChanges> {}

export interface ModelApplicationChangesVersioned
  extends ModelApplicationChanges {}

export interface ModelEncodedPersistedApplication
  extends S.Schema.Encoded<typeof ModelPersistedApplication> {}

export interface ModelEncodedApplicationChanges
  extends S.Schema.Encoded<typeof ModelApplicationChanges> {}
