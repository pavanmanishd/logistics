package notifier

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

// A map to store WebSocket connections
var clients = make(map[string]*websocket.Conn)

// NotifyClient sends a message to the client via WebSocket
func NotifyClient(clientID string, msgType string, message map[string]interface{}) {
    // Retrieve WebSocket connection using the client ID
    ws, ok := clients[clientID]
    if !ok {
        log.Printf("Client with ID %s not found", clientID)
        return
    }

    // Create a message object
    messageJSON := map[string]interface{}{
        "type": msgType,
        "body": message,
    }

    // Marshal the message to JSON
    messageBytes, err := json.Marshal(messageJSON)
    if err != nil {
        log.Printf("Failed to marshal message: %s", err)
        return
    }

    // Write the message to the WebSocket connection
    if err := ws.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
        log.Printf("Error writing message: %v", err)
    }
}

// RegisterClient registers a new WebSocket connection for the given client ID
func RegisterClient(clientID string, ws *websocket.Conn) {
	clients[clientID] = ws
}

// RemoveClient removes a WebSocket connection for the given client ID
func RemoveClient(clientID string) {
	delete(clients, clientID)
}
