export interface BookmarkDTO {
  // No body needed for creation; bookmarks are derived from user context and target ID
}

export interface BookmarkResponseDTO {
  _id: string;
  user: string;
  hackathon?: string;
  team?: string;
  createdAt: string;
}
