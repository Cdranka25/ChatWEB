// src/jsx/Sidebar/Sidebar.jsx
import { useState, useRef, useEffect } from "react";
import SettingsScreen from "../Settings/SettingsScreen.jsx";
import Contacts from "../Chat/Contacts/Contacts.jsx";

export default function Sidebar({ currentUser, setChatUser, setChatGroup, setScreen, logout }) {
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef(null);

    // Fechar menu ao clicar fora
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="sidebar">

            {!showSettings && (
                <div className="sidebar-header">
                    <span>Olá, {currentUser.displayName || currentUser.email}</span>

                    <div className="menuContainerContacts" ref={menuRef}>
                        <button className="menu-button" onClick={() => setShowMenu(m => !m)}>
                            ⋮
                        </button>

                        {showMenu && (
                            <div className="menu-dropdown">
                                <div className="menu-item" onClick={() => { setShowMenu(false); setScreen("createGroup"); }}>
                                    Criar Grupo
                                </div>
                                <div className="menu-item" onClick={() => { setShowMenu(false); setShowSettings(false); setScreen("openAddContact"); }}>
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

            {/* CORPO — IDENTICO AO ANTERIOR */}
            {showSettings ? (
                <SettingsScreen onBack={() => setShowSettings(false)} />
            ) : (
                <Contacts
                    currentUser={currentUser}
                    setChatUser={setChatUser}
                    setChatGroup={setChatGroup}
                    setScreen={setScreen}
                />
            )}

        </div>
    );
}
