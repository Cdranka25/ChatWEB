// src/jsx/Chat/Group/CreateGroup.jsx
import { useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";

export default function CreateGroup({ currentUser, setScreen }) {
    const { allUsers, filtered, search, searchUsers } = useSearchUsers();
    const [name, setName] = useState("");
    const [selected, setSelected] = useState([]);

    const toggle = (id) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const create = async () => {
        if (!name) return alert("Nome do grupo obrigatório");
        if (selected.length === 0) return alert("Selecione pelo menos 1 membro");

        // 🔥 membros como STRINGS
        const members = [currentUser.uid, ...selected];

        // 🔥 metadata dos membros separada (opcional, igual WhatsApp Business API)
        const memberData = members.map(id => {
            const u =
                allUsers?.find(x => x.id === id) ||
                filtered?.find(x => x.id === id);

            return {
                id,
                nome: u?.nome || u?.email || "Usuário",
                email: u?.email || "",
                avatarUrl: u?.avatarUrl || ""
            };
        });

        await addDoc(collection(db, "groups"), {
            name,
            members,          // ← agora correto
            memberData,       // ← opcional e compatível com GroupChat
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastUpdated: serverTimestamp()
        });

        setScreen("private");
    };

    const usersToShow = filtered.filter(u => u.id !== currentUser.uid);

    return (
        <div>
            <h2>Criar Grupo</h2>

            <input
                placeholder="Nome do grupo"
                value={name}
                onChange={e => setName(e.target.value)}
            />

            <input
                placeholder="Pesquisar usuários"
                value={search}
                onChange={e => searchUsers(e.target.value)}
            />

            <h3>Membros</h3>
            {usersToShow.map(u => (
                <label key={u.id} style={{ display: 'block', margin: '5px 0' }}>
                    <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggle(u.id)}
                    />
                    {u.nome || u.email}
                </label>
            ))}

            <div style={{ marginTop: '20px' }}>
                <button onClick={create} style={{ marginRight: '10px' }}>Criar</button>
                <button onClick={() => setScreen("private")}>Cancelar</button>
            </div>

            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                {selected.length} membro(s) selecionado(s)
            </div>
        </div>
    );
}
