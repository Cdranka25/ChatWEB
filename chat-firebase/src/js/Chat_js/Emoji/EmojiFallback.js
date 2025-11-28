// src/js/Chat_js/Emoji/EmojiFallback.js
import twemoji from "twemoji";

export function emojiNeedsFallback(emoji) {
  const span = document.createElement("span");
  span.textContent = emoji;

  return span.innerText !== emoji;
}

export function applyEmojiFallback(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const nodes = div.querySelectorAll("*");

  nodes.forEach(node => {
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
      const text = node.textContent;

      let result = "";
      for (const char of [...text]) {
        if (emojiNeedsFallback(char)) {
          result += twemoji.parse(char, {
            folder: "svg",
            ext: ".svg",
            className: "twemoji"
          });
        } else {
          result += char;
        }
      }

      node.innerHTML = result;
    }
  });

  return div.innerHTML;
}
