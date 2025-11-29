// src/jsx/Sidebar/Sidebar.jsx
import { useState, useRef, useEffect } from "react";
import SettingsScreen from "../Settings/SettingsScreen.jsx";
import Contacts from "../Chat/Contacts/Contacts.jsx";

import { db } from "../../js/Firebase/FirebaseConfig";
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    limit,
    getDocs
} from "firebase/firestore";

import { notify } from "../../js/Chat_js/Notifications_js/NotificationManager";

export default function Sidebar({ currentUser, setChatUser, setChatGroup, setScreen, logout }) {

    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [search, setSearch] = useState("");

    const menuRef = useRef(null);

    // Fecha menu ao clicar fora
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Armazena últimos IDs notificados
    const notified = useRef(new Set());

    useEffect(() => {
        if (!currentUser) return;

        const roomsRef = collection(db, "rooms");
        const qRooms = query(roomsRef);

        const unsub = onSnapshot(qRooms, async (snap) => {

            for (let docRoom of snap.docs) {
                const roomId = docRoom.id;
                const room = docRoom.data();

                // somente salas onde o usuário participa
                if (!room.members?.includes(currentUser.uid)) continue;

                // não notificar sala que está aberta
                const opened = localStorage.getItem("room_opened");
                if (opened === roomId) continue;

                // pegar última mensagem
                const msgRef = collection(db, `rooms/${roomId}/messages`);
                const qLatest = query(msgRef, orderBy("createdAt", "desc"), limit(1));

                const last = await getDocs(qLatest);
                if (last.empty) continue;

                const msgDoc = last.docs[0];
                const msg = msgDoc.data();
                const msgId = msgDoc.id;

                // ignorar mensagens minhas
                if (msg.from === currentUser.uid) continue;

                // ignorar mensagens já vistas
                if (msg.seenBy?.includes(currentUser.uid)) continue;

                // ANTISPAM: se já notificamos esse ID nesta aba → pula
                if (notified.current.has(msgId)) continue;

                // ANTISPAM: se navegador já notificou antes (persistência)
                const localKey = `notified_${msgId}`;
                if (localStorage.getItem(localKey)) continue;

                // ANTISPAM: notificar somente mensagens muito recentes
                const created = msg.createdAt?.toDate?.()?.getTime?.() ?? Date.now();
                if (Date.now() - created > 5000) continue;

                // marca como notificado
                notified.current.add(msgId);
                localStorage.setItem(localKey, "1");

                // dispara notificação
                notify({
                    id: msgId,
                    text: msg.text || "[mensagem]",
                    senderName: "Nova mensagem",
                    isGroup: false
                });
            }

        });

        return () => unsub();

    }, [currentUser]);

    return (
        <div className="sidebar">

            {!showSettings && (
                <div className="sidebar-header">
                    <span>Olá, {currentUser.displayName || currentUser.email}</span>

                    <div className="menuContainerContacts" ref={menuRef}>
                        <button className="menu-button" onClick={() => setShowMenu(m => !m)}>⋮</button>

                        {showMenu && (
                            <div className="menu-dropdown">
                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("createGroup"); }}>
                                    Criar Grupo
                                </div>

                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("openAddContact"); }}>
                                    Adicionar Contato
                                </div>

                                <div className="menu-item" onClick={() => { setShowMenu(false); setShowSettings(true); }}>
                                    Configurações
                                </div>

                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("profile"); }}>
                                    Perfil
                                </div>

                                <div className="menu-item logout" onClick={() => { setShowMenu(false); logout(); }}>
                                    Sair
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!showSettings && (
                <div className="sidebar-search">
                    <input
                        type="text"
                        placeholder="Pesquisar conversas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            {showSettings ? (
                <SettingsScreen
                    onBack={() => setShowSettings(false)}
                    currentUser={currentUser}
                    logout={logout}
                />
            ) : (
                <Contacts
                    currentUser={currentUser}
                    search={search}
                    setChatUser={setChatUser}
                    setChatGroup={setChatGroup}
                    setScreen={setScreen}
                />
            )}
        </div>
    );
}
