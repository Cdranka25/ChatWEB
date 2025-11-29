// src/jsx/Chat/Group/CreateGroup.jsx
import { useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import Avatar from "../../Profile/Avatar.jsx";

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

        const members = [currentUser.uid, ...selected];

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
            members,
            memberData,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastUpdated: serverTimestamp()
        });

        setScreen("private");
    };

    const usersToShow = filtered.filter(u => u.id !== currentUser.uid);

    return (
        <div className="create-group-container">

            {/* HEADER */}
            <div className="create-group-header">
                <button className="back-btn" onClick={() => setScreen("private")}>←</button>
                <span>Criar Grupo</span>
                <div></div>
            </div>

            {/* CARD */}
            <div className="create-group-card">

                {/* Nome do grupo */}
                <div className="input-block">
                    <label>Nome do grupo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Amigos, Trabalho, Família..."
                    />
                </div>

                {/* Barra de pesquisa */}
                <div className="input-block">
                    <label>Pesquisar usuários</label>
                    <input
                        type="text"
                        value={search}
                        onChange={e => searchUsers(e.target.value)}
                        placeholder="Digite um nome ou email..."
                    />
                </div>

                {/* Lista */}
                <div className="member-list">
                    {usersToShow.map(u => (
                        <div key={u.id} className="member-item" onClick={() => toggle(u.id)}>
                            <Avatar user={u} size={40} />
                            <div className="member-info">
                                <div className="member-name">{u.nome || u.email}</div>
                                <div className="member-email">{u.email}</div>
                            </div>

                            <input
                                type="checkbox"
                                checked={selected.includes(u.id)}
                                onChange={() => toggle(u.id)}
                            />
                        </div>
                    ))}
                </div>

                <div className="create-footer">
                    <span>{selected.length} membro(s) selecionado(s)</span>

                    <button className="btn" onClick={create}>
                        Criar Grupo
                    </button>
                </div>
            </div>
        </div>
    );
}
