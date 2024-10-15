package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"encoding/json"
)

var clients = make(map[string]*websocket.Conn) // Map to store WebSocket connections

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleConnections(c *gin.Context) {
	w := c.Writer
	r := c.Request
	
	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	// Extract client ID from query parameters (or generate one)
	clientID := r.URL.Query().Get("id")
	if clientID == "" {
		return
	}

	// Store the WebSocket connection using the client ID
	clients[clientID] = ws
	log.Printf("Client connected with ID: %s", clientID)

	// Continuously read messages from the client (optional)
	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, clientID) // Remove client on error
			break
		}

		// Log received message (optional)
		log.Printf("Received message from client %s: %s", clientID, string(msg))
	}
}

func NotifyClient(clientID string, message map[string]interface{}) {
	// Retrieve WebSocket connection using the client ID
	ws, ok := clients[clientID]
	if !ok {
		log.Printf("Client with ID %s not found", clientID)
		return
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal message: %s", err)
		return
	}

	// Write message to the WebSocket connection
	if err := ws.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
		log.Printf("error: %v", err)
	}
}