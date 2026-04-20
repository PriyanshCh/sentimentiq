package com.sentimentiq.backend.controller;

import com.sentimentiq.backend.dto.*;
import com.sentimentiq.backend.model.Analysis;
import com.sentimentiq.backend.service.AnalysisService;
import com.sentimentiq.backend.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AnalysisController {

    private final AnalysisService analysisService;
    private final SseService sseService;

    @PostMapping("/analyse")
    public ResponseEntity<AnalysisResponse> analyse(
            @RequestBody AnalysisRequest request) {
        log.info("Analysis request received for user: {}", getAuthenticatedEmail());
        return ResponseEntity.ok(
            analysisService.analyse(
                request.getText(), getAuthenticatedEmail()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Analysis>> getHistory() {
        return ResponseEntity.ok(
            analysisService.getHistory(getAuthenticatedEmail()));
    }

    @GetMapping(value = "/stream",
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return sseService.subscribe(getAuthenticatedEmail());
    }

    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "No valid authentication found in security context");
        }
        
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        }
        
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Principal type mismatch: " + principal.getClass().getName());
    }
}