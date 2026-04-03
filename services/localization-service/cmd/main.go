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

	broker := "fleet-kafka-kafka-bootstrap.fleet-manager.svc.cluster.local:9092"
	topic := "fleet.location.raw"

	writer := &kafka.Writer{
		Addr:     kafka.TCP(broker),
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

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
			}

			time.Sleep(2 * time.Second)
		}
	}()

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})

	log.Fatal(e.Start(":8000"))
}
