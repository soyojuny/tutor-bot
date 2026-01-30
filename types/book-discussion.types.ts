export interface BookDiscussionTokenRequest {
  bookTitle: string;
}

export interface BookDiscussionTokenResponse {
  token: string;
  model: string;
}
