package com.example;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;


@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final String QUEUE = "messages";

    public MessageController(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> publish(@RequestBody MessageDto message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            rabbitTemplate.convertAndSend(QUEUE, payload);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "ENQUEUED", "queue", QUEUE));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}