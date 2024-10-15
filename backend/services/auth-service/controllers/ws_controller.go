package controllers

import (
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

// redirect to the location websocket
func HandleLocationWSProxy(c *gin.Context) {
    clienConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer clienConn.Close()
    

    driverLocationWS := "ws://localhost:8082/ws/location"
    serverConn, _, err := websocket.DefaultDialer.Dial(driverLocationWS, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer serverConn.Close()

    go func() {
        for {
            _, message, err := serverConn.ReadMessage()
            if err != nil {
                log.Println(err)
                return
            }
            if err := clienConn.WriteMessage(websocket.TextMessage, message); err != nil {
                log.Println(err)
                return
            }
        }
    }()

    for {
        _, message, err := clienConn.ReadMessage()
        if err != nil {
            log.Println(err)
            return
        }
        if err := serverConn.WriteMessage(websocket.TextMessage, message); err != nil {
            log.Println(err)
            return
        }
    }
}

// redirect to the notification websocket
func HandleNotificationWSProxy(c *gin.Context) {
    clienConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer clienConn.Close()
    
    clientId := c.Query("id")
    notificationWS := "ws://localhost:8083/ws/notification?id=" + clientId
    serverConn, _, err := websocket.DefaultDialer.Dial(notificationWS, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer serverConn.Close()

    go func() {
        for {
            _, message, err := serverConn.ReadMessage()
            if err != nil {
                log.Println(err)
                return
            }
            if err := clienConn.WriteMessage(websocket.TextMessage, message); err != nil {
                log.Println(err)
                return
            }
        }
    }()

    for {
        _, message, err := clienConn.ReadMessage()
        if err != nil {
            log.Println(err)
            return
        }
        if err := serverConn.WriteMessage(websocket.TextMessage, message); err != nil {
            log.Println(err)
            return
        }
    }
}
