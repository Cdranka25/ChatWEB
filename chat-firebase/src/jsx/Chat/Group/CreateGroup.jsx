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

        const membersData = [currentUser.uid, ...selected].map(id => {
            const user = allUsers?.find(u => u.id === id) || filtered?.find(u => u.id === id);
            return {
                id,
                nome: user?.nome || user?.email || "Usuário",
                email: user?.email || "",
                avatarUrl: user?.avatarUrl || ""
            };
        });

        await addDoc(collection(db, "groups"), {
            name,
            members: membersData,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp()
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
                    {u.nome || u.email} {/* Mostra nome ou email */}
                </label>
            ))}

            <div style={{ marginTop: '20px' }}>
                <button onClick={create} style={{ marginRight: '10px' }}>Criar</button>
                <button onClick={() => setScreen("private")}>Cancelar</button>
            </div>

            {/* Mostra quantos membros foram selecionados */}
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                {selected.length} membro(s) selecionado(s)
            </div>
        </div>
    );
}