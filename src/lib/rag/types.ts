export interface RecaContext {
  id: string;
  content: string;
  sourceDocument: string;
  pageNumber: number | null;
  section: string | null;
  similarity: number;
}

export interface RagSearchResult {
  query: string;
  results: RecaContext[];
}
