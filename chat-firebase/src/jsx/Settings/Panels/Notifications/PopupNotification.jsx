import React, { useEffect, useState } from "react";

export default function PopupNotification() {
    const [queue, setQueue] = useState([]);

    useEffect(() => {
        function onEvent(e) {
            const msg = e.detail || {};

            const uid = Date.now();              // ID apenas visual
            const item = { ...msg, _uid: uid };  // mantemos msg.id intacto

            setQueue(q => [...q, item]);

            setTimeout(() => {
                setQueue(q => q.filter(n => n._uid !== uid));
            }, 4000);
        }


        window.addEventListener("chat_notification", onEvent);
        return () => window.removeEventListener("chat_notification", onEvent);
    }, []);

    return (
        <div style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 9999
        }}>
            {queue.map(n => (
                <div key={n._uid} style={{
                    background: "#333",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
                }}>
                    <strong>{n.senderName}</strong><br />
                    <span>{n.text}</span>
                </div>
            ))}
        </div>
    );
}
