export type Role = 'owner' | 'staff' | 'cast';

export type Profile = {
  id: string;
  role: Role;
  cast_id: string | null;
  created_at: string;
};

export type Cast = {
  id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
  sub_image_urls: string[];
  message: string | null;
  birthday: string | null;
  blood_type: string | null;
  hobby: string | null;
  x_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  status: string | null;
  default_workdays: number[];
  default_work_start: string | null;
  default_work_end: string | null;
  work_start?: string | null;
  work_end?: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  date: string;
  note: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  casts?: Cast[];
};

export type ScheduleCast = {
  schedule_id: string;
  cast_id: string;
  work_start: string | null;
  work_end: string | null;
};

export type News = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  thumbnail_url: string | null;
  content: string | null;
  published_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Gallery = {
  id: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
};

export type Shop = {
  id: number;
  shop_name: string | null;
  business_hours: string | null;
  closed_days: string | null;
  address: string | null;
  google_map_embed_url: string | null;
  top_banner_url: string | null;
  menu_image_url: string | null;
  line_url: string | null;
  form_url: string | null;
  apply_type: 'line' | 'form' | 'both';
  tiktok_url: string | null;
  system_text: string | null;
  access_text: string | null;
  recruit_text: string | null;
  gallery_category_order: string | null;
  updated_at: string;
};
