// src/js/Chat/Emoji/EmojiParser.js


import twemoji from "twemoji";

export function emojify(text) {
  if (!text) return "";

  // twemoji.parse retorna HTML seguro (<img ...>)
  return twemoji.parse(text, {
    folder: "svg",
    ext: ".svg",
    className: "twemoji"
  });
}
