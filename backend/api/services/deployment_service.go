package services

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"c2-control-panel/models"
)

type DeploymentService struct {
	scriptPath string
}

func NewDeploymentService() *DeploymentService {
	// Determine script path - assume it's in the root of the project
	scriptPath := os.Getenv("DEPLOY_SCRIPT_PATH")
	if scriptPath == "" {
		// Default to ../deploy.ps1 relative to backend directory
		scriptPath = filepath.Join("..", "deploy.ps1")
	}
	return &DeploymentService{
		scriptPath: scriptPath,
	}
}

func (s *DeploymentService) Deploy(req *models.DeploymentRequest) (*models.DeploymentResponse, error) {
	// Build command
	var cmd *exec.Cmd
	
	// Check if we're on Windows
	if strings.Contains(strings.ToLower(os.Getenv("OS")), "windows") {
		cmd = exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-File", s.scriptPath)
	} else {
		// On Linux, we might need to trigger via SSH or use a different method
		// For now, return an error
		return &models.DeploymentResponse{
			Status:  "error",
			Message: "Deployment from Linux VM not yet implemented. Deploy from local machine.",
		}, fmt.Errorf("deployment must be triggered from Windows machine")
	}

	// Add git-related parameters if provided
	if req.Branch != "" {
		cmd.Env = append(os.Environ(), fmt.Sprintf("GIT_BRANCH=%s", req.Branch))
	}
	if req.CommitHash != "" {
		cmd.Env = append(os.Environ(), fmt.Sprintf("GIT_COMMIT=%s", req.CommitHash))
	}

	// Capture output
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Start time
	startTime := time.Now()

	// Execute
	err := cmd.Run()
	duration := time.Since(startTime)

	// Combine outputs
	logs := stdout.String()
	if stderr.Len() > 0 {
		logs += "\n\n[STDERR]\n" + stderr.String()
	}

	if err != nil {
		return &models.DeploymentResponse{
			Status:  "error",
			Message: fmt.Sprintf("Deployment failed after %v: %v", duration, err),
			Logs:    logs,
		}, err
	}

	return &models.DeploymentResponse{
		Status:  "success",
		Message: fmt.Sprintf("Deployment completed successfully in %v", duration),
		Logs:    logs,
	}, nil
}

func (s *DeploymentService) GetStatus() map[string]interface{} {
	return map[string]interface{}{
		"scriptPath": s.scriptPath,
		"scriptExists": fileExists(s.scriptPath),
		"platform": os.Getenv("OS"),
	}
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
