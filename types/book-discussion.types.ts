export interface BookSearchResult {
  title: string;
  authors: string[];
  description: string;
  thumbnail: string | null;
}

export interface BookSearchResponse {
  results: BookSearchResult[];
}

export interface BookDiscussionTokenRequest {
  bookTitle: string;
  bookSummary?: string;
  childAge?: number;
}

export interface BookDiscussionTokenResponse {
  token: string;
  model: string;
}

export interface BookCoverInfo {
  title: string | null;
  author: string | null;
  publisher: string | null;
}
