export enum DragItemEnum {
  MediaItem = "MEDIA_ITEM",
  MediaItemsMulti = "MEDIA_ITEMS_MULTI",
  Campaign = "CAMPAIGN",
}

export enum DropTargetEnum {
  Campaign = "CAMPAIGN",
  Tab = "TAB",
  Section = "SECTION",
  MediaGrid = "MEDIA_GRID",
  Subfolder = "SUBFOLDER",
}

export interface MediaDragData {
  type: DragItemEnum.MediaItem | DragItemEnum.MediaItemsMulti;
  itemIds: string[];
  sourceTab?: string;
  sourceCampaignId?: string | null;
}

export interface CampaignDragData {
  type: DragItemEnum.Campaign;
  campaignId: string;
  isArchived: boolean;
}

export type DragData = MediaDragData | CampaignDragData;

export interface DropTargetData {
  type: DropTargetEnum;
  id: string;
  accepts: DragItemEnum[];
}
