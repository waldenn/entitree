import {
  HUMAN_ID,
  ORGANIZATION_ID,
  BUSINESS_ID,
  HUMAN_SETTLEMENT_ID,
} from "./entities";

export const SIBLINGS_ID = "P3373";
export const SPOUSE_ID = "P26";
export const BIRTH_DATE_ID = "P569";
export const DEATH_DATE_ID = "P570";
export const CHILD_ID = "P40";
export const STUDENT_OF_ID = "P1066";
export const STUDENT_ID = "P802";
export const LOCATED_IN_ID = "P131";

export const BUSINESS_PROPS = [
  {
    id: "P355",
    label: "Subsidiaries",
  },
  {
    id: "P749",
    label: "Parent orgs",
  },
  {
    id: "P1830",
    label: "Ownership",
  },
  {
    id: "P127",
    label: "Ownership reversed?",
  },
];

export const preferredProps = {
  [HUMAN_ID]: [
    {
      id: CHILD_ID,
      label: "family",
    },
    {
      id: STUDENT_ID,
      label: "student",
    },
  ],
  [ORGANIZATION_ID]: BUSINESS_PROPS,
  [BUSINESS_ID]: BUSINESS_PROPS,
  [HUMAN_SETTLEMENT_ID]: [
    {
      id: LOCATED_IN_ID,
      label: "location",
    },
  ],
};
