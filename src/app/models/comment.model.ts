export interface CommentModel {
  id?: number;
  content: string;
  username?: string;
  createdAt?: Date;
}

export interface CommentRequest {
  content: string;
}

