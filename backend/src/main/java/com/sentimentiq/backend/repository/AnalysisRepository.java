package com.sentimentiq.backend.repository;

import com.sentimentiq.backend.model.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnalysisRepository extends JpaRepository<Analysis, String> {
    List<Analysis> findByUser_IdOrderByCreatedAtDesc(String userId);
}