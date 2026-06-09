export type JourneyStatus = "planned" | "draft" | "curation" | "archived";

export type PhotoCategory =
  | "all"
  | "people"
  | "landscape"
  | "food"
  | "transport"
  | "other";

export interface JourneyPhoto {
  id: string;
  url: string;
  storageKey?: string;
  fileName?: string;
  isCover: boolean;
  isHighlight: boolean;
  category?: PhotoCategory;
  note?: string;
  hasNote: boolean;
  createdAt: string;
}

export interface Journey {
  id: string;
  title?: string;
  location: string;
  startDate?: string;
  endDate?: string;
  companions: string[];
  notes?: string;
  status: JourneyStatus;
  coverPhotoId?: string;
  photos: JourneyPhoto[];
  createdAt: string;
  updatedAt: string;
}
