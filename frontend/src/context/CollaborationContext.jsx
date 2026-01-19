import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const CollaborationContext = createContext(null);

export const CollaborationProvider = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState([]); // List of other users
    const socketRef = useRef(null);

    // Initial Connection
    useEffect(() => {
        // Connect to the same host/port as backend
        const socket = io(API_BASE_URL); // auto-discovery
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[COLLAB] Connected to Reality Mesh');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('[COLLAB] Disconnected');
            setConnected(false);
        });

        socket.on('user_joined', (user) => {
            console.log(`[COLLAB] User Joined: ${user.name}`);
            setPeers(prev => [...prev, user]);
        });

        socket.on('remote_update', (event) => {
            // Dispatch event to local window for decoupled handling
            // e.g. "twin_remote_update"
            const customEvent = new CustomEvent('twin_remote_update', { detail: event });
            window.dispatchEvent(customEvent);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // API: Join a specific session/room
    const joinSession = (roomId, userProfile) => {
        if (socketRef.current) {
            socketRef.current.emit('join_session', { roomId, userProfile });
        }
    };

    // API: Sync state change
    const broadcastUpdate = (type, data) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('sync_twin_state', {
                roomId: 'default_room', // Using single room for now
                type,
                data
            });
        }
    };

    return (
        <CollaborationContext.Provider value={{ connected, peers, joinSession, broadcastUpdate }}>
            {children}
        </CollaborationContext.Provider>
    );
};

export const useCollaboration = () => useContext(CollaborationContext);
