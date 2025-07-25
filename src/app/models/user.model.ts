export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: Date;
  likedBlogIds?: number[];
  bio?: string;
}
