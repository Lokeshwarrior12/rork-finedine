package realtime

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for development
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)
const (
	maxMessageSize = 1024
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
)

type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type Hub struct {
	Clients    map[string]*Client
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

var WSHub = &Hub{
	Clients:    make(map[string]*Client),
	Broadcast:  make(chan []byte, 256),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
}

// Run the WebSocket hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("🔌 Client connected: %s (Total: %d)", client.ID, len(h.Clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("🔌 Client disconnected: %s (Total: %d)", client.ID, len(h.Clients))

		case message := <-h.Broadcast:
			h.mu.RLock()
			for _, client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client.ID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Send message to specific user
func (h *Hub) SendToUser(userID string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- data:
			default:
			}
		}
	}
	return nil
}

// Broadcast to all connected clients
func (h *Hub) BroadcastMessage(message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.Broadcast <- data
	return nil
}

// Handle WebSocket connections
func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	userID := c.Query("userId")
	clientID := c.Query("clientId")
	if clientID == "" {
		clientID = "anonymous_" + time.Now().Format("20060102150405")
	}

	client := &Client{
		ID:     clientID,
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	WSHub.Register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// Read messages from WebSocket
func (c *Client) readPump() {
	defer func() {
		WSHub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// Handle incoming messages (e.g., typing indicators, presence)
		log.Printf("Received message from %s: %s", c.ID, message)
	}
}

// Write messages to WebSocket
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("WebSocket ping error: %v", err)
				return
			}
		}
	}
}


// Message types for real-time events
type RealtimeMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Send order update to customer
func SendOrderUpdate(orderID, customerID string, status string) {
	message := RealtimeMessage{
		Type: "order_update",
		Payload: map[string]interface{}{
			"order_id": orderID,
			"status":   status,
		},
	}
	WSHub.SendToUser(customerID, message)
}

// Send booking confirmation
func SendBookingConfirmation(bookingID, customerID string) {
	message := RealtimeMessage{
		Type: "booking_confirmed",
		Payload: map[string]interface{}{
			"booking_id": bookingID,
		},
	}
	WSHub.SendToUser(customerID, message)
}

// Broadcast new deal
func BroadcastNewDeal(deal interface{}) {
	message := RealtimeMessage{
		Type:    "new_deal",
		Payload: deal,
	}
	WSHub.BroadcastMessage(message)
}
