// src/jsx/Chat/Contacts/AddContact.jsx
import { useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, setDoc, doc } from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import Avatar from "../../Profile/Avatar.jsx";

export default function AddContact({ currentUser, setScreen }) {
    const { search, searchUsers, filtered } = useSearchUsers();
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");

    async function addContact(user) {
        setAdding(true);
        setMessage("");

        try {
            await setDoc(
                doc(db, `users/${currentUser.uid}/contacts`, user.id),
                {
                    nome: user.nome || user.email,
                    email: user.email,
                    avatarUrl: user.avatarUrl || "",
                    addedAt: new Date()
                }
            );

            setMessage("Contato adicionado com sucesso!");
        } catch (e) {
            setMessage("Erro ao adicionar contato.");
        }

        setAdding(false);
    }

    return (
        <div className="add-contact-container">

            {/* HEADER */}
            <div className="chat-header">
                <button className="back-btn" onClick={() => setScreen("private")}>←</button>
                <span>Adicionar Contato</span>
                <div style={{ width: 20 }}></div>
            </div>

            {/* CONTEÚDO */}
            <div className="add-contact-card">
                <div className="input-block">
                    <label>Pesquisar usuário</label>
                    <input
                        type="text"
                        placeholder="Digite nome ou email..."
                        value={search}
                        onChange={e => searchUsers(e.target.value)}
                    />
                </div>

                {message && (
                    <div className="add-contact-msg">
                        {message}
                    </div>
                )}

                <div className="contact-search-list">
                    {filtered
                        .filter(u => u.id !== currentUser.uid)
                        .map(u => (
                            <div key={u.id} className="contact-search-item">
                                <Avatar user={u} size={42} />
                                <div className="contact-search-info">
                                    <div className="name">{u.nome || u.email}</div>
                                    <div className="email">{u.email}</div>
                                </div>

                                <button
                                    className="btn-small"
                                    disabled={adding}
                                    onClick={() => addContact(u)}
                                >
                                    Adicionar
                                </button>
                            </div>
                        ))
                    }

                    {filtered.length === 0 && search.length > 0 && (
                        <div className="no-results">Nenhum usuário encontrado.</div>
                    )}
                </div>

            </div>
        </div>
    );
}
