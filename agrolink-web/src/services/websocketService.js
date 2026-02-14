import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

// Connect to WebSocket
export const connectWebSocket = (onConnected, onError) => {
    const socket = new SockJS('/ws'); // Proxied to backend via Vite
    stompClient = Stomp.over(socket);

    stompClient.connect({}, (frame) => {
        console.log('Connected: ' + frame);
        if (onConnected) onConnected(frame);
    }, (error) => {
        console.error('WebSocket Error:', error);
        if (onError) onError(error);
    });
};

// Send Driver Location
export const sendLocation = (driverId, lat, lng, heading = 0) => {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/update-location", {}, JSON.stringify({
            driverId: driverId,
            lat: lat,
            lng: lng,
            heading: heading
        }));
    } else {
        console.warn("WebSocket not connected. Cannot send location.");
    }
};

// Subscribe to Driver Updates
// Returns sender object to allow unsubscription
export const subscribeToDriver = (driverId, callback) => {
    if (stompClient && stompClient.connected) {
        return stompClient.subscribe(`/topic/driver/${driverId}`, (message) => {
            if (message.body) {
                const locationData = JSON.parse(message.body);
                callback(locationData);
            }
        });
    } else {
        console.warn("WebSocket not connected. Cannot subscribe.");
        return null; // Return null if not connected
    }
};

// Disconnect
export const disconnectWebSocket = () => {
    if (stompClient !== null) {
        if (stompClient.connected) {
            stompClient.disconnect(() => {
                console.log("Disconnected");
            });
        }
        stompClient = null;
    }
};
