// src/jsx/Gif/GifSearchModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { searchGifs, trendingGifs } from "../../../js/Chat_js/Gif/TenorApi.js";

export default function GifSearchModal({ onClose, onPickGif }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPos, setNextPos] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    loadTrending();
  }, []);

  const timeoutRef = useRef(null);

  function debouncedSearch(text) {
    setQuery(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (text.trim() === "") {
      loadTrending();
      return;
    
    }
    timeoutRef.current = setTimeout(() => {
      if (text.trim().length > 0) doSearch();
    }, 350);
  }
  const loadTrending = async (pos = null) => {
    setLoading(true);
    try {
      const r = await trendingGifs({ limit: 6, pos });
      setGifs(prev => pos ? [...prev, ...r.results] : r.results);
      setNextPos(r.next);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Erro buscando GIFs");
    } finally {
      setLoading(false);
    }
  };

  const gridRef = useRef(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    function handleScroll() {
      if (loading) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMore();
      }
    }

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loading, nextPos]);

  const doSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const r = await searchGifs(query, { limit: 6 });
      setGifs(r.results);
      setNextPos(r.next);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextPos) return;
    setLoading(true);
    try {
      const r = query
        ? await searchGifs(query, { limit: 12, pos: nextPos })
        : await trendingGifs({ limit: 12, pos: nextPos });

      setGifs((prev) => [...prev, ...r.results]);
      setNextPos(r.next);
    } catch (err) {
      console.error(err);
      setError("Erro carregando mais");
    } finally {
      setLoading(false);
    }
  };

  const pick = (gif) => {
    const fm = gif.media_formats || {};

    const gifUrl =
      fm.nanogif?.url ||
      fm.tinygif?.url ||
      fm.gif?.url ||
      fm.mediumgif?.url ||
      fm.mp4?.url ||
      null;

    if (!gifUrl) return alert("Não foi possível selecionar esse GIF.");

    onPickGif(gifUrl);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
      style={{ zIndex: 3000 }}
    >
      <div
        className="modal-content"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 900, width: "95%" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <form onSubmit={doSearch} style={{ flex: 1 }}>
            <input
              ref={inputRef}
              placeholder="Pesquisar GIFs (ex: comemoração, risada)"
              value={query}
              onChange={(e) => debouncedSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </form>

          <button
            onClick={() => {
              setQuery("");
              loadTrending();
            }}
            className="btn"
          >
            Trending
          </button>
          <button onClick={onClose} className="btn">
            Fechar
          </button>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
        )}

        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
            gap: 8,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {gifs.map((g, i) => {
            const fm = g.media_formats || {};

            const displayUrl =
              fm.nanogif?.url ||
              fm.tinygif?.url ||
              fm.gif?.url ||
              fm.mediumgif?.url ||
              "";

            return (
              <div
                key={g.id || i}
                style={{ cursor: "pointer" }}
                onClick={() => pick(g)}
              >
                <img
                  src={displayUrl}
                  loading="lazy"
                  alt={g.title || "gif"}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />

              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          {loading ? (
            <span>Carregando...</span>
          ) : nextPos ? (
            <button onClick={loadMore} className="btn">
              Carregar mais
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
