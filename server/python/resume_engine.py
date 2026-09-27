#!/usr/bin/env python3
"""
SmartHire Python Resume Processing & Dynamic Fit Scoring Engine
Academic Project Component: Python & DMGT (Discrete Mathematics & Graph Theory)

Capabilities:
1. Text tokenization & entity extraction (Name, Email, Phone, Education, Experience, Skills, Certs, Projects)
2. Skill dictionary lookup and taxonomy normalization (Set operations)
3. Dynamic Fit Score calculation based on configurable weights
4. DMGT Rule-Based Eligibility Engine (Propositional Predicates & Decision Logic)
"""

import sys
import json
import re
from typing import Dict, List, Any, Optional

# Standard Skill Dictionary across Technical Disciplines
COMMON_SKILLS_TAXONOMY = {
    # Programming Languages
    "python": "Programming Languages",
    "java": "Programming Languages",
    "c++": "Programming Languages",
    "c": "Programming Languages",
    "c#": "Programming Languages",
    "javascript": "Programming Languages",
    "typescript": "Programming Languages",
    "go": "Programming Languages",
    "golang": "Programming Languages",
    "rust": "Programming Languages",
    "ruby": "Programming Languages",
    "php": "Programming Languages",
    "swift": "Programming Languages",
    "kotlin": "Programming Languages",
    "scala": "Programming Languages",
    "r": "Programming Languages",

    # Web & Frameworks
    "react": "Web Technologies",
    "react.js": "Web Technologies",
    "reactjs": "Web Technologies",
    "angular": "Web Technologies",
    "vue": "Web Technologies",
    "vue.js": "Web Technologies",
    "next.js": "Web Technologies",
    "node.js": "Web Technologies",
    "nodejs": "Web Technologies",
    "express": "Web Technologies",
    "express.js": "Web Technologies",
    "django": "Web Technologies",
    "flask": "Web Technologies",
    "fastapi": "Web Technologies",
    "spring": "Web Technologies",
    "spring boot": "Web Technologies",
    "asp.net": "Web Technologies",
    "laravel": "Web Technologies",
    "html": "Web Technologies",
    "html5": "Web Technologies",
    "css": "Web Technologies",
    "css3": "Web Technologies",
    "tailwind": "Web Technologies",
    "tailwind css": "Web Technologies",
    "bootstrap": "Web Technologies",
    "graphql": "Web Technologies",
    "rest api": "Web Technologies",

    # Databases & DBMS
    "sql": "DBMS & Storage",
    "mysql": "DBMS & Storage",
    "postgresql": "DBMS & Storage",
    "postgres": "DBMS & Storage",
    "sqlite": "DBMS & Storage",
    "mongodb": "DBMS & Storage",
    "redis": "DBMS & Storage",
    "cassandra": "DBMS & Storage",
    "oracle": "DBMS & Storage",
    "sql server": "DBMS & Storage",
    "firebase": "DBMS & Storage",
    "dynamodb": "DBMS & Storage",

    # Cloud, DevOps & Tools
    "docker": "DevOps & Cloud",
    "kubernetes": "DevOps & Cloud",
    "k8s": "DevOps & Cloud",
    "aws": "DevOps & Cloud",
    "azure": "DevOps & Cloud",
    "gcp": "DevOps & Cloud",
    "google cloud": "DevOps & Cloud",
    "git": "DevOps & Cloud",
    "github": "DevOps & Cloud",
    "gitlab": "DevOps & Cloud",
    "ci/cd": "DevOps & Cloud",
    "jenkins": "DevOps & Cloud",
    "linux": "DevOps & Cloud",
    "bash": "DevOps & Cloud",
    "terraform": "DevOps & Cloud",
    "ansible": "DevOps & Cloud",

    # AI, ML & Data
    "machine learning": "AI & Data Science",
    "deep learning": "AI & Data Science",
    "nlp": "AI & Data Science",
    "natural language processing": "AI & Data Science",
    "computer vision": "AI & Data Science",
    "tensorflow": "AI & Data Science",
    "pytorch": "AI & Data Science",
    "scikit-learn": "AI & Data Science",
    "pandas": "AI & Data Science",
    "numpy": "AI & Data Science",
    "data science": "AI & Data Science",
    "power bi": "AI & Data Science",
    "tableau": "AI & Data Science",
    "big data": "AI & Data Science",
    "hadoop": "AI & Data Science",
    "spark": "AI & Data Science",

    # Core CS & Software Eng
    "data structures": "Core Computer Science",
    "algorithms": "Core Computer Science",
    "oop": "Core Computer Science",
    "object oriented programming": "Core Computer Science",
    "microservices": "Software Architecture",
    "agile": "Methodologies",
    "scrum": "Methodologies",
    "system design": "Software Architecture"
}

# Skill Synonyms for Fuzzy Normalization (Set Equivalence in DMGT)
SYNONYMS_MAP = {
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "golang": "go",
    "k8s": "kubernetes",
    "amazon web services": "aws",
    "gcp": "google cloud",
    "tailwind": "tailwind css",
    "restful api": "rest api",
    "rest": "rest api",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "ml": "machine learning",
    "dl": "deep learning"
}

DEGREE_HIERARCHY = {
    "ph.d": 5,
    "phd": 5,
    "doctorate": 5,
    "m.tech": 4,
    "mtech": 4,
    "m.s": 4,
    "ms": 4,
    "master": 4,
    "m.sc": 4,
    "msc": 4,
    "mca": 4,
    "mba": 4,
    "b.tech": 3,
    "btech": 3,
    "b.e": 3,
    "be": 3,
    "bachelor": 3,
    "b.sc": 3,
    "bsc": 3,
    "bca": 3,
    "diploma": 2,
    "associate": 2,
    "high school": 1
}

def normalize_skill(skill: str) -> str:
    s = skill.strip().lower()
    return SYNONYMS_MAP.get(s, s)

def extract_email(text: str) -> Optional[str]:
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    match = re.search(email_pattern, text)
    return match.group(0).lower() if match else None

def extract_phone(text: str) -> Optional[str]:
    # Matches phone numbers like +1-555-123-4567, +91 9876543210, (555) 123-4567, etc.
    phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    match = re.search(phone_pattern, text)
    if match:
        return match.group(0).strip()
    return None

def extract_name(text: str, filename: str = "") -> str:
    # Heuristic 1: Inspect first 3 lines of resume
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:5]:
        # Skip labels like 'Resume', 'Curriculum Vitae', 'CV', 'Contact', 'Email'
        if re.search(r'\b(resume|curriculum vitae|cv|page|contact|email|phone|profile)\b', line, re.IGNORECASE):
            continue
        # A name is typically 2 to 4 capitalized words without special chars
        clean = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = clean.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
            return " ".join(words)
        if 2 <= len(words) <= 4 and len(clean) < 35:
            return " ".join([w.capitalize() for w in words])
    
    # Heuristic 2: Deduce from filename (e.g. John_Doe_Resume.pdf)
    if filename:
        base = filename.rsplit('.', 1)[0]
        base = re.sub(r'(resume|cv|profile|v\d+)', '', base, flags=re.IGNORECASE)
        base = re.sub(r'[-_]', ' ', base).strip()
        words = base.split()
        if 1 <= len(words) <= 4:
            return " ".join([w.capitalize() for w in words])
            
    return "Not detected"

def extract_education(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    highest_degree = "Not detected"
    highest_level = 0
    field_of_study = "Computer Science / Engineering"

    for degree, level in DEGREE_HIERARCHY.items():
        # Match word boundaries for degrees
        pattern = r'\b' + re.escape(degree) + r'\b'
        if re.search(pattern, text_lower):
            if level > highest_level:
                highest_level = level
                highest_degree = degree.upper() if len(degree) <= 4 else degree.title()

    # Search for field of study
    fields = [
        "computer science", "information technology", "software engineering", 
        "data science", "artificial intelligence", "electrical engineering",
        "mechanical engineering", "business administration", "information systems"
    ]
    for f in fields:
        if f in text_lower:
            field_of_study = f.title()
            break

    formatted_edu = f"{highest_degree} in {field_of_study}" if highest_degree != "Not detected" else "Not detected"
    return {
        "degree": highest_degree,
        "level": highest_level,
        "formatted": formatted_edu
    }

def extract_experience_years(text: str) -> float:
    text_lower = text.lower()
    
    # Look for explicit years pattern: e.g. "4+ years of experience", "3.5 years experience"
    exp_pattern = r'(\d+(?:\.\d+)?)\s*(?:\+|-)?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)'
    match = re.search(exp_pattern, text_lower)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass

    # Look for year spans: e.g. "2019 - 2023", "2021 to Present", "2018 – Current"
    year_spans = re.findall(r'(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)', text_lower)
    if year_spans:
        current_year = 2026 # Academic anchor
        total_span = 0.0
        for start_str, end_str in year_spans:
            try:
                start_yr = int(start_str)
                end_yr = current_year if end_str in ["present", "current"] else int(end_str)
                if end_yr >= start_yr:
                    total_span = max(total_span, float(end_yr - start_yr))
            except ValueError:
                continue
        if total_span > 0:
            return total_span

    # Secondary check for phrases like "fresher" or "intern"
    if "fresher" in text_lower or "entry level" in text_lower or "new graduate" in text_lower:
        return 0.5

    return 1.0  # Conservative estimate if not explicitly parsed

def extract_skills_and_technologies(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    detected_skills = set()
    detected_languages = set()
    categories = {}

    for skill, cat in COMMON_SKILLS_TAXONOMY.items():
        pattern = r'(?<![a-zA-Z0-9#+])' + re.escape(skill) + r'(?![a-zA-Z0-9#+])'
        if re.search(pattern, text_lower):
            canonical = normalize_skill(skill)
            detected_skills.add(canonical)
            if cat == "Programming Languages":
                detected_languages.add(canonical)
            if cat not in categories:
                categories[cat] = []
            if canonical not in categories[cat]:
                categories[cat].append(canonical)

    return {
        "all_skills": sorted(list(detected_skills)),
        "programming_languages": sorted(list(detected_languages)),
        "by_category": categories
    }

def extract_certifications(text: str) -> List[str]:
    text_lower = text.lower()
    known_certs = [
        "aws certified solutions architect", "aws certified developer", "aws certified cloud practitioner",
        "google cloud professional", "azure fundamentals", "azure solutions architect",
        "certified kubernetes administrator", "cka", "ckad",
        "cisco certified network associate", "ccna",
        "pmp", "project management professional", "scrum master", "csm",
        "oracle certified professional", "comptia security+", "comptia network+"
    ]
    detected = []
    for cert in known_certs:
        if cert in text_lower:
            detected.append(cert.upper() if len(cert) <= 4 else cert.title())

    # Regex search under a "CERTIFICATIONS" section
    cert_section = re.search(r'(?:certifications?|licenses?|credentials?)[:\n]+([\s\S]{1,300})(?=\n\n|[A-Z]{3,}|$)', text, re.IGNORECASE)
    if cert_section:
        lines = [l.strip(' -*•') for l in cert_section.group(1).split('\n') if len(l.strip(' -*•')) > 4]
        for line in lines[:4]:
            if line not in detected and len(line) < 60:
                detected.append(line)

    return detected if detected else ["Not detected"]

def extract_projects(text: str) -> List[str]:
    projects = []
    proj_section = re.search(r'(?:projects?|academic projects?|key projects?)[:\n]+([\s\S]{1,500})(?=\n\n[A-Z]{3,}|$)', text, re.IGNORECASE)
    if proj_section:
        lines = [l.strip(' -*•') for l in proj_section.group(1).split('\n') if len(l.strip(' -*•')) > 5]
        for line in lines[:4]:
            if len(line) < 100:
                projects.append(line)
    return projects if projects else ["Not detected"]

def process_resume_text(text: str, filename: str = "") -> Dict[str, Any]:
    name = extract_name(text, filename)
    email = extract_email(text) or "Not detected"
    phone = extract_phone(text) or "Not detected"
    education = extract_education(text)
    years_exp = extract_experience_years(text)
    skills_data = extract_skills_and_technologies(text)
    certs = extract_certifications(text)
    projects = extract_projects(text)

    # Current/Estimated Job Title
    title = "Software Engineer"
    title_matches = re.findall(r'(full stack developer|backend developer|frontend developer|data engineer|devops engineer|ml engineer|cloud engineer|software engineer|system analyst)', text.lower())
    if title_matches:
        title = title_matches[0].title()

    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "education": education["formatted"],
        "education_level": education["level"],
        "years_experience": years_exp,
        "current_title": title,
        "detected_skills": skills_data["all_skills"],
        "programming_languages": skills_data["programming_languages"],
        "skills_by_category": skills_data["by_category"],
        "certifications": certs,
        "projects": projects
    }

def calculate_dynamic_fit_score(
    candidate: Dict[str, Any],
    job: Dict[str, Any],
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    DMGT Set & Relation Evaluation:
    Required skills match: default 40%
    Preferred skills match: default 20%
    Education match: default 15%
    Experience match: default 15%
    Certifications & Projects: default 10%
    """
    if weights is None:
        weights = {
            "required_skills": 0.40,
            "preferred_skills": 0.20,
            "education": 0.15,
            "experience": 0.15,
            "certs_projects": 0.10
        }

    # Normalize candidate skills into set
    candidate_skills_set = set(normalize_skill(s) for s in candidate.get("detected_skills", []))
    
    # Required Skills Set Intersection (DMGT A ∩ B)
    job_req_skills = [normalize_skill(s) for s in job.get("required_skills", [])]
    job_pref_skills = [normalize_skill(s) for s in job.get("preferred_skills", [])]

    matched_required = []
    missing_required = []
    for req in job_req_skills:
        if req in candidate_skills_set or any(req in cs or cs in req for cs in candidate_skills_set):
            matched_required.append(req)
        else:
            missing_required.append(req)

    matched_preferred = []
    missing_preferred = []
    for pref in job_pref_skills:
        if pref in candidate_skills_set or any(pref in cs or cs in pref for cs in candidate_skills_set):
            matched_preferred.append(pref)
        else:
            missing_preferred.append(pref)

    # 1. Required Skills Score
    if len(job_req_skills) > 0:
        req_ratio = len(matched_required) / len(job_req_skills)
    else:
        req_ratio = 1.0
    req_score = req_ratio * 100.0

    # 2. Preferred Skills Score
    if len(job_pref_skills) > 0:
        pref_ratio = len(matched_preferred) / len(job_pref_skills)
    else:
        pref_ratio = 1.0
    pref_score = pref_ratio * 100.0

    # 3. Education Score
    cand_edu_level = candidate.get("education_level", 0)
    job_edu_str = str(job.get("required_education", "")).lower()
    job_edu_level = 0
    for deg, lvl in DEGREE_HIERARCHY.items():
        if deg in job_edu_str:
            job_edu_level = max(job_edu_level, lvl)

    if job_edu_level == 0:
        job_edu_level = 3 # Default Bachelor level if not specified

    if cand_edu_level >= job_edu_level:
        edu_score = 100.0
        edu_matched = True
    elif cand_edu_level == job_edu_level - 1:
        edu_score = 65.0
        edu_matched = False
    elif cand_edu_level > 0:
        edu_score = 40.0
        edu_matched = False
    else:
        edu_score = 20.0
        edu_matched = False

    # 4. Experience Score
    min_exp = float(job.get("min_experience", 0))
    cand_exp = float(candidate.get("years_experience", 0))
    if min_exp <= 0:
        exp_score = 100.0
        exp_matched = True
    elif cand_exp >= min_exp:
        # Full score with bonus for extra experience up to +15% capped
        exp_score = min(100.0, 100.0)
        exp_matched = True
    else:
        exp_score = max(10.0, (cand_exp / min_exp) * 80.0)
        exp_matched = False

    # 5. Certifications & Projects Score
    certs = candidate.get("certifications", [])
    projects = candidate.get("projects", [])
    cert_count = len([c for c in certs if c != "Not detected"])
    proj_count = len([p for p in projects if p != "Not detected"])
    
    cert_proj_val = min(100.0, (cert_count * 35.0) + (proj_count * 20.0))
    if cert_proj_val == 0:
        cert_proj_val = 30.0 # Baseline credit for portfolio presence

    # Dynamic Composite Fit Score (0 to 100)
    composite_fit = (
        (req_score * weights["required_skills"]) +
        (pref_score * weights["preferred_skills"]) +
        (edu_score * weights["education"]) +
        (exp_score * weights["experience"]) +
        (cert_proj_val * weights["certs_projects"])
    )

    composite_fit = round(min(100.0, max(0.0, composite_fit)), 1)

    # DMGT Rule-based Eligibility Logic:
    # Predicate E_edu: cand_edu_level >= job_edu_level (or within 1 tier if experience high)
    # Predicate E_exp: cand_exp >= min_exp (with 0.5 grace margin)
    # Predicate E_skills: req_ratio >= threshold (e.g. 50% of required skills)
    skill_threshold = float(job.get("skill_threshold", 0.5))
    
    is_edu_ok = cand_edu_level >= job_edu_level or cand_edu_level >= 3
    is_exp_ok = (cand_exp >= (min_exp - 0.5)) if min_exp > 0 else True
    is_skills_ok = req_ratio >= skill_threshold

    disqualification_reasons = []
    if not is_edu_ok:
        disqualification_reasons.append(f"Education criteria not met: Candidate holds {candidate.get('education', 'N/A')}, Job requires {job.get('required_education', 'Degree')}")
    if not is_exp_ok:
        disqualification_reasons.append(f"Minimum experience not satisfied: Candidate has {cand_exp} yrs, Job requires minimum {min_exp} yrs")
    if not is_skills_ok:
        disqualification_reasons.append(f"Required skills match ({len(matched_required)}/{len(job_req_skills)}) is below required threshold of {int(skill_threshold * 100)}%")

    is_eligible = (is_edu_ok and is_exp_ok and is_skills_ok)
    eligibility_reason = "All fundamental eligibility criteria satisfied." if is_eligible else " | ".join(disqualification_reasons)

    return {
        "overall_fit_score": composite_fit,
        "sub_scores": {
            "skill_match_score": round(req_score, 1),
            "preferred_skill_score": round(pref_score, 1),
            "education_match_score": round(edu_score, 1),
            "experience_match_score": round(exp_score, 1),
            "cert_project_score": round(cert_proj_val, 1)
        },
        "weights_applied": weights,
        "is_eligible": is_eligible,
        "eligibility_reason": eligibility_reason,
        "requirements_analysis": {
            "matched_required_skills": matched_required,
            "missing_required_skills": missing_required,
            "matched_preferred_skills": matched_preferred,
            "missing_preferred_skills": missing_preferred,
            "education_satisfied": is_edu_ok,
            "experience_satisfied": is_exp_ok,
            "required_skills_ratio": round(req_ratio * 100, 1)
        }
    }

def main():
    """
    CLI / Stdin JSON Protocol handler for Server Bridge
    Commands:
      - parse_text: extracts candidate profile from raw resume text
      - match_candidate: calculates dynamic fit score and DMGT eligibility
      - full_pipeline: parses text + evaluates job match in one atomic step
    """
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input received"}))
            sys.exit(1)

        payload = json.loads(raw_input)
        command = payload.get("command", "full_pipeline")

        if command == "parse_text":
            text = payload.get("text", "")
            filename = payload.get("filename", "")
            extracted = process_resume_text(text, filename)
            print(json.dumps({"status": "success", "candidate": extracted}))

        elif command == "match_candidate":
            candidate = payload.get("candidate", {})
            job = payload.get("job", {})
            weights = payload.get("weights")
            result = calculate_dynamic_fit_score(candidate, job, weights)
            print(json.dumps({"status": "success", "screening": result}))

        elif command == "full_pipeline":
            text = payload.get("text", "")
            filename = payload.get("filename", "")
            job = payload.get("job", {})
            weights = payload.get("weights")

            candidate = process_resume_text(text, filename)
            screening = calculate_dynamic_fit_score(candidate, job, weights)
            print(json.dumps({
                "status": "success",
                "candidate": candidate,
                "screening": screening
            }))
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
