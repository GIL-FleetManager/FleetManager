package main

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"log"
	"net/http"
	"time"

	_ "github.com/GIL-FleetManager/FleetManager/docs"
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

var db *sql.DB

func initDB() {
	connStr := "postgres://postgres:${POSTGRES_PASSWORD}@localhost:8085/localization_db?sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
}

// @title Localization Service API
// @version 1.0
// @description GPS Firehose for the FleetManager project.
// @host localhost:8084
// @BasePath /
func main() {
	e := echo.New()
	initDB()

	broker := "localhost:9092"
	topic := "fleet.location.raw"

	writer := &kafka.Writer{
		Addr:     kafka.TCP(broker),
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	// Receive GPS from Frontend
	e.POST("/api/location", func(c echo.Context) error {
		point := new(GpsPoint)
		if err := c.Bind(point); err != nil {
			return err
		}
		point.Timestamp = time.Now()

		// 1. Save to TimescaleDB (Historical Tracking)
		query := `INSERT INTO vehicle_locations (vehicle_id, location, speed, time) 
                  VALUES ($1, ST_MakePoint($2, $3), $4, $5)`
		_, err := db.Exec(query, point.VehicleID, point.Lng, point.Lat, point.Speed, point.Timestamp)
		if err != nil {
			log.Printf("DB Error: %v", err)
		}

		// 2. Stream to Kafka (Real-time Alerts)
		payload, _ := json.Marshal(point)
		err = writer.WriteMessages(context.Background(),
			kafka.Message{
				Key:   []byte(point.VehicleID),
				Value: payload,
			},
		)

		return c.JSON(http.StatusAccepted, map[string]string{"status": "captured"})
	})

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "Localisation service is healthy")
	})

	log.Fatal(e.Start(":8084")) // Port 8084 for your Compose setup
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
