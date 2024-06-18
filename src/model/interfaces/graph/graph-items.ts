import { ListItem } from "@microsoft/microsoft-graph-types";

export interface AddableMultiLookupId {
  results: number[];
}
export interface AddableGraphListItemFields {
  Title: string;
  [x: string]:
    | string
    | number
    | boolean
    | AddableMultiLookupId
    | null
    | undefined;
}

export interface UpdatableGraphListItemFields {
  [x: string]:
    | string
    | number
    | boolean
    | AddableMultiLookupId
    | null
    | undefined;
}

export interface PersistedGraphListItemFields
  extends AddableGraphListItemFields {
  id: string;
  Created: string;
  Modified: string;
}

export interface PersistedGraphListItem<T extends PersistedGraphListItemFields>
  extends Omit<ListItem, "fields"> {
  fields: T;
}
