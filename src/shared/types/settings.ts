import { type EventType } from './events';

export interface TProfile {
  username: string;
  email: string;
  avatar: string;
}

export interface TSettings {
  auth: {
    enabled: boolean;
    login_url: string;
  };
  version: string;
  client: {
    events: EventType[];
  };
}

export interface TProjects {
  data: {
    name: string;
    key: string;
    is_default: boolean;
  }[];
}
