package com.sentimentiq.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentimentiq.backend.client.MlServiceClient;
import com.sentimentiq.backend.dto.AnalysisResponse;
import com.sentimentiq.backend.model.Analysis;
import com.sentimentiq.backend.model.User;
import com.sentimentiq.backend.repository.AnalysisRepository;
import com.sentimentiq.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final MlServiceClient mlServiceClient;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final SseService sseService;

    private static final String CACHE_PREFIX = "analysis:";
    private static final Duration CACHE_TTL   = Duration.ofHours(1);

    public AnalysisResponse analyse(String text, String userEmail) {
        // 1. Check Redis cache
        String cacheKey = CACHE_PREFIX + text.hashCode();
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("Cache hit for text hash: {}", text.hashCode());
            try {
                AnalysisResponse response =
                    objectMapper.convertValue(cached, AnalysisResponse.class);
                sseService.sendEvent(userEmail, response);
                return response;
            } catch (Exception e) {
                log.warn("Cache deserialisation failed, calling ML service");
            }
        }

        // 2. Call ML service
        log.info("ML service request: text={}, client={}", text.substring(0, Math.min(20, text.length())), mlServiceClient);
        AnalysisResponse response;
        try {
            response = mlServiceClient.predict(text);
            log.info("ML service response received: sentiment={}, confidence={}", 
                response.getSentiment(), response.getConfidence());
        } catch (Exception e) {
            log.error("ML service call failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable", e);
        }

        // 3. Persist to PostgreSQL
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                    new UsernameNotFoundException("User not found: " + userEmail));
        try {
            String emotionsJson =
                objectMapper.writeValueAsString(response.getEmotions());
            Analysis analysis = Analysis.builder()
                    .user(user)
                    .text(text)
                    .sentiment(response.getSentiment())
                    .confidence(response.getConfidence())
                    .emotionsJson(emotionsJson)
                    .build();
            Analysis saved = analysisRepository.saveAndFlush(analysis);
            log.debug("Successfully saved analysis to Postgres with id: {}", saved.getId());
            
            response.setId(saved.getId());
            if (saved.getCreatedAt() == null) {
                log.warn("createdAt is null after saveAndFlush - manually setting createdAt for DTO");
                saved.onCreate(); 
            }
            response.setCreatedAt(saved.getCreatedAt());
        } catch (Exception e) {
            log.error("CRITICAL: Failed to save analysis to PostgreSQL: {}", e.getMessage(), e);
            // Fallback: set a current timestamp so the response is still valid for JSON
            if (response.getCreatedAt() == null) {
                response.setCreatedAt(java.time.LocalDateTime.now());
            }
        }

        // 4. Cache in Redis
        log.debug("Caching response in Redis for key: {}", cacheKey);
        redisTemplate.opsForValue().set(cacheKey, response, CACHE_TTL);

        // 5. Push to SSE
        sseService.sendEvent(userEmail, response);

        return response;
    }

    public List<Analysis> getHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                    new UsernameNotFoundException("User not found: " + userEmail));
        return analysisRepository
            .findByUser_IdOrderByCreatedAtDesc(user.getId());
    }
}