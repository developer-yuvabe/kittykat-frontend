export type Topic = {
  id: string;
  topic: string;
  thumbnail_url: string;
};

export type PexelsTopicsResponse = {
  editor_choice: string;
  topics: Topic[];
};
