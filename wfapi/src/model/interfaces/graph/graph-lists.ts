import { List, Drive } from "@microsoft/microsoft-graph-types";

// Interface for a document library list. Document library lists have a Drive associated with them.
export interface DocumentLibraryList extends Omit<List, "drive"> {
  drive: Drive;
}
