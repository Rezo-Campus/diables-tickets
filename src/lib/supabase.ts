import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Competition = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Match = {
  id: string;
  competition_id: string;
  opponent: string;
  venue: string | null;
  match_date: string;
  ticket_price: number;
  tickets_available: number;
  is_home: boolean;
  opponent_country_code: string | null;
};

export type Ticket = {
  id: string;
  user_id: string;
  match_id: string;
  code: string;
  used_at: string | null;
  paid: boolean;
  payment_method: string | null;
  created_at: string;
};

export type AppRole = "commercial" | "admin";
