package main

import (
	"io"
	"log"
	"net/http"
	"strings"
)

const (
	// Change this to your school domain
	TARGET_DOMAIN = "platform.zone01.gr"
	TARGET_URL    = "https://" + TARGET_DOMAIN
	PROXY_PORT    = ":8080"
)

func main() {
	// Proxy handler
	http.HandleFunc("/", proxyHandler)

	log.Printf("Starting proxy server on http://localhost%s", PROXY_PORT)
	log.Printf("Proxying requests to %s", TARGET_URL)
	log.Println("Press Ctrl+C to stop")

	if err := http.ListenAndServe(PROXY_PORT, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	// Build target URL
	targetURL := TARGET_URL + r.URL.String()

	log.Printf("%s %s -> %s", r.Method, r.URL.Path, targetURL)

	// Create new request
	proxyReq, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		log.Printf("Error creating proxy request: %v", err)
		http.Error(w, "Proxy error", http.StatusInternalServerError)
		return
	}

	// Copy headers from original request
	for name, values := range r.Header {
		for _, value := range values {
			proxyReq.Header.Add(name, value)
		}
	}

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		log.Printf("Error making proxy request: %v", err)
		http.Error(w, "Failed to reach target server", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Copy response headers (except CORS headers that might conflict)
	for name, values := range resp.Header {
		if !strings.HasPrefix(strings.ToLower(name), "access-control-") {
			for _, value := range values {
				w.Header().Add(name, value)
			}
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("Error copying response body: %v", err)
	}

	log.Printf("Response: %d", resp.StatusCode)
}