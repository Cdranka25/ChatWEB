// src/js/Search/useSearchUsers.jsx
import { useEffect, useState, useMemo } from "react";
import { db } from "../Firebase/FirebaseConfig";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function useSearchUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(doc => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          nome: data.nome || data.displayName || "",
          email: data.email || data.email?.toLowerCase?.() || "",
          avatarUrl: data.avatarUrl || data.photoURL || "",
          ...data
        };
      });
      setAllUsers(arr);
    }, (err) => {
      console.error("Erro ao carregar users:", err);
    });

    return () => unsub();
  }, []);

  const searchUsers = (term) => {
    setSearch(term || "");
  };

  const filtered = useMemo(() => {
    if (!search || !search.trim()) return allUsers;
    const s = search.toLowerCase().trim();
    return allUsers.filter(u => {
      const nome = (u.nome || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return nome.includes(s) || email.includes(s);
    });
  }, [search, allUsers]);

  const getUserById = (id) => allUsers.find(u => u.id === id);

  return { allUsers, filtered, search, searchUsers, getUserById };
}
