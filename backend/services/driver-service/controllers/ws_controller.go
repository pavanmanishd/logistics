package controllers

import (
	"driver-service/services"
	"log"

	"net/http"
    "encoding/json"
    "bytes"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}


type LocationUpdate struct {
    Latitude  float64 `json:"latitude"`
    Longitude float64 `json:"longitude"`
    DriverID  string  `json:"driver_id"`
}
func LocationWebSocket(c *gin.Context) {
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Println("Failed to set websocket upgrade: ", err)
        return
    }
    defer conn.Close()

    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            log.Println("read:", err)
            break
        }
        log.Printf("Received location update: %s", message) 
        var location LocationUpdate
        err = json.NewDecoder(bytes.NewReader(message)).Decode(&location)
        if err != nil {
            log.Println("Failed to decode message: ", err)
            break
        }
        services.UpdateLocation(location.DriverID, location.Longitude, location.Latitude)
    }
}