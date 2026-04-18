package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"log"
	"net/http"
	"time"

	_ "github.com/GIL-FleetManager/FleetManager/docs"
	"github.com/labstack/echo/v4"
	"github.com/segmentio/kafka-go"
	echoSwagger "github.com/swaggo/echo-swagger"
)

type GpsPoint struct {
	VehicleID string    `json:"vehicle_id"`
	Lat       float64   `json:"latitude"`
	Lng       float64   `json:"longitude"`
	Speed     float32   `json:"vitesse"`
	Timestamp time.Time `json:"timestamp"`
}

var swaggerJSON []byte

// @title Localization Service API
// @version 1.0
// @description GPS Firehose for the FleetManager project.
// @host localhost:8084
// @BasePath /
func main() {
	e := echo.New()

	broker := "kafka:9092"
	topic := "fleet.location.raw"

	writer := &kafka.Writer{
		Addr:                   kafka.TCP(broker),
		Topic:                  topic,
		Balancer:               &kafka.LeastBytes{},
		AllowAutoTopicCreation: true,
		Async:                  false,
	}
	defer writer.Close()

	// Background GPS Firehose
	go func() {
		log.Printf("Starting GPS Firehose to %s", topic)
		for {
			point := GpsPoint{
				VehicleID: "550e8400-e29b-41d4-a716-446655440000",
				Lat:       49.4431,
				Lng:       1.0993,
				Speed:     85.0,
				Timestamp: time.Now(),
			}

			payload, _ := json.Marshal(point)
			err := writer.WriteMessages(context.Background(),
				kafka.Message{
					Key:   []byte(point.VehicleID),
					Value: payload,
				},
			)

			if err != nil {
				log.Printf("Kafka Error: %v", err)
			} else {
				log.Printf("✔ Sent GPS point for vehicle %s", point.VehicleID)
			}
			time.Sleep(2 * time.Second)
		}
	}()

	// --- ROUTES ---
	e.GET("/api", func(c echo.Context) error {
		return c.Redirect(http.StatusMovedPermanently, "/api/index.html")
	})

	e.GET("/api/doc.json", func(c echo.Context) error {
		return c.JSONBlob(http.StatusOK, swaggerJSON)
	})

	e.GET("/api/*", echoSwagger.WrapHandler)

	e.GET("/", RootHandler)
	e.GET("/health", HealthHandler)

	log.Fatal(e.Start(":8000"))
}

// RootHandler godoc
// @Summary      Service Status
// @Description  Get general information about the service
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       / [get]
func RootHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status":  "healthy",
		"service": "localisation-service",
	})
}

// HealthHandler godoc
// @Summary      Health Check
// @Description  Check if the service is alive
// @Tags         system
// @Produce      plain
// @Success      200  {string}  string "Localisation service is healthy"
// @Router       /health [get]
func HealthHandler(c echo.Context) error {
	return c.String(http.StatusOK, "Localisation service is healthy")
}
