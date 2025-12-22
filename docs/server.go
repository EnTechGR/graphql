package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	TARGET_DOMAIN = "platform.zone01.gr"
	TARGET_URL    = "https://" + TARGET_DOMAIN
	SERVER_PORT   = ":8080"
	STATIC_DIR    = "."
)

func main() {
	http.HandleFunc("/", mainHandler)

	log.Printf("Starting server on http://localhost%s", SERVER_PORT)
	log.Printf("Serving static files from: %s", STATIC_DIR)
	log.Printf("Proxying API requests to: %s", TARGET_URL)
	log.Println("Open http://localhost:8080 in your browser")
	log.Println("Press Ctrl+C to stop")

	if err := http.ListenAndServe(SERVER_PORT, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func mainHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		proxyHandler(w, r)
		return
	}

	serveStaticFile(w, r)
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "OPTIONS" {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        w.WriteHeader(http.StatusOK)
        return
    }

    targetURL := TARGET_URL + r.URL.String()
    log.Printf("PROXY: %s %s -> %s", r.Method, r.URL.Path, targetURL)

    proxyReq, err := http.NewRequest(r.Method, targetURL, r.Body)
    if err != nil {
        log.Printf("Error creating proxy request: %v", err)
        http.Error(w, "Proxy error", http.StatusInternalServerError)
        return
    }

    for name, values := range r.Header {
        for _, value := range values {
            proxyReq.Header.Add(name, value)
        }
    }
    proxyReq.Host = TARGET_DOMAIN

    client := &http.Client{}
    resp, err := client.Do(proxyReq)
    if err != nil {
        log.Printf("Error making proxy request: %v", err)
        http.Error(w, "Failed to reach target server", http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()

    for name, values := range resp.Header {
        if strings.HasPrefix(strings.ToLower(name), "access-control-") {
            continue
        }
        for _, value := range values {
            w.Header().Add(name, value)
        }
    }

    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    w.Header().Set("Access-Control-Allow-Credentials", "true")

    w.WriteHeader(resp.StatusCode)
    if _, err := io.Copy(w, resp.Body); err != nil {
        log.Printf("Error copying response body: %v", err)
    }

    log.Printf("PROXY Response: %d", resp.StatusCode)
}

func serveStaticFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/index.html"
	}

	cleanPath := filepath.Clean(path)
	
	if strings.Contains(cleanPath, "..") {
		log.Printf("Security: Blocked access to: %s", cleanPath)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	relativePath := strings.TrimPrefix(cleanPath, "/")
	filePath := filepath.Join(STATIC_DIR, relativePath)

	info, err := os.Stat(filePath)
	if err != nil {
		log.Printf("File not found: %s (tried: %s)", path, filePath)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	
	if info.IsDir() {
		log.Printf("Directory access blocked: %s", filePath)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	contentType := getContentType(filePath)
	w.Header().Set("Content-Type", contentType)

	if strings.HasPrefix(path, "/css/") || strings.HasPrefix(path, "/js/") {
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}

	log.Printf("Serving: %s (%s)", path, contentType)
	http.ServeFile(w, r, filePath)
}

func getContentType(filePath string) string {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".html":
		return "text/html; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".ico":
		return "image/x-icon"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	default:
		return "application/octet-stream"
	}
}