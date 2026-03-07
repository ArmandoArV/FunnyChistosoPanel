package websocket

import (
	"log"
	"sync"
	"time"

	fiberws "github.com/gofiber/websocket/v2"
)

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

type Client struct {
	Hub  *Hub
	Conn *fiberws.Conn
	Send chan []byte
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("[WS] Client connected (%d total)", len(h.Clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("[WS] Client disconnected (%d remaining)", len(h.Clients))
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					go func(c *Client) {
						h.Unregister <- c
					}(client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) HandleConnection(conn *fiberws.Conn) {
	// Configure WebSocket timeouts to prevent premature disconnection
	conn.SetReadDeadline(time.Time{}) // No read deadline
	conn.SetWriteDeadline(time.Time{}) // No write deadline

	client := &Client{
		Hub:  h,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	h.Register <- client

	// Send welcome message to confirm connection
	go func() {
		time.Sleep(100 * time.Millisecond)
		select {
		case client.Send <- []byte(`{"type":"connected","message":"Welcome to C2 WebSocket"}`):
			log.Printf("[WS] Sent welcome message to new client")
		default:
			log.Printf("[WS] Failed to send welcome message (channel busy)")
		}
	}()

	go client.writePump()
	client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		log.Printf("[WS] Client readPump exiting, unregistering")
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline for ping/pong keepalive (2 minutes)
	c.Conn.SetReadDeadline(time.Now().Add(120 * time.Second))

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if fiberws.IsUnexpectedCloseError(err, fiberws.CloseGoingAway, fiberws.CloseAbnormalClosure) {
				log.Printf("[WS] Unexpected close error: %v", err)
			} else {
				log.Printf("[WS] Read error (possibly timeout or normal close): %v", err)
			}
			break
		}
		
		// Reset read deadline on any message received
		c.Conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		
		// Handle ping/pong for keepalive
		msgStr := string(message)
		if msgStr == `{"type":"ping"}` || msgStr == "ping" {
			log.Printf("[WS] Received ping, sending pong")
			select {
			case c.Send <- []byte(`{"type":"pong"}`):
			default:
				log.Printf("[WS] Failed to send pong (channel full)")
			}
			continue
		}
		
		log.Printf("[WS] Received: %s", message)
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(fiberws.TextMessage, message); err != nil {
			log.Printf("[WS] Write error: %v", err)
			break
		}
	}
}
