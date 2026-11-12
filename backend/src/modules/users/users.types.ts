export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

