import { FormSpec, FormSpecId } from "../../form";

// Hardcoded survey specification representing the Workforce Application Form for 2024.
export const applicationFormQuestionsModel = {
  title: "Workforce Application Form",
  focusFirstQuestionAutomatic: true,
  pages: [
    {
      name: "page1",
      elements: [
        {
          type: "panel",
          name: "availability",
          elements: [
            {
              type: "checkbox",
              name: "daysAvailable",
              title: "What is your availability throughout folkweek?",
              isRequired: true,
              choices: [
                {
                  value: "day1",
                  text: "Friday 9th August",
                },
                {
                  value: "day2",
                  text: "Saturday 10th August",
                },
                {
                  value: "day3",
                  text: "Sunday 11th August",
                },
                {
                  value: "day4",
                  text: "Monday 12th August",
                },
                {
                  value: "day5",
                  text: "Tuesday 13th August",
                },
                {
                  value: "day6",
                  text: "Wednesday 14th August",
                },
                {
                  value: "day7",
                  text: "Thursday 15th August",
                },
                {
                  value: "day8",
                  text: "Friday 16th August",
                },
              ],
              showSelectAllItem: true,
              minSelectedChoices: 1,
            },
          ],
        },
        {
          type: "dropdown",
          name: "ageGroup",
          title: "Which age group are you in?",
          isRequired: true,
          choices: ["18-20", "21-25", "26-35", "36-55", "56-65", "66+"],
        },
        {
          type: "panel",
          name: "emergency-contact",
          elements: [
            {
              type: "text",
              name: "emergencyContactName",
              title: "Emergency Contact Name",
              isRequired: true,
            },
            {
              type: "text",
              name: "emergencyContactTelephone",
              title: "Emergency Contact Telephone",
              isRequired: true,
            },
          ],
          title: "Emergency contact",
        },
        {
          type: "panel",
          name: "previous-volunteer",
          elements: [
            {
              type: "boolean",
              name: "previousVolunteer",
              title: "Have you previously volunteered with BFW?",
              defaultValue: "No",
            },
            {
              type: "text",
              name: "previousTeam",
              visibleIf: "{previousVolunteer} = 'Yes'",
              title: "If yes, which team?",
            },
          ],
        },
        {
          type: "panel",
          name: "panel1",
          elements: [
            {
              type: "dropdown",
              name: "teamPreference1",
              title: "First team preference",
              isRequired: true,
              choices: [
                "Artiste accommodation",
                "Bandstand",
                "Bar",
                "Box Office",
                "Campsite",
                "Campsite office",
                "Children's Events",
                "Collections",
                "Craft Fair Venue",
                "Merchandise Sales",
                "Drivers",
                "Concert Venue",
                "Dance Venue",
                "Lottery ticket sales",
                "Sailing Club",
                "Stage Management",
                "PA Crew / roadies",
                "Technical",
                "Other",
              ],
            },
            {
              type: "dropdown",
              name: "teamPreference2",
              title: "Second team preference",
              choicesFromQuestion: "teamPreference1",
              choicesVisibleIf: "{teamPreference1} != {item}",
            },
            {
              type: "dropdown",
              name: "teamPreference3",
              title: "Third team preference",
              choicesFromQuestion: "teamPreference1",
              choicesVisibleIf:
                "{teamPreference1} != {item} && {teamPreference2} != {item}",
            },
            {
              type: "panel",
              name: "dbs-disclosure",
              elements: [
                {
                  type: "text",
                  name: "dbsDisclosureNumber",
                  title: "DBS disclosure number",
                  isRequired: true,
                },
                {
                  type: "text",
                  name: "dbsDisclosureDate",
                  title: "DBS disclosure date",
                  isRequired: true,
                  inputType: "date",
                },
              ],
              visibleIf:
                "{teamPreference1} = 'Children\\'s Events' or {teamPreference2} = 'Children\\'s Events' or {teamPreference3} = 'Children\\'s Events'",
              title: "DBS disclosure",
              description:
                "DBS disclosure information is required when applying to join the Children's Team",
            },
          ],
          description:
            "Please select the teams you would prefer to work on. Most preferred team first.",
        },
        {
          type: "comment",
          name: "constraints",
          title:
            "Please let us know if you would be unable to perform certain aspects of a role or if you would need extra support.",
          maxLength: 1000,
        },
        {
          type: "text",
          name: "personsPreference",
          title: "Are there any people you would like to work with?",
          description: "If so, please provide their names.",
        },
        {
          type: "boolean",
          name: "firstAidCertificate",
          title: "Do you have a current first aid certificate?",
        },
        {
          type: "text",
          name: "occupationOrSkills",
          title: "Occupation / transferable skills",
        },
        {
          type: "boolean",
          name: "camping",
          title: "Do you want to register for free camping?",
          defaultValue: "false",
        },
        {
          type: "dropdown",
          name: "tShirtSize",
          title: "T shirt size",
          isRequired: true,
          choices: ["S", "M", "L", "XL", "XXL"],
        },
        {
          type: "boolean",
          name: "whatsApp",
          title: "Can we add you to the workforce WhatsApp group?",
        },
        {
          type: "comment",
          name: "otherInformation",
          title: "Any other information you would like to tell us?",
          maxLength: 1000,
        },
        {
          type: "panel",
          name: "terms-and-conditions",
          elements: [
            {
              type: "html",
              name: "question1",
              html: '<a href="https://broadstairsfolkweek.org.uk/terms-and-conditions/" target="_blank">Click here to View workforce terms and conditions (opens in new tab)</a>',
            },
            {
              type: "boolean",
              name: "acceptedTermsAndConditions",
              title: "Do you accept the Workforce Terms and Conditions?",
              validators: [
                {
                  type: "expression",
                  text: "This form can only be submitted if you have read and accepted the Workforce Terms and Conditions.",
                  expression: "{acceptedTermsAndConditions} = true",
                },
              ],
            },
          ],
          title: "Workforce Terms and Conditions",
        },
        {
          type: "panel",
          name: "newlife-wills",
          elements: [
            {
              type: "html",
              name: "question2",
              html: '<a href="https://www.newlifewills.co.uk/" target="_blank">Click here for the Newlife Wills website (opens in new tab)</a>',
            },
            {
              type: "boolean",
              name: "consentNewlifeWills",
              title:
                "Would you be happy for Newlife Wills to get in touch with you to arrange your FREE consultation?",
            },
            {
              type: "boolean",
              name: "newlifeHaveWillInPlace",
              visibleIf: "{consentNewlifeWills} = true",
              title: "Do you have a Will currently in place?",
            },
            {
              type: "boolean",
              name: "newlifeHavePoaInPlace",
              visibleIf: "{consentNewlifeWills} = true",
              title:
                "Do you have Lasting Power of Attorney’s currently in place?",
            },
            {
              type: "boolean",
              name: "newlifeWantFreeReview",
              visibleIf:
                "{newlifeHavePoaInPlace} = true or {newlifeHaveWillInPlace} = true",
              title:
                "Would you like a FREE review to check everything is up to date?",
            },
          ],
          title: "Sponsor: Newlife Wills",
          description: "NewLife Wills is a sponsor of Broadstairs Folk Week.",
        },
      ],
    },
  ],
  showQuestionNumbers: "off",
  completeText: "Save",
};

export const workforceApplicationFormSpecId = FormSpecId.make(
  "WorkforceApplicationForm"
);

export const workforceApplicationFormSpec: FormSpec = {
  id: workforceApplicationFormSpecId,
  shortName: "WF 2024",
  fullName: "Workforce Application Form 2024",
  description: "Workforce Application Form for BFW 2024.",
  questions: applicationFormQuestionsModel,
  requirements: {
    profileRequirements: {
      firstName: true,
      surname: true,
      displayName: true,
      address: true,
      telephone: true,
      email: true,
      photo: true,
    },
  },
  status: "active",
};
