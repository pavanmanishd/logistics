package services

import (
	"context"
	"log"
	"time"
	"encoding/json"
	amqp "github.com/rabbitmq/amqp091-go"
)

var mqService *MQService

type MQService struct {
	conn *amqp.Connection
	ch   *amqp.Channel
}

// Helper function to handle errors like in the first code
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
	mq.conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
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
			Body: bodyBytes,
		})
	if err != nil {
		return err
	}

	log.Printf(" [x] Sent %s\n", body)
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

func Publish(queueName string, body map[string]interface{}) error {
	return mqService.PublishMessage(queueName, body)
}

func (mq *MQService) ConsumeMessage(queueName string) error {
	// Declare a queue to consume the message from
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

	// Consume the message from the queue
	msgs, err := mq.ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		return err
	}

	forever := make(chan struct{})
	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.Body)
			var data map[string]interface{}
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("Failed to parse message: %s", err)
			}
			log.Printf("Received message: %s", data)

			if data["action"] == "driver.available" {
				UpdateDriverAvailability(data["driver_id"].(string), data["available"].(bool))
			}
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
	return nil
}

func Consume(queueName string) error {
	return mqService.ConsumeMessage(queueName)
}