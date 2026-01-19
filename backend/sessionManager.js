const socketIo = require('socket.io');

let io;
// Simple in-memory session store for Phase 8
// In production, this would be Redis/Database
const activeSessions = new Map();

function init(httpServer) {
    io = socketIo(httpServer, {
        cors: {
            origin: "*", // Allow all for dev; restrict in prod
            methods: ["GET", "POST"]
        }
    });

    console.log('[System] Real-Time Collaboration Engine Initialized');

    io.on('connection', (socket) => {
        console.log(`[Session] Client Connected: ${socket.id}`);

        // 1. Join Session
        socket.on('join_session', ({ roomId, userProfile }) => {
            const safeRoomId = roomId || 'default_room';
            socket.join(safeRoomId);

            console.log(`[Session] ${userProfile?.name || 'Guest'} (${socket.id}) joined ${safeRoomId}`);

            // Notify others
            socket.to(safeRoomId).emit('user_joined', {
                id: socket.id,
                name: userProfile?.name || 'Unknown Operator',
                role: userProfile?.role || 'VIEWER'
            });
        });

        // 2. Sync State (Twin parameters)
        socket.on('sync_twin_state', (payload) => {
            // payload: { roomId, type, data, timestamp }
            const { roomId, type, data } = payload;

            // Broadcast to everyone ELSE in the room
            // We do NOT echo back to sender to avoid jitter/feedback loops
            socket.to(roomId).emit('remote_update', {
                type,
                data,
                source: socket.id
            });
        });

        // 3. Governance/Safety Log
        socket.on('safety_event', (eventData) => {
            console.log(`[GOVERNANCE] Safety Triggered: ${eventData.type} by ${socket.id}`);
            // In Phase 9 this goes to a persistent ledger
        });

        socket.on('disconnect', () => {
            console.log(`[Session] Client Disconnected: ${socket.id}`);
        });
    });
}

function broadcast(roomId, event, data) {
    if (io) {
        io.to(roomId).emit(event, data);
    }
}

module.exports = { init, broadcast };
