import { createServerSupabaseClient } from './supabase-server';
import type { Cast, Schedule, News, Gallery, Shop } from '@/types';

// ---- Cast ----

export async function getCasts(): Promise<Cast[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('casts')
      .select('*')
      .eq('is_public', true)
      .order('sort_order');
    if (error) throw error;
    return (data as Cast[]) ?? [];
  } catch {
    return [];
  }
}

export async function getCastBySlug(slug: string): Promise<Cast | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('casts')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();
    if (error) throw error;
    return (data as Cast) ?? null;
  } catch {
    return null;
  }
}

export async function getCastSlugs(): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('casts')
      .select('slug')
      .eq('is_public', true);
    if (error) throw error;
    return (data ?? []).map((c: { slug: string }) => c.slug);
  } catch {
    return [];
  }
}

// ---- Schedule ----

export async function getSchedules(limit = 14): Promise<Schedule[]> {
  try {
    const supabase = createServerSupabaseClient();
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dateStr = jstDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('schedules')
      .select(`*, casts:schedule_casts(cast:casts(*), work_start, work_end)`)
      .eq('is_public', true)
      .gte('date', dateStr)
      .order('date')
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      casts: ((s.casts as Array<{ cast: Cast; work_start: string | null; work_end: string | null }>) ?? [])
        .map((sc) => sc.cast ? { ...sc.cast, work_start: sc.work_start, work_end: sc.work_end } : null)
        .filter(Boolean),
    })) as Schedule[];
  } catch {
    return [];
  }
}

export async function getTodaySchedule(): Promise<Schedule | null> {
  try {
    const supabase = createServerSupabaseClient();
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const year = jstDate.getUTCFullYear();
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jstDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('schedules')
      .select(`*, casts:schedule_casts(cast:casts(*))`)
      .eq('is_public', true)
      .eq('date', dateStr)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      casts: ((data.casts as Array<{ cast: Cast }>) ?? []).map((sc) => sc.cast).filter(Boolean),
    } as Schedule;
  } catch {
    return null;
  }
}

// ---- News ----

export async function getNewsList(
  limit = 20,
  offset = 0
): Promise<{ data: News[]; count: number }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error, count } = await supabase
      .from('news')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: (data as News[]) ?? [], count: count ?? 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

export async function getLatestNews(limit = 3): Promise<News[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as News[]) ?? [];
  } catch {
    return [];
  }
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (error) throw error;
    return (data as News) ?? null;
  } catch {
    return null;
  }
}

export async function getNewsSlugs(): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('news')
      .select('slug')
      .eq('is_public', true);

    if (error) throw error;
    return (data ?? []).map((n: { slug: string }) => n.slug);
  } catch {
    return [];
  }
}

// ---- Gallery ----

export async function getGalleries(limit = 50): Promise<Gallery[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_public', true)
      .order('sort_order')
      .limit(limit);

    if (error) throw error;
    return (data as Gallery[]) ?? [];
  } catch {
    return [];
  }
}

// ---- Shop ----

export async function getShop(): Promise<Shop | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('shop')
      .select('*')
      .single();

    if (error) throw error;
    return (data as Shop) ?? null;
  } catch {
    return null;
  }
}
