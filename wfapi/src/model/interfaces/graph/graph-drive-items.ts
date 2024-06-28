import { DriveItem, ListItem } from "@microsoft/microsoft-graph-types";

// Interface for drive item with its associated list item.
export interface DriveItemWithListItem extends Omit<DriveItem, "listItem"> {
  listItem: ListItem;
}
