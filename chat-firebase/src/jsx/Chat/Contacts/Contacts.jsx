// src/jsx/Chat/Contacts/Contacts.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    updateDoc,
    orderBy,
    limit
} from "firebase/firestore";

import Avatar from "../../Profile/Avatar.jsx";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import { notify } from "../../../js/Chat_js/Notifications_js/NotificationManager.js";

export default function Contacts({ currentUser, search = "", setChatUser, setChatGroup, setScreen }) {

    const { allUsers } = useSearchUsers();

    const [contacts, setContacts] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [groups, setGroups] = useState([]);
    const [recentChats, setRecentChats] = useState([]);

    const filteredChats = recentChats.filter(chat => {
        const s = search.toLowerCase();

        if (chat.isGroup) {
            return (chat.name?.toLowerCase() || "").includes(s);
        }

        const otherId = chat.members.find(id => id !== currentUser.uid);
        const otherUser = allUsers.find(u => u.id === otherId);
        const displayName = (otherUser?.nome || otherUser?.email || "").toLowerCase();

        return displayName.includes(s);
    });

    // ================================
    // CARREGAR CONTATOS
    // ================================
    useEffect(() => {
        const ref = collection(db, `users/${currentUser.uid}/contacts`);
        const unsub = onSnapshot(ref, snap => {
            setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [currentUser.uid]);


    // ================================
    // FUNÇÕES PARA MARCAR COMO LIDO
    // ================================
    async function markRoomAsRead(roomId) {
        const msgsRef = collection(db, `rooms/${roomId}/messages`);
        const snap = await getDocs(query(msgsRef, where("from", "!=", currentUser.uid)));

        for (let msg of snap.docs) {
            const data = msg.data();
            if (!data.seenBy?.includes(currentUser.uid)) {
                await updateDoc(msg.ref, {
                    seenBy: [...(data.seenBy || []), currentUser.uid]
                });
            }
        }
    }

    async function markGroupAsRead(groupId) {
        const msgsRef = collection(db, `groups/${groupId}/messages`);
        const snap = await getDocs(query(msgsRef, where("from", "!=", currentUser.uid)));

        for (let msg of snap.docs) {
            const data = msg.data();
            if (!data.seenBy?.includes(currentUser.uid)) {
                await updateDoc(msg.ref, {
                    seenBy: [...(data.seenBy || []), currentUser.uid]
                });
            }
        }
    }


    // ================================
    // ROOMS PRIVADAS + unreadCount
    // ================================
    useEffect(() => {
        const ref = collection(db, "rooms");
        const qRooms = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(qRooms, async snap => {
            const arr = [];

            for (let d of snap.docs) {
                const room = { id: d.id, ...d.data(), isGroup: false };

                const msgsRef = collection(db, `rooms/${room.id}/messages`);
                const msgsSnap = await getDocs(query(msgsRef, where("from", "!=", currentUser.uid)));

                let unread = 0;
                msgsSnap.forEach(doc => {
                    const data = doc.data();
                    if (!data.seenBy?.includes(currentUser.uid)) unread++;
                });

                room.unreadCount = unread;
                arr.push(room);
            }

            setRooms(arr);
        });

        return () => unsub();
    }, [currentUser.uid]);


    // ================================
    // GRUPOS + unreadCount
    // ================================
    useEffect(() => {
        const ref = collection(db, "groups");
        const qGroups = query(ref, where("members", "array-contains", currentUser.uid));

        const unsub = onSnapshot(qGroups, async snap => {
            const arr = [];

            for (let d of snap.docs) {
                const group = { id: d.id, ...d.data(), isGroup: true };

                const msgsRef = collection(db, `groups/${group.id}/messages`);
                const msgsSnap = await getDocs(query(msgsRef, where("from", "!=", currentUser.uid)));

                let unread = 0;
                msgsSnap.forEach(doc => {
                    const data = doc.data();
                    if (!data.seenBy?.includes(currentUser.uid)) unread++;
                });

                group.unreadCount = unread;
                arr.push(group);
            }

            setGroups(arr);
        });

        return () => unsub();
    }, [currentUser.uid]);


    // ================================
    // MERGE rooms + groups EM ORDEM
    // ================================
    useEffect(() => {
        const all = [...rooms, ...groups];
        all.sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
        setRecentChats(all);
    }, [rooms, groups]);


    // ================================
    // ABRIR CHAT PRIVADO
    // ================================
    async function openPrivate(chat) {

        // UI instantânea
        setRooms(r => r.map(x => x.id === chat.id ? { ...x, unreadCount: 0 } : x));
        setRecentChats(rc => rc.map(x => x.id === chat.id ? { ...x, unreadCount: 0 } : x));

        // Firestore em paralelo
        markRoomAsRead(chat.id);

        const otherId = chat.members.find(id => id !== currentUser.uid);
        const otherUser = allUsers.find(u => u.id === otherId);

        setChatUser(otherUser);
        setChatGroup(null);
        setScreen("private");
    }

    // ================================
    // ABRIR GRUPO
    // ================================
    async function openGroup(chat) {

        setGroups(g => g.map(x => x.id === chat.id ? { ...x, unreadCount: 0 } : x));
        setRecentChats(rc => rc.map(x => x.id === chat.id ? { ...x, unreadCount: 0 } : x));

        markGroupAsRead(chat.id);

        setChatGroup(chat);
        setChatUser(null);
        setScreen("group");
    }


    // ==========================================================
    // 🔵 LISTENER DE NOTIFICAÇÕES DE GRUPOS
    // ==========================================================
    useEffect(() => {
        if (!currentUser) return;

        const groupsRef = collection(db, "groups");
        const qGroups = query(groupsRef);

        const unsub = onSnapshot(qGroups, async (snap) => {

            for (let docGroup of snap.docs) {
                const groupId = docGroup.id;
                const group = docGroup.data();

                if (!group.members?.includes(currentUser.uid)) continue;

                const opened = localStorage.getItem("group_opened");
                if (opened === groupId) continue;

                const msgRef = collection(db, `groups/${groupId}/messages`);
                const qLast = query(msgRef, orderBy("createdAt", "desc"), limit(1));

                const lastSnap = await getDocs(qLast);
                if (lastSnap.empty) continue;

                const msgDoc = lastSnap.docs[0];
                const msg = msgDoc.data();
                const msgId = msgDoc.id;

                if (msg.from === currentUser.uid) continue;
                if (msg.seenBy?.includes(currentUser.uid)) continue;

                const key = "notified_" + msgId;
                if (localStorage.getItem(key)) continue;

                const created = msg.createdAt?.toDate?.()?.getTime?.() ?? Date.now();
                if (Date.now() - created > 5000) continue;

                localStorage.setItem(key, "1");

                notify({
                    id: msgId,
                    text: msg.text || "[mensagem]",
                    senderName: group.name || "Novo grupo",
                    isGroup: true
                });
            }
        });

        return () => unsub();
    }, [currentUser]);


    // ================================
    // RENDER
    // ================================
    return (
        <div className="contacts-container">

            <h3 className="section-title">Conversas Recentes</h3>

            <div className="recent-list">

                {filteredChats.length === 0 && (
                    <p style={{ padding: 10, color: "#666" }}>Nenhuma conversa encontrada.</p>
                )}

                {filteredChats.map(chat => {

                    // GRUPO
                    if (chat.isGroup) {
                        return (
                            <div key={chat.id} className="contact-item" onClick={() => openGroup(chat)}>
                                <Avatar user={null} label={chat.name} size={44} />

                                <div>
                                    <div className="contactName">
                                        {chat.name}

                                        {chat.unreadCount > 0 && (
                                            <span className="unread-bubble">{chat.unreadCount}</span>
                                        )}
                                    </div>

                                    <div className="contactContent">
                                        {chat.lastMessage || "Novo grupo"}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // PRIVADO
                    const otherId = chat.members.find(id => id !== currentUser.uid);
                    const otherUser = allUsers.find(u => u.id === otherId);
                    if (!otherUser) return null;

                    return (
                        <div key={chat.id} className="contact-item" onClick={() => openPrivate(chat)}>
                            <Avatar user={otherUser} size={44} />
                            <div>

                                <div className="contactName">
                                    {otherUser.nome || otherUser.email}
                                    {chat.unreadCount > 0 && (
                                        <span className="unread-bubble">{chat.unreadCount}</span>
                                    )}
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
