package com.sentimentiq.backend.client;

import com.sentimentiq.backend.dto.AnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;

@Component
public class MlServiceClient {

    @Value("${app.ml.service.url}")
    private String mlServiceUrl;

    private final WebClient webClient;

    public MlServiceClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public AnalysisResponse predict(String text) {
        return webClient
                .post()
                .uri(mlServiceUrl + "/predict")
                .bodyValue(Map.of("text", text))
                .retrieve()
                .bodyToMono(AnalysisResponse.class)
                .block();
    }
}