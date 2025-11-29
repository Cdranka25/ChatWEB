import React, { useState, useEffect, useRef } from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./Firebase/FirebaseConfig.js";

import Login from "../jsx/Auth/Login.jsx";
import Register from "../jsx/Auth/Register.jsx";

import { loadUserTheme } from "./Chat_js/Wallpaper_js/ThemeLoader.js";


import Sidebar from "../jsx/Sidebar/Sidebar.jsx";
import PrivateChat from "../jsx/Chat/Private/PrivateChat.jsx";
import GroupChat from "../jsx/Chat/Group/GroupChat.jsx";
import CreateGroup from "../jsx/Chat/Group/CreateGroup.jsx";
import AddContact from "../jsx/Chat/Contacts/AddContact.jsx";


import SettingsScreen from "../jsx/Settings/SettingsScreen.jsx";
import SecurityPanel from "../jsx/Settings/Panels/SecurityPanel.jsx";


import Profile from "../jsx/Profile/Profile.jsx";

import "../css/Auth.css";
import "../css/Chat.css";
import "../css/Contacts.css";
import "../css/Emoji.css";
import "../css/Group.css";
import "../css/Layout.css";
import "../css/MenuFlutuante.css";
import "../css/Modal.css";
import "../css/Profile.css";
import "../css/Settings.css";
import "../css/Style.css";
import "../css/Variables.css";

import GroupView from "../jsx/Chat/Group/GroupView.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [screen, setScreen] = useState("login");
    const [chatUser, setChatUser] = useState(null);
    const [chatGroup, setChatGroup] = useState(null);
    const [registering, setRegistering] = useState(false);

    // Sidebar resize state
    const MIN_SIDEBAR = 240;
    const MAX_SIDEBAR = 480;
    const defaultWidth = 320;
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        try {
            const v = parseInt(localStorage.getItem("sidebarWidth"), 10);
            return Number.isFinite(v) ? Math.min(Math.max(v, MIN_SIDEBAR), MAX_SIDEBAR) : defaultWidth;
        } catch {
            return defaultWidth;
        }
    });

    const isResizingRef = useRef(false);

    // save width
    useEffect(() => {
        try { localStorage.setItem("sidebarWidth", String(sidebarWidth)); } catch { }
    }, [sidebarWidth]);

    // global mouse/touch handlers
    useEffect(() => {
        function onMouseMove(e) {
            if (!isResizingRef.current) return;
            const x = e.clientX;
            const w = Math.min(Math.max(x, MIN_SIDEBAR), MAX_SIDEBAR);
            setSidebarWidth(w);
        }
        function onMouseUp() {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.userSelect = "";
        }

        function onTouchMove(e) {
            if (!isResizingRef.current) return;
            const touch = e.touches && e.touches[0];
            if (!touch) return;
            const x = touch.clientX;
            const w = Math.min(Math.max(x, MIN_SIDEBAR), MAX_SIDEBAR);
            setSidebarWidth(w);
            e.preventDefault();
        }
        function onTouchEnd() {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.userSelect = "";
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, []);

    // start resize (mouse)
    function startResize(e) {
        isResizingRef.current = true;
        document.body.style.userSelect = "none";
        e.preventDefault();
    }
    // start resize (touch)
    function startResizeTouch(e) {
        isResizingRef.current = true;
        document.body.style.userSelect = "none";
        e.preventDefault();
    }
    useEffect(() => {
        Notification.requestPermission();
        if ("Notification" in window) {
            if (Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        }
    }, []);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (registering) return;

            if (u) {
                setUser(u);
                setScreen("private");

                loadUserTheme(u);
                console.log("Tema carregado após login");


                Notification.requestPermission().then((perm) => {
                    console.log("Permissão de notificação:", perm);
                });
            } else {
                setUser(null);
                setScreen("login");
            }
        });

        return () => unsub();
    }, [registering]);


    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setScreen("login");
    };

    // TELAS SEM LOGIN
    if (!user) {
        if (screen === "register") {
            return (
                <Register
                    setScreen={setScreen}
                    setRegistering={setRegistering}
                />
            );
        }

        return <Login setUser={setUser} setScreen={setScreen} />;
    }

    // TELAS LOGADAS
    return (
        <div
            className="whatsapp-container"
            style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden", background: "var(--chat-bg, #f6f0ea)" }}
        >
            <div
                style={{
                    width: sidebarWidth,
                    minWidth: MIN_SIDEBAR,
                    maxWidth: MAX_SIDEBAR,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--sidebar-bg, #fff)",
                    position: "relative",
                    borderRight: "none"
                }}
            >
                <Sidebar
                    currentUser={user}
                    setChatUser={setChatUser}
                    setChatGroup={setChatGroup}
                    setScreen={setScreen}
                    logout={logout}
                />

                <div
                    onMouseDown={startResize}
                    onTouchStart={startResizeTouch}
                    role="separator"
                    aria-orientation="vertical"
                    className="sidebar-resizer"
                    style={{
                        position: "absolute",
                        top: 0,
                        right: -4,
                        height: "100%",
                        width: 8,
                        cursor: "ew-resize",
                        zIndex: 500,
                        background: "transparent",
                        pointerEvents: "auto"
                    }}
                />
            </div>

            <div className="chat-area" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
                {screen === "private" && chatUser && (
                    <PrivateChat
                        currentUser={user}
                        otherUser={chatUser}
                        onClose={() => {
                            setChatUser(null);
                            setScreen("private");
                        }}
                    />
                )}

                {screen === "group" && chatGroup && (
                    <GroupChat
                        currentUser={user}
                        group={chatGroup}
                        onClose={() => {
                            setChatGroup(null);
                            setScreen("private");
                        }}
                        onOpenGroupView={(g) => {
                            setChatGroup(g);
                            setScreen("groupView");
                        }}
                    />
                )}

                {screen === "createGroup" && (
                    <CreateGroup
                        currentUser={user}
                        setScreen={setScreen}
                    />
                )}

                {screen === "profile" && (
                    <Profile
                        currentUser={user}
                        setScreen={setScreen}
                    />
                )}

                {screen === "openAddContact" && (
                    <AddContact
                        currentUser={user}
                        setScreen={setScreen}
                    />
                )}

                {screen === "groupView" && chatGroup && (
                    <GroupView
                        group={chatGroup}
                        currentUser={user}
                        onClose={() => setScreen("group")}
                    />
                )}


                {!chatUser && screen === "private" && (
                    <div className="chat-header">Selecione uma conversa</div>
                )}
            </div>
        </div>
    );

}

export default App;
