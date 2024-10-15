package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"notification-service/notifier"
	"notification-service/services"
	"encoding/json"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocket handler to manage connections and handle incoming messages
func HandleConnections(c *gin.Context) {
	w := c.Writer
	r := c.Request

	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer ws.Close()

	// Extract client ID from query parameters
	clientID := r.URL.Query().Get("id")
	if clientID == "" {
		return
	}

	// Register WebSocket connection
	notifier.RegisterClient(clientID, ws)
	log.Printf("Client connected with ID: %s", clientID)

	// Continuously read messages from the client
	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			notifier.RemoveClient(clientID)
			break
		}

		log.Printf("Received message from client %s: %s", clientID, string(msg)) // {driver_id,action,booking_id}

		var msgJSON map[string]interface{}
		if err := json.Unmarshal(msg, &msgJSON); err != nil {
			log.Printf("Failed to unmarshal message: %s", err)
			continue
		}

		// Handle actions like "accept" or "reject"
		if msgJSON["action"] == "driver.update.accept" {
			services.Publish("driver.update", msgJSON)
		}
	}
}
