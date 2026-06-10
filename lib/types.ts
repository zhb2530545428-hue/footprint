export type JourneyStatus = "planned" | "draft" | "curation" | "archived" | "trashed";

export interface PhotoCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JourneyPhoto {
  id: string;
  url: string;
  storageKey?: string;
  fileName?: string;
  isCover: boolean;
  isHighlight: boolean;
  categoryId?: string;
  note?: string;
  hasNote: boolean;
  createdAt: string;
}

export interface Journey {
  id: string;
  title?: string;
  location: string;
  locationCountry?: "China";
  locationProvince?: string;
  locationCities?: string[];
  locationCity?: string;
  locationAddress?: string;
  startDate?: string;
  endDate?: string;
  companions: string[];
  notes?: string;
  status: JourneyStatus;
  coverPhotoId?: string;
  photos: JourneyPhoto[];
  categories: PhotoCategory[];
  createdAt: string;
  updatedAt: string;
}
