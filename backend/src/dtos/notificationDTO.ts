export interface NotificationResponseDTO {
  _id: string;
  user: string;
  type: string;
  payload: any;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
