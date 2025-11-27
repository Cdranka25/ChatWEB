// src/js/Chat/Gif/TenorApi.js
import axios from "axios";

const TENOR_KEY = process.env.REACT_APP_TENOR_KEY;

const BASE = "https://tenor.googleapis.com/v2";

if (!TENOR_KEY) {
  console.warn(" Nenhuma chave REACT_APP_TENOR_KEY encontrada no .env");
}


export async function searchGifs(query, { limit = 24, pos = null } = {}) {
  if (!TENOR_KEY) throw new Error("Tenor API key missing");

  const params = {
    key: TENOR_KEY,
    q: query,
    limit,
    media_filter: "minimal",
    pos
  };

  const url = `${BASE}/search`;
  const res = await axios.get(url, { params });

  return {
    results: res.data?.results || [],
    next: res.data?.next || null
  };
}

export async function trendingGifs({ limit = 24, pos = null } = {}) {
  if (!TENOR_KEY) throw new Error("Tenor API key missing");

  const params = {
    key: TENOR_KEY,
    limit,
    media_filter: "minimal",
    pos
  };

  const url = `${BASE}/featured`;
  const res = await axios.get(url, { params });

  return {
    results: res.data?.results || [],
    next: res.data?.next || null
  };
}
