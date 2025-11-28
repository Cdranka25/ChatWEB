import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, query, where, doc, setDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
import Avatar from "../../Profile/Avatar.jsx";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";

export default function Contacts({ currentUser, setChatUser, setChatGroup, setScreen }) {

    const { allUsers } = useSearchUsers();

    const [contacts, setContacts] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [groups, setGroups] = useState([]);
    const [recentChats, setRecentChats] = useState([]);

    // CARREGA CONTATOS
    useEffect(() => {
        const ref = collection(db, `users/${currentUser.uid}/contacts`);
        const unsub = onSnapshot(ref, snap => {
            setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [currentUser.uid]);

    // ROOMS PRIVADOS
    useEffect(() => {
        const ref = collection(db, "rooms");
        const q = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                isGroup: false
            }));
            setRooms(list);
        });

        return () => unsub();
    }, [currentUser.uid]);

    // GRUPOS
    useEffect(() => {
        const ref = collection(db, "groups");
        const q = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                isGroup: true
            }));
            setGroups(list);
        });

        return () => unsub();
    }, [currentUser.uid]);

    // UNE TUDO (rooms + groups)
    useEffect(() => {
        const combined = [...rooms, ...groups];

        combined.sort((a, b) => {
            const ta = a.lastUpdated?.seconds || 0;
            const tb = b.lastUpdated?.seconds || 0;
            return tb - ta;
        });

        setRecentChats(combined);
    }, [rooms, groups]);

    // ABRIR PRIVADO
    function openPrivate(chat) {
        const otherId = chat.members.find(id => id !== currentUser.uid);
        const otherUser = allUsers.find(u => u.id === otherId);

        if (!otherUser) return;

        setChatUser(otherUser);
        setChatGroup(null);
        setScreen("private");
    }

    // ABRIR GRUPO
    function openGroup(chat) {
        setChatGroup(chat);
        setChatUser(null);
        setScreen("group");
    }

    return (
        <div className="contacts-container">

            <h3 className="section-title">Conversas Recentes</h3>

            <div className="recent-list">
                {recentChats.length === 0 && (
                    <p>Nenhuma conversa recente.</p>
                )}

                {recentChats.map(chat => {

                    if (chat.isGroup) {
                        return (
                            <div
                                key={chat.id}
                                className="contact-item"
                                onClick={() => openGroup(chat)}
                            >
                                <Avatar user={null} label={chat.name} size={44} />
                                <div>
                                    <div className="contactName">{chat.name}</div>
                                    <div className="contactContent">
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
                            onClick={() => openPrivate(chat)}
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
        </div>
    );
}
