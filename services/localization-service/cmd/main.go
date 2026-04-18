package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/segmentio/kafka-go"
)

type GpsPoint struct {
	VehicleID string    `json:"vehicle_id"`
	Lat       float64   `json:"latitude"`
	Lng       float64   `json:"longitude"`
	Speed     float32   `json:"vitesse"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	e := echo.New()

	broker := "kafka:9092"
	topic := "fleet.location.raw"

	writer := &kafka.Writer{
		Addr:     kafka.TCP(broker),
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
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

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "healthy",
			"service": "localisation-service",
			"message": "Localisation service is healthy and streaming to Kafka",
		})
	})

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "Localisation service is healthy")
	})

	log.Fatal(e.Start(":8000"))
}
