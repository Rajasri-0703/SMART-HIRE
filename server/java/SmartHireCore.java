/**
 * SmartHire - Object Oriented Programming in Java (OOPJ) Academic Reference Module
 * Package: org.smarthire.core
 *
 * Implements core domain models, inheritance, polymorphism, encapsulation,
 * and Design Patterns (Strategy Pattern for Fit Scoring, Factory Pattern for Processing).
 */

package org.smarthire.core;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Base Abstract Entity with ID, Audit Timestamps, and Encapsulation
 */
abstract class BaseEntity {
    protected Long id;
    protected LocalDateTime createdAt;
    protected LocalDateTime updatedAt;

    public BaseEntity(Long id) {
        this.id = id;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

/**
 * Recruiter Domain Model (OOPJ: Encapsulation)
 */
class Recruiter extends BaseEntity {
    private String fullName;
    private String email;
    private String department;
    private String role; // "RECRUITER", "HR_MANAGER"

    public Recruiter(Long id, String fullName, String email, String department, String role) {
        super(id);
        this.fullName = fullName;
        this.email = email;
        this.department = department;
        this.role = role;
    }

    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getDepartment() { return department; }
    public String getRole() { return role; }
}

/**
 * Resume Document Model (OOPJ: Representation of Unstructured to Semi-structured artifact)
 */
class Resume extends BaseEntity {
    private String originalFileName;
    private String fileType; // PDF, DOCX, TXT
    private long fileSizeBytes;
    private String extractedRawText;
    private String processingStatus; // PENDING, PROCESSED, FAILED

    public Resume(Long id, String originalFileName, String fileType, long fileSizeBytes, String rawText) {
        super(id);
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.fileSizeBytes = fileSizeBytes;
        this.extractedRawText = rawText;
        this.processingStatus = "PROCESSED";
    }

    public String getOriginalFileName() { return originalFileName; }
    public String getExtractedRawText() { return extractedRawText; }
    public String getProcessingStatus() { return processingStatus; }
}

/**
 * Candidate Domain Model (OOPJ: Aggregation & Entity Invariants)
 */
class Candidate extends BaseEntity {
    private String fullName;
    private String email;
    private String phone;
    private String education;
    private int educationLevel; // 1: HS, 2: Diploma, 3: Bachelor, 4: Master, 5: PhD
    private double yearsOfExperience;
    private String currentTitle;
    private Set<String> detectedSkills;
    private List<String> programmingLanguages;
    private List<String> certifications;
    private List<String> projects;

    public Candidate(Long id, String fullName, String email, String phone, String education,
                     int educationLevel, double yearsOfExperience, String currentTitle) {
        super(id);
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.education = education;
        this.educationLevel = educationLevel;
        this.yearsOfExperience = yearsOfExperience;
        this.currentTitle = currentTitle;
        this.detectedSkills = new HashSet<>();
        this.programmingLanguages = new ArrayList<>();
        this.certifications = new ArrayList<>();
        this.projects = new ArrayList<>();
    }

    public void addSkill(String skill) {
        this.detectedSkills.add(skill.trim().toLowerCase());
    }

    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getEducation() { return education; }
    public int getEducationLevel() { return educationLevel; }
    public double getYearsOfExperience() { return yearsOfExperience; }
    public Set<String> getDetectedSkills() { return Collections.unmodifiableSet(detectedSkills); }
}

/**
 * Job Vacancy Entity
 */
class Job extends BaseEntity {
    private String title;
    private String department;
    private String description;
    private String requiredEducation;
    private int requiredEducationLevel;
    private double minExperienceYears;
    private List<String> requiredSkills;
    private List<String> preferredSkills;
    private String location;
    private String employmentType; // Full-time, Contract, Remote
    private double skillMatchThreshold; // e.g. 0.50 (50%)

    public Job(Long id, String title, String department, String description,
               String requiredEducation, int requiredEducationLevel, double minExperienceYears) {
        super(id);
        this.title = title;
        this.department = department;
        this.description = description;
        this.requiredEducation = requiredEducation;
        this.requiredEducationLevel = requiredEducationLevel;
        this.minExperienceYears = minExperienceYears;
        this.requiredSkills = new ArrayList<>();
        this.preferredSkills = new ArrayList<>();
        this.skillMatchThreshold = 0.50;
    }

    public void addRequiredSkill(String skill) { this.requiredSkills.add(skill.trim().toLowerCase()); }
    public void addPreferredSkill(String skill) { this.preferredSkills.add(skill.trim().toLowerCase()); }

    public String getTitle() { return title; }
    public List<String> getRequiredSkills() { return requiredSkills; }
    public List<String> getPreferredSkills() { return preferredSkills; }
    public int getRequiredEducationLevel() { return requiredEducationLevel; }
    public double getMinExperienceYears() { return minExperienceYears; }
    public double getSkillMatchThreshold() { return skillMatchThreshold; }
}

/**
 * FitScore Value Object containing weights and sub-component breakdown
 */
class FitScore {
    private final double overallScore;
    private final double skillMatchScore;
    private final double preferredSkillScore;
    private final double educationScore;
    private final double experienceScore;
    private final double certProjectScore;

    public FitScore(double overall, double skills, double pref, double edu, double exp, double certProj) {
        this.overallScore = Math.round(overall * 10.0) / 10.0;
        this.skillMatchScore = Math.round(skills * 10.0) / 10.0;
        this.preferredSkillScore = Math.round(pref * 10.0) / 10.0;
        this.educationScore = Math.round(edu * 10.0) / 10.0;
        this.experienceScore = Math.round(exp * 10.0) / 10.0;
        this.certProjectScore = Math.round(certProj * 10.0) / 10.0;
    }

    public double getOverallScore() { return overallScore; }
    public double getSkillMatchScore() { return skillMatchScore; }
    public double getEducationScore() { return educationScore; }
    public double getExperienceScore() { return experienceScore; }
}

/**
 * Strategy Pattern for Dynamic Fit Score Calculation
 */
interface FitScoreStrategy {
    FitScore calculate(Candidate candidate, Job job, Map<String, Double> weights);
}

class WeightedFitScoreStrategy implements FitScoreStrategy {
    @Override
    public FitScore calculate(Candidate candidate, Job job, Map<String, Double> weights) {
        Set<String> candidateSkills = candidate.getDetectedSkills();
        List<String> reqSkills = job.getRequiredSkills();
        List<String> prefSkills = job.getPreferredSkills();

        // 1. Required Skill Match (DMGT Set Intersection)
        long matchedReqCount = reqSkills.stream()
                .filter(req -> candidateSkills.contains(req) || candidateSkills.stream().anyMatch(cs -> cs.contains(req)))
                .count();
        double reqRatio = reqSkills.isEmpty() ? 1.0 : (double) matchedReqCount / reqSkills.size();
        double reqScore = reqRatio * 100.0;

        // 2. Preferred Skill Match
        long matchedPrefCount = prefSkills.stream()
                .filter(pref -> candidateSkills.contains(pref) || candidateSkills.stream().anyMatch(cs -> cs.contains(pref)))
                .count();
        double prefRatio = prefSkills.isEmpty() ? 1.0 : (double) matchedPrefCount / prefSkills.size();
        double prefScore = prefRatio * 100.0;

        // 3. Education Match
        double eduScore = candidate.getEducationLevel() >= job.getRequiredEducationLevel() ? 100.0 : 50.0;

        // 4. Experience Match
        double expScore = candidate.getYearsOfExperience() >= job.getMinExperienceYears() ? 100.0 :
                Math.max(10.0, (candidate.getYearsOfExperience() / Math.max(1.0, job.getMinExperienceYears())) * 80.0);

        // 5. Portfolio / Certifications baseline
        double certScore = 75.0;

        double wSkills = weights.getOrDefault("required_skills", 0.40);
        double wPref = weights.getOrDefault("preferred_skills", 0.20);
        double wEdu = weights.getOrDefault("education", 0.15);
        double wExp = weights.getOrDefault("experience", 0.15);
        double wCert = weights.getOrDefault("certs_projects", 0.10);

        double total = (reqScore * wSkills) + (prefScore * wPref) + (eduScore * wEdu) + (expScore * wExp) + (certScore * wCert);
        return new FitScore(total, reqScore, prefScore, eduScore, expScore, certScore);
    }
}

/**
 * DMGT Rule-Based Eligibility Engine (OOPJ: Strategy & Predicate Logic)
 */
interface EligibilityEngine {
    EligibilityDecision evaluate(Candidate candidate, Job job);
}

class EligibilityDecision {
    private final boolean eligible;
    private final String reason;

    public EligibilityDecision(boolean eligible, String reason) {
        this.eligible = eligible;
        this.reason = reason;
    }

    public boolean isEligible() { return eligible; }
    public String getReason() { return reason; }
}

class RuleBasedEligibilityEngine implements EligibilityEngine {
    @Override
    public EligibilityDecision evaluate(Candidate candidate, Job job) {
        boolean eduOk = candidate.getEducationLevel() >= job.getRequiredEducationLevel();
        boolean expOk = candidate.getYearsOfExperience() >= (job.getMinExperienceYears() - 0.5);

        List<String> reqSkills = job.getRequiredSkills();
        long matchedReqCount = reqSkills.stream()
                .filter(req -> candidate.getDetectedSkills().contains(req))
                .count();
        double ratio = reqSkills.isEmpty() ? 1.0 : (double) matchedReqCount / reqSkills.size();
        boolean skillsOk = ratio >= job.getSkillMatchThreshold();

        if (eduOk && expOk && skillsOk) {
            return new EligibilityDecision(true, "All eligibility prerequisites verified.");
        }

        List<String> reasons = new ArrayList<>();
        if (!eduOk) reasons.add("Education qualification not met");
        if (!expOk) reasons.add("Minimum professional experience requirement not satisfied");
        if (!skillsOk) reasons.add("Mandatory skills threshold below minimum standard");

        return new EligibilityDecision(false, String.join("; ", reasons));
    }
}

/**
 * ScreeningResult Entity aggregating Candidate, Job, FitScore, and Decision
 */
class ScreeningResult extends BaseEntity {
    private final Long jobId;
    private final Long candidateId;
    private final Long resumeId;
    private final FitScore fitScore;
    private final boolean eligible;
    private final String eligibilityReason;
    private String decisionStatus; // PENDING, SHORTLISTED, REJECTED
    private String hrNotes;

    public ScreeningResult(Long id, Long jobId, Long candidateId, Long resumeId,
                           FitScore fitScore, boolean eligible, String eligibilityReason) {
        super(id);
        this.jobId = jobId;
        this.candidateId = candidateId;
        this.resumeId = resumeId;
        this.fitScore = fitScore;
        this.eligible = eligible;
        this.eligibilityReason = eligibilityReason;
        this.decisionStatus = "PENDING";
        this.hrNotes = "";
    }

    public void setDecisionStatus(String status) { this.decisionStatus = status; }
    public void setHrNotes(String notes) { this.hrNotes = notes; }

    public Long getJobId() { return jobId; }
    public Long getCandidateId() { return candidateId; }
    public FitScore getFitScore() { return fitScore; }
    public boolean isEligible() { return eligible; }
    public String getDecisionStatus() { return decisionStatus; }
}

public class SmartHireCore {
    public static void main(String[] args) {
        System.out.println("SmartHire OOPJ Domain Model Engine Initialized.");
    }
}
