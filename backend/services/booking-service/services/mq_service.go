package services

import (
	"context"
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

var mqService *MQService

type MQService struct {
	conn *amqp.Connection
	ch   *amqp.Channel
}

// Helper function to handle errors
func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

// NewMQService returns a new instance of MQService
func NewMQService() *MQService {
	return &MQService{}
}

// Connect establishes a connection to RabbitMQ and opens a channel
func (mq *MQService) Connect() error {
	var err error
	mq.conn, err = amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		return err
	}
	mq.ch, err = mq.conn.Channel()
	if err != nil {
		return err
	}
	return nil
}

// PublishMessage publishes a message to the specified queue
func (mq *MQService) PublishMessage(queueName string, body map[string]interface{}) error {
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}

	// Declare a queue to send the message to
	q, err := mq.ch.QueueDeclare(
		queueName, // name of the queue
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Publish the message to the queue
	err = mq.ch.PublishWithContext(ctx,
		"",     // exchange
		q.Name, // routing key (queue name)
		false,  // mandatory
		false,  // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        bodyBytes,
		})
	if err != nil {
		return err
	}

	log.Printf(" [x] Sent %s\n", body)
	return nil
}

// ConsumeMessages continuously reads messages from the specified queue
func (mq *MQService) ConsumeMessages(queueName string) error {
	// Declare the queue from which we're going to consume
	q, err := mq.ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return err
	}

	// Start consuming messages from the queue
	msgs, err := mq.ch.Consume(
		q.Name, // queue
		"",     // consumer tag
		true,   // auto-acknowledge
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // arguments
	)
	if err != nil {
		return err
	}

	// Channel to block the main thread while the consumer runs
	forever := make(chan struct{})

	// Goroutine to process messages from the queue
	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.Body)
			// Parse the JSON message
			var data map[string]interface{}
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("Failed to parse message: %s", err)
			}

			// Process the message
			log.Printf("Received message: %s", data)
			
			if (queueName == "driver.update") {
				if data["action"] == "driver.update.accept" {
					log.Printf("Driver %s accepted booking %s", data["driver_id"], data["booking_id"])
					UpdateDriverID(data["booking_id"].(string), data["driver_id"].(string))
					booking, err := FindBookingByID(data["booking_id"].(string))
					if err != nil {
						log.Printf("Failed to find booking: %s", err)
					}

					err = UpdateBookingStatus(data["booking_id"].(string), "accepted")
					if err != nil {
						log.Printf("Failed to update booking status: %s", err)
					}

					err = Publish("user.notification", map[string]interface{}{
						"client_id": booking.UserID,
						"type": "update",
						"body": map[string]string{
							"booking_id": data["booking_id"].(string),
							"status":     "accepted",
							"driver_id":  data["driver_id"].(string),
							"user_id":    booking.UserID,
						},
					})
					
					if err != nil {
						log.Printf("Failed to publish message: %s", err)
					}
				} else if data["action"] == "driver.update.reject" {
					log.Printf("Driver %s rejected booking %s", data["driver_id"], data["booking_id"])
				} else {
					log.Printf("Unknown action: %s", data["action"])
				}
			}
		}
	}()

	log.Printf(" [*] Waiting for messages on queue: %s. To exit press CTRL+C", queueName)
	<-forever // Block forever until interrupted
	return nil
}

// Close closes the RabbitMQ connection and channel
func (mq *MQService) Close() {
	if mq.ch != nil {
		mq.ch.Close()
	}
	if mq.conn != nil {
		mq.conn.Close()
	}
}

// InitMQService initializes the MQService singleton
func InitMQService() {
	mqService = NewMQService()
	failOnError(mqService.Connect(), "Failed to connect to RabbitMQ")
}

func Consume(qname string) {
	failOnError(mqService.ConsumeMessages(qname), "Failed to consume messages")
}

func Publish(queueName string, body map[string]interface{}) error {
	return mqService.PublishMessage(queueName, body)
}
