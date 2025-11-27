// src/jsx/Chat/Contacts.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, query, where, doc, setDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
import Avatar from "../../Profile/Avatar.jsx";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import SettingsScreen from "../../Settings/SettingsScreen.jsx";


export default function Contacts({ currentUser, setChatUser, setChatGroup, setScreen, logout }) {
    const { allUsers } = useSearchUsers();
    const [contacts, setContacts] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchAdd, setSearchAdd] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const menuRef = useRef(null);
    const [showSettings, setShowSettings] = useState(false);


    // FECHAR MENU AO CLICAR FORA
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        }
        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    // CARREGAR CONTATOS GRAVADOS
    useEffect(() => {
        const ref = collection(db, `users/${currentUser.uid}/contacts`);
        const unsub = onSnapshot(ref, snap => {
            setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [currentUser.uid]);

    // CHATS RECENTES — ROOMS ENTRE DOIS USUÁRIOS
    useEffect(() => {
        const ref = collection(db, "rooms");
        const q = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const rooms = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                isGroup: false
            }));
            mergeChats(rooms, null);
        });

        return () => unsub();
    }, [currentUser.uid]);

    // CHATS DE GRUPOS
    useEffect(() => {
        const ref = collection(db, "groups");
        const q = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const groups = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                isGroup: true
            }));
            mergeChats(null, groups);
        });
        return () => unsub();
    }, [currentUser.uid]);

    // UNIÃO ENTRE CONVERSAS DE GRUPO E PRIVADAS
    function mergeChats(rooms = null, groups = null) {
        setRecentChats(prev => {
            let updated = prev;

            if (rooms) {
                updated = [
                    ...rooms,
                    ...prev.filter(c => c.isGroup === true)
                ];
            }

            if (groups) {
                updated = [
                    ...prev.filter(c => c.isGroup === false),
                    ...groups
                ];
            }

            return updated.sort((a, b) => {
                const ta = a.lastUpdated?.seconds || 0;
                const tb = b.lastUpdated?.seconds || 0;
                return tb - ta;
            });
        });
    }

    // BUSCAR USUÁRIOS PARA ADICIONAR
    useEffect(() => {
        const s = searchAdd.trim().toLowerCase();
        if (!s) {
            setSearchResults([]);
            return;
        }

        const filtered = allUsers.filter(u =>
            u.id !== currentUser.uid &&
            (
                (u.nome || "").toLowerCase().includes(s) ||
                (u.email || "").toLowerCase().includes(s) ||
                u.id.toLowerCase().includes(s)
            )
        );

        setSearchResults(filtered);
    }, [searchAdd, allUsers]);

    // ADICIONAR CONTATO + CRIAR ROOM
    async function addContactAndCreateRoom(userB) {
        const userA = currentUser;

        const ref = doc(db, `users/${userA.uid}/contacts/${userB.id}`);
        await setDoc(ref, {
            id: userB.id,
            nome: userB.nome || userB.email,
            email: userB.email,
            avatarUrl: userB.avatarUrl || "",
            addedAt: serverTimestamp()
        });

        const roomId = [userA.uid, userB.id].sort().join("_");
        const roomRef = doc(db, "rooms", roomId);
        const snap = await getDoc(roomRef);

        if (!snap.exists()) {
            await setDoc(roomRef, {
                id: roomId,
                members: [userA.uid, userB.id],
                createdAt: serverTimestamp(),
                lastMessage: "",
                lastUpdated: serverTimestamp()
            });
        }

        // abre chat
        setChatUser(userB);
        setChatGroup(null);
        setScreen("private");

        // fecha modal
        setShowAddModal(false);
        setSearchAdd("");
        setSearchResults([]);
    }

    return (
        <div className="sidebar">

            {/* SE NÃO estiver nas configurações, mostra o HEADER */}
            {!showSettings && (
                <div className="sidebar-header">
                    <span>Olá, {currentUser.displayName || currentUser.email}</span>

                    {/* MENU */}
                    <div className="menuContainerContacts" ref={menuRef} >
                        <button
                            className="menu-button"
                            onClick={() => setShowMenu(m => !m)}>
                            ⋮
                        </button>

                        {showMenu && (
                            <div className="menu-dropdown">
                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("createGroup"); }}>Criar Grupo</div>
                                <div className="menu-item" onClick={() => { setShowAddModal(true); setShowMenu(false); }}>Adicionar Contato</div>
                                <div className="menu-item" onClick={() => { setShowSettings(true); setShowMenu(false); }}>Configurações</div>
                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("profile"); }}>Perfil</div>
                                <div className="menu-item logout" onClick={() => { setShowMenu(false); logout(); }}>Sair</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CONTEÚDO */}
            {showSettings ? (
                <SettingsScreen onBack={() => setShowSettings(false)} />
            ) : (
                <>

                    {/* LISTA DE CONVERSAS RECENTES */}
                    <h3 className="section-title">Conversas Recentes</h3>

                    <div className="recent-list">
                        {recentChats.length === 0 && (
                            <p>
                                Nenhuma conversa recente.
                            </p>
                        )}

                        {recentChats.map(chat => {
                            if (chat.isGroup) {
                                return (
                                    <div
                                        key={chat.id}
                                        className="contact-item"
                                        onClick={() => {
                                            setChatGroup(chat);
                                            setChatUser(null);
                                            setScreen("group");
                                        }}>
                                        <Avatar user={null} label={chat.name} size={44} />
                                        <div>
                                            <div >
                                                {chat.lastMessage || "Novo grupo"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const otherId = chat.members.find(id => id !== currentUser.uid);
                            const otherUser = allUsers.find(u => u.id === otherId);
                            if (!otherUser) return null;

                            return (
                                <div
                                    key={chat.id}
                                    className="contact-item"
                                    onClick={() => {
                                        setChatUser(otherUser);
                                        setChatGroup(null);
                                        setScreen("private");
                                    }}

                                >
                                    <Avatar user={otherUser} size={44} />
                                    <div>
                                        <div className="contactName">
                                            {otherUser.nome || otherUser.email}
                                        </div>
                                        <div className="contactContent">
                                            {chat.lastMessage || "Conversa vazia"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* MODAL: ADICIONAR CONTATO */}
            {showAddModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">

                        <h2>Adicionar Contato</h2>

                        <h4>Meus Contatos</h4>

                        {contacts.length === 0 ? (
                            <p>Nenhum contato salvo.</p>
                        ) : (
                            contacts.map(c => (
                                <div
                                    key={c.id}
                                    className="contact-item"
                                    onClick={() => {
                                        setChatUser(c);
                                        setShowAddModal(false);
                                        setScreen("private");
                                    }}
                                >
                                    <Avatar user={c} size={44} />
                                    <div>{c.nome || c.email}</div>
                                </div>
                            ))
                        )}

                        <hr />

                        <input
                            className="sidebarSearchContacts"
                            placeholder="Buscar por nome, email ou ID"
                            value={searchAdd}
                            onChange={e => setSearchAdd(e.target.value)}
                        />

                        {searchResults.map(u => (
                            <div
                                key={u.id}
                                className="contact-item"
                                onClick={() => addContactAndCreateRoom(u)}
                            >
                                <Avatar user={u} size={44} />
                                <div>{u.nome || u.email}</div>
                            </div>
                        ))}

                    </div>
                </div>
            )}
        </div>
    );
}
