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

export interface BookDiscussionRecord {
  id: string;
  profile_id: string;
  book_title: string;
  summary: string | null;
  discussed_at: string;
  created_at: string;
}

export interface BookDiscussionWithProfile extends BookDiscussionRecord {
  profile_name: string;
}

export interface SaveBookDiscussionRequest {
  bookTitle: string;
  transcripts: { role: 'user' | 'ai'; text: string }[];
}
