// src/jsx/Chat/Contacts/UsersList.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Avatar from "../../Profile/Avatar";


export default function UsersList({ currentUser, openChatWith }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const q = collection(db, "users");
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(arr.filter(u => u.id !== currentUser.uid));
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <div>
      <h3>Usuários</h3>
      <div>
        {users.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderBottom: "1px solid #eee" }}>
            {u.avatarUrl
              ? <Avatar user={u} size={40} />
              : <Avatar user={u} size={40} />
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{u.nome || u.email}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{u.email}</div>
            </div>
            <button onClick={() => openChatWith(u)}>Chat</button>
          </div>
        ))}
      </div>
    </div>
  );
}
