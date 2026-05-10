package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"
	"google.golang.org/grpc"

	"google.golang.org/grpc/reflection"

	pb "github.com/GIL-FleetManager/FleetManager/pb"
)

type server struct {
	pb.UnimplementedLocationServiceServer
	db          *sql.DB
	kafkaWriter *kafka.Writer
}

// StreamPositions handles the gRPC stream of GPS data
func (s *server) StreamPositions(stream pb.LocationService_StreamPositionsServer) error {
	var count int32

	for {
		pos, err := stream.Recv()
		if err == io.EOF {
			return stream.SendAndClose(&pb.StreamResponse{
				ProcessedCount: count,
				Success:        true,
			})
		}
		if err != nil {
			log.Printf("Error receiving from stream: %v", err)
			return err
		}

		timestamp := time.Unix(pos.Timestamp, 0)

		query := `INSERT INTO positions (vehicule_id, latitude, longitude, vitesse, time) 
                  VALUES ($1, $2, $3, $4, $5)`
		_, dbErr := s.db.Exec(query, pos.VehicleId, pos.Latitude, pos.Longitude, pos.Speed, timestamp)
		if dbErr != nil {
			log.Printf("TimescaleDB Error: %v", dbErr)
		}

		payload, _ := json.Marshal(map[string]interface{}{
			"vehicle_id": pos.VehicleId,
			"latitude":   pos.Latitude,
			"longitude":  pos.Longitude,
			"speed":      pos.Speed,
			"timestamp":  timestamp,
		})

		kafkaErr := s.kafkaWriter.WriteMessages(context.Background(),
			kafka.Message{
				Key:   []byte(pos.VehicleId),
				Value: payload,
			},
		)
		if kafkaErr != nil {
			log.Printf("Kafka Error: %v", kafkaErr)
		}

		count++
		log.Printf("Recorded pos for vehicle %s: Lat %f, Lon %f, Speed %f",
			pos.VehicleId, pos.Latitude, pos.Longitude, pos.Speed)
	}
}

// GetLastKnownLocation fetches the most recent GPS position
func (s *server) GetLastKnownLocation(ctx context.Context, req *pb.GetLocationRequest) (*pb.GPSPosition, error) {
	query := `
		SELECT latitude, longitude, vitesse, time 
		FROM positions 
		WHERE vehicule_id = $1 
		ORDER BY time DESC 
		LIMIT 1`

	var lat, lon float64
	var speed float32
	var t time.Time

	err := s.db.QueryRow(query, req.VehicleId).Scan(&lat, &lon, &speed, &t)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no location found for vehicle %s", req.VehicleId)
		}
		return nil, err
	}

	return &pb.GPSPosition{
		VehicleId: req.VehicleId,
		Latitude:  lat,
		Longitude: lon,
		Speed:     speed,
		Timestamp: t.Unix(),
	}, nil
}

func initDB() *sql.DB {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "fleet-db-postgresql.database.svc.cluster.local"
		}
		databaseURL = fmt.Sprintf("postgres://%s:%s@%s:5432/localization_db?sslmode=disable",
			user, password, host)
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Printf("✅ Connected to database")
	return db
}
func main() {
	db := initDB()
	defer db.Close()

	// Use Strimzi Kafka cluster service name by default
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "fleet-kafka-kafka-bootstrap:9092"
	}

	writer := &kafka.Writer{
		Addr:     kafka.TCP(broker),
		Topic:    "fleet.location.raw",
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	lis, err := net.Listen("tcp", ":8000")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	srv := &server{
		db:          db,
		kafkaWriter: writer,
	}
	pb.RegisterLocationServiceServer(grpcServer, srv)

	reflection.Register(grpcServer)

	log.Printf("Location gRPC server listening at %v", lis.Addr())
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
