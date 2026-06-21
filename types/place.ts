export interface FavoritePlace {
  id: string;
  user_id: string;
  name: string;
  category: string;
  image_url: string | null;
  description: string;
  lat: number;
  lng: number;
  note: string | null;
  recommender_note: string | null;
  created_at: string;
}

export interface PlaceRecommendation {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  description: string;
  lat: number;
  lng: number;
  reason: string;
  recommender_note: string | null;
  score: number;
}
