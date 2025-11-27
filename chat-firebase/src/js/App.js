import React, { useState, useEffect } from "react";
import "../css/App.css";
import Login from "../jsx/Auth/Login.jsx";
import Register from "../jsx/Auth/Register.jsx";
import Contacts from "../jsx/Chat/Contacts/Contacts.jsx";
import PrivateChat from "../jsx/Chat/Private/PrivateChat";
import GroupChat from "../jsx/Chat/Group/GroupChat";
import CreateGroup from "../jsx/Chat/Group/CreateGroup";
import Profile from "../jsx/Profile/Profile.jsx";
import { auth } from "./Firebase/FirebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

function App() {
    const [user, setUser] = useState(null);
    const [screen, setScreen] = useState("login");
    const [chatUser, setChatUser] = useState(null);
    const [chatGroup, setChatGroup] = useState(null);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {

            if (registering) return;

            if (u) {
                setUser(u);
                setScreen("private");
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
        <div className="whatsapp-container">

            <Contacts
                currentUser={user}
                setChatUser={setChatUser}
                setChatGroup={setChatGroup}
                setScreen={setScreen}
                logout={logout}
            />

            <div className="chat-area">

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

                {!chatUser && screen === "private" && (
                    <div className="chat-header">Selecione uma conversa</div>
                )}
            </div>
        </div>
    );
}

export default App;
