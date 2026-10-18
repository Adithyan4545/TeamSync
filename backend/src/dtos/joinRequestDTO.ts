export interface CreateJoinRequestDTO {
  teamId: string;
}

export interface UpdateJoinRequestStatusDTO {
  status: 'Accepted' | 'Rejected' | 'Shortlisted';
}

export interface JoinRequestResponseDTO {
  _id: string;
  user: string;
  team: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
