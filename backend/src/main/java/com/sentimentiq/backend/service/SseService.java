package com.sentimentiq.backend.service;

import com.sentimentiq.backend.dto.AnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userEmail) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userEmail, emitter);

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("READY"));
            log.info("SSE client connected: {}", userEmail);
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event for {}", userEmail);
            emitters.remove(userEmail);
        }

        emitter.onCompletion(() -> emitters.remove(userEmail));
        emitter.onTimeout(()    -> emitters.remove(userEmail));
        emitter.onError(e       -> emitters.remove(userEmail));
        return emitter;
    }

    public void sendEvent(String userEmail, AnalysisResponse response) {
        SseEmitter emitter = emitters.get(userEmail);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event()
                    .name("analysis")
                    .data(response));
        } catch (IOException e) {
            log.warn("SSE send failed for {}", userEmail);
            emitters.remove(userEmail);
        }
    }
}