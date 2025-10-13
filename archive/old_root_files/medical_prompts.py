"""
Medical Learning Platform - Prompt Templates
Specialized prompts for medical education and USMLE preparation
"""

from typing import Dict, List, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field


class LearningStyle(Enum):
    """Different learning styles for personalization"""
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READ_WRITE = "read_write"
    ANALYTICAL = "analytical"
    CLINICAL = "clinical"


class DifficultyLevel(Enum):
    """Question difficulty levels"""
    BASIC = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4
    USMLE_STEP1 = 5


class QuestionType(Enum):
    """Types of medical questions"""
    SINGLE_BEST_ANSWER = "single_best_answer"
    MULTIPLE_CHOICE = "multiple_choice"
    CLINICAL_VIGNETTE = "clinical_vignette"
    IMAGE_BASED = "image_based"
    LAB_VALUES = "lab_values"


class PromptTemplates:
    """Collection of prompt templates for medical education"""

    @staticmethod
    def content_analysis(content: str, focus_areas: Optional[List[str]] = None) -> str:
        """Analyze medical content and extract key concepts"""
        focus_str = f"Focus particularly on: {', '.join(focus_areas)}" if focus_areas else ""

        return f"""Analyze this medical content for USMLE Step 1 preparation:

{content}

{focus_str}

Extract and structure the following information in JSON format:

{{
    "core_concepts": [
        {{
            "concept": "Main concept name",
            "definition": "Clear, concise definition",
            "clinical_significance": "Why this matters clinically",
            "usmle_relevance": "How this appears on USMLE Step 1",
            "difficulty_level": 1-5
        }}
    ],
    "hierarchical_topics": {{
        "main_topic": "Overall topic",
        "subtopics": [
            {{
                "name": "Subtopic name",
                "key_points": ["point1", "point2"],
                "prerequisites": ["required knowledge"]
            }}
        ]
    }},
    "clinical_correlations": [
        {{
            "concept": "Concept name",
            "clinical_scenario": "Real-world application",
            "common_presentations": ["symptom1", "symptom2"],
            "diagnostic_approach": "How to diagnose",
            "treatment_principles": "Management approach"
        }}
    ],
    "high_yield_facts": [
        {{
            "fact": "Critical fact for USMLE",
            "mnemonic": "Memory aid (if applicable)",
            "common_test_format": "How this is tested",
            "buzzwords": ["key terms to recognize"]
        }}
    ],
    "common_misconceptions": [
        {{
            "misconception": "What students often get wrong",
            "correction": "Correct understanding",
            "why_confusing": "Explanation of confusion"
        }}
    ],
    "mnemonics_and_tricks": [
        {{
            "topic": "What to remember",
            "mnemonic": "Memory device",
            "explanation": "How to use it"
        }}
    ],
    "related_topics": [
        {{
            "topic": "Related subject",
            "connection": "How they relate",
            "integration_points": "Where they intersect"
        }}
    ]
}}

Ensure all information is medically accurate, clinically relevant, and optimized for USMLE Step 1 preparation."""

    @staticmethod
    def adaptive_teaching(
        concept: str,
        user_level: int,
        learning_style: LearningStyle,
        recent_errors: List[str],
        context: Optional[str] = None
    ) -> str:
        """Generate adaptive teaching content"""

        level_descriptors = {
            1: "complete beginner - use simple language, avoid jargon",
            2: "basic understanding - some medical terminology okay",
            3: "intermediate - comfortable with medical concepts",
            4: "advanced - preparing for USMLE Step 1",
            5: "expert level - USMLE Step 1 mastery"
        }

        style_instructions = {
            LearningStyle.VISUAL: "Use analogies, mental images, and spatial relationships. Describe visual patterns.",
            LearningStyle.AUDITORY: "Use rhythmic patterns, verbal mnemonics, and discussion-style explanations.",
            LearningStyle.KINESTHETIC: "Use hands-on analogies, physical processes, and action-based descriptions.",
            LearningStyle.READ_WRITE: "Provide detailed written explanations with clear structure and definitions.",
            LearningStyle.ANALYTICAL: "Use logical frameworks, systematic breakdowns, and cause-effect relationships.",
            LearningStyle.CLINICAL: "Emphasize clinical scenarios, patient cases, and practical applications."
        }

        error_context = ""
        if recent_errors:
            error_context = f"\nRecent misconceptions to address:\n" + "\n".join(f"- {error}" for error in recent_errors)

        previous_context = f"\n\nPrevious conversation context:\n{context}" if context else ""

        return f"""You are an expert medical educator teaching a student preparing for USMLE Step 1.

Student Profile:
- Understanding level: {user_level}/5 ({level_descriptors[user_level]})
- Learning style: {learning_style.value}
- Learning style approach: {style_instructions[learning_style]}
{error_context}

Topic to teach: {concept}
{previous_context}

Your task:
1. Explain the concept at the appropriate level for this student
2. Adapt your explanation to their learning style
3. If they have recent errors, address those misconceptions explicitly
4. Use Socratic questioning to promote active thinking
5. Provide clinical examples they can relate to
6. Include memory aids appropriate to their learning style
7. Check understanding with targeted questions

Structure your response as:
1. **Hook**: Start with an engaging clinical scenario or question
2. **Core Explanation**: Teach the concept at their level
3. **Clinical Application**: Show real-world relevance
4. **Memory Aid**: Provide appropriate mnemonic/visualization
5. **Active Recall**: Ask 2-3 questions to check understanding
6. **Common Pitfalls**: Address potential misconceptions
7. **Next Steps**: Suggest what to learn next

Keep explanations clear, engaging, and clinically relevant. Use active voice and conversational tone."""

    @staticmethod
    def socratic_questioning(
        topic: str,
        student_answer: str,
        correct_concept: str,
        depth_level: int = 3
    ) -> str:
        """Generate Socratic questions to guide learning"""

        return f"""You are conducting Socratic teaching for medical education.

Topic: {topic}
Student's answer: {student_answer}
Correct concept: {correct_concept}
Question depth level: {depth_level}/5 (1=surface, 5=deep understanding)

Your role:
1. Don't immediately tell them if they're right or wrong
2. Ask guiding questions that help them discover the answer
3. Build from their current understanding
4. Challenge assumptions constructively
5. Guide toward the correct concept through reasoning

Generate {depth_level} Socratic questions that:
- Start with their current thinking
- Progressively deepen understanding
- Help identify gaps in reasoning
- Lead toward correct understanding
- Encourage clinical thinking

Format as:
{{
    "questions": [
        {{
            "question": "The guiding question",
            "purpose": "What this question aims to reveal",
            "expected_insight": "What realization this should trigger"
        }}
    ],
    "teaching_points": [
        "Key concept to emerge from this dialogue"
    ],
    "if_stuck": "Hint to provide if student is stuck"
}}"""

    @staticmethod
    def nbme_question_generation(
        topic: str,
        difficulty: DifficultyLevel,
        tested_concept: str,
        question_type: QuestionType = QuestionType.CLINICAL_VIGNETTE,
        include_images: bool = False
    ) -> str:
        """Generate NBME/USMLE Step 1 style questions"""

        difficulty_guidelines = {
            DifficultyLevel.BASIC: "Test basic recognition and recall",
            DifficultyLevel.INTERMEDIATE: "Test understanding and application",
            DifficultyLevel.ADVANCED: "Test integration and analysis",
            DifficultyLevel.EXPERT: "Test complex reasoning and synthesis",
            DifficultyLevel.USMLE_STEP1: "NBME-style with clinical integration"
        }

        vignette_requirements = """
Vignette requirements:
- Patient demographics (age, sex, relevant background)
- Chief complaint and history of present illness
- Relevant physical examination findings
- Laboratory/imaging findings (if applicable)
- Clinical context that tests the concept
- 2-4 sentences, clinically realistic
- Include necessary information, exclude red herrings
"""

        return f"""Generate a high-quality USMLE Step 1 style question.

Parameters:
- Topic: {topic}
- Difficulty: {difficulty.name} - {difficulty_guidelines[difficulty]}
- Testing objective: {tested_concept}
- Question type: {question_type.value}
- Include images: {include_images}

{vignette_requirements if question_type == QuestionType.CLINICAL_VIGNETTE else ""}

Requirements:
1. **Clinical Vignette**: Realistic patient scenario
2. **Question Stem**: Clear, direct question
3. **Answer Choices**: 5 options (A-E)
   - One clearly correct answer
   - Four plausible distractors based on common misconceptions
   - Similar length and structure
   - No "all of the above" or "none of the above"

4. **Detailed Explanations**:
   - Why correct answer is right (pathophysiology/mechanism)
   - Why each distractor is wrong
   - Common reasoning errors
   - Related high-yield facts

5. **Educational Value**:
   - Tests understanding, not just recall
   - Clinically relevant scenario
   - Teaches beyond the specific question
   - Reinforces key concepts

Output format:
{{
    "vignette": "Patient presentation...",
    "question": "What is the most likely diagnosis/mechanism/next step?",
    "options": {{
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option",
        "E": "Fifth option"
    }},
    "correct_answer": "C",
    "explanations": {{
        "correct_answer": {{
            "choice": "C",
            "why_correct": "Detailed explanation of why this is correct",
            "mechanism": "Underlying pathophysiology/reasoning",
            "clinical_pearls": ["Key teaching point 1", "Key teaching point 2"]
        }},
        "distractors": {{
            "A": "Why this is incorrect and what misconception it represents",
            "B": "Why this is incorrect and what misconception it represents",
            "D": "Why this is incorrect and what misconception it represents",
            "E": "Why this is incorrect and what misconception it represents"
        }}
    }},
    "concepts_tested": ["Primary concept", "Secondary concept"],
    "difficulty_justification": "Why this is rated at this difficulty",
    "high_yield_takeaways": ["Key fact 1", "Key fact 2"],
    "related_topics": ["Topic 1", "Topic 2"],
    "tags": ["cardiology", "pathophysiology", "diagnosis"],
    "estimated_time": "90 seconds",
    "nbme_relevance": "How this relates to NBME question style"
}}

Ensure medical accuracy, clinical realism, and educational value."""

    @staticmethod
    def performance_analysis(
        question_history: List[Dict[str, Any]],
        user_id: str
    ) -> str:
        """Analyze user performance and identify patterns"""

        questions_summary = "\n".join([
            f"Q{i+1}: Topic: {q['topic']}, Correct: {q['correct']}, Time: {q['time_spent']}s, "
            f"Difficulty: {q['difficulty']}, User answer: {q['user_answer']}"
            for i, q in enumerate(question_history)
        ])

        return f"""Analyze this student's performance on recent USMLE-style questions.

Student ID: {user_id}
Number of questions: {len(question_history)}

Question History:
{questions_summary}

Provide comprehensive analysis in JSON format:

{{
    "overall_performance": {{
        "accuracy": "X%",
        "average_time_per_question": "X seconds",
        "difficulty_distribution": {{"easy": X, "medium": Y, "hard": Z}},
        "trend": "improving/declining/stable"
    }},
    "knowledge_gaps": [
        {{
            "topic": "Specific topic/concept",
            "evidence": "What questions/errors indicate this gap",
            "severity": "critical/moderate/minor",
            "prerequisite_topics": ["What to review first"],
            "recommended_resources": ["Specific chapters/sections"]
        }}
    ],
    "error_patterns": [
        {{
            "pattern": "Type of error (e.g., 'confuses X with Y')",
            "frequency": "How often this occurs",
            "affected_topics": ["Topics where this appears"],
            "root_cause": "Underlying misconception",
            "correction_strategy": "How to address this"
        }}
    ],
    "strengths": [
        {{
            "area": "Topic/skill area",
            "evidence": "What demonstrates this strength",
            "how_to_leverage": "How to build on this"
        }}
    ],
    "time_management": {{
        "overall_pace": "too_fast/optimal/too_slow",
        "topics_taking_too_long": ["Topic1", "Topic2"],
        "topics_rushing_through": ["Topic3"],
        "recommendation": "Specific advice"
    }},
    "difficulty_analysis": {{
        "appropriate_level": X,
        "performing_above_level": ["Topics"],
        "struggling_at_level": ["Topics"],
        "recommended_adjustment": "Should difficulty increase/decrease/stay?"
    }},
    "learning_recommendations": [
        {{
            "priority": "high/medium/low",
            "action": "Specific recommendation",
            "topic": "What to focus on",
            "method": "How to study (active recall, practice questions, etc.)",
            "estimated_time": "Time investment needed"
        }}
    ],
    "next_session_focus": {{
        "primary_topics": ["Topic1", "Topic2"],
        "difficulty_level": X,
        "question_types": ["Type1", "Type2"],
        "estimated_questions": X,
        "learning_objectives": ["Objective1", "Objective2"]
    }},
    "motivation_feedback": "Encouraging, specific feedback based on progress"
}}

Be specific, actionable, and encouraging. Focus on growth mindset and concrete improvements."""

    @staticmethod
    def adaptive_difficulty_adjustment(
        recent_performance: Dict[str, Any],
        current_difficulty: int,
        target_accuracy: float = 0.75
    ) -> str:
        """Determine if difficulty should be adjusted"""

        return f"""Analyze whether to adjust question difficulty for this student.

Current Settings:
- Difficulty level: {current_difficulty}/5
- Target accuracy: {target_accuracy * 100}%

Recent Performance:
- Accuracy: {recent_performance.get('accuracy', 0)}%
- Questions answered: {recent_performance.get('questions_answered', 0)}
- Average time: {recent_performance.get('avg_time', 0)}s
- Consecutive correct: {recent_performance.get('consecutive_correct', 0)}
- Consecutive incorrect: {recent_performance.get('consecutive_incorrect', 0)}
- Topics: {', '.join(recent_performance.get('topics', []))}

Analysis criteria:
1. Accuracy trends (target: {target_accuracy * 100}% ± 10%)
2. Time spent per question
3. Consecutive correct/incorrect answers
4. Topic-specific performance
5. Student confidence indicators

Provide recommendation:
{{
    "adjustment": "increase/decrease/maintain",
    "new_difficulty": X,
    "reasoning": "Why this adjustment is recommended",
    "confidence": "high/medium/low confidence in this recommendation",
    "transition_strategy": "How to transition smoothly",
    "monitor_metrics": ["What to watch in next session"],
    "expected_accuracy": "Predicted accuracy at new level"
}}

Use data-driven reasoning and consider student growth trajectory."""

    @staticmethod
    def learning_path_generation(
        user_profile: Dict[str, Any],
        target_exam: str = "USMLE Step 1",
        time_available: int = 90  # days
    ) -> str:
        """Generate personalized learning path"""

        profile_summary = f"""
Current Knowledge:
- Completed topics: {', '.join(user_profile.get('completed_topics', []))}
- Strong areas: {', '.join(user_profile.get('strengths', []))}
- Weak areas: {', '.join(user_profile.get('weaknesses', []))}
- Overall level: {user_profile.get('level', 3)}/5
- Learning style: {user_profile.get('learning_style', 'visual')}
- Study hours/day: {user_profile.get('study_hours_per_day', 4)}
"""

        return f"""Generate a comprehensive, personalized learning path for USMLE Step 1 preparation.

Student Profile:
{profile_summary}

Target: {target_exam}
Time available: {time_available} days
Total study hours: {time_available * user_profile.get('study_hours_per_day', 4)}

Generate a structured learning path:

{{
    "overview": {{
        "total_topics": X,
        "estimated_completion": "X days",
        "daily_time_commitment": "X hours",
        "confidence_level": "Likelihood of readiness"
    }},
    "phases": [
        {{
            "phase_number": 1,
            "name": "Foundation Building",
            "duration_days": X,
            "objectives": ["Objective 1", "Objective 2"],
            "topics": [
                {{
                    "topic": "Topic name",
                    "subtopics": ["Subtopic1", "Subtopic2"],
                    "estimated_hours": X,
                    "priority": "high/medium/low",
                    "dependencies": ["Required prior knowledge"],
                    "resources": ["Recommended materials"],
                    "milestones": ["Checkpoints for this topic"]
                }}
            ],
            "practice_questions": X,
            "assessments": ["Quiz/test at phase end"]
        }}
    ],
    "daily_schedule": {{
        "template": {{
            "new_content": "X hours",
            "review": "X hours",
            "practice_questions": "X questions",
            "weak_areas": "X minutes"
        }},
        "flexibility": "How to adjust for life events"
    }},
    "spaced_repetition_schedule": [
        {{
            "topic": "Topic to review",
            "initial_learning": "Day X",
            "review_intervals": ["Day X", "Day Y", "Day Z"],
            "mastery_check": "Day M"
        }}
    ],
    "weakness_remediation": [
        {{
            "weakness": "Specific weak area",
            "intervention_start": "Day X",
            "targeted_practice": "Specific exercises",
            "reassessment": "Day Y",
            "success_criteria": "How to know it's resolved"
        }}
    ],
    "milestones": [
        {{
            "day": X,
            "checkpoint": "What to achieve",
            "assessment": "How to measure",
            "contingency": "What to do if behind"
        }}
    ],
    "adaptive_elements": {{
        "difficulty_progression": "How difficulty increases over time",
        "topic_sequencing": "Logic behind topic order",
        "adjustment_triggers": "When to modify the plan"
    }},
    "motivation_strategy": {{
        "weekly_goals": ["Achievable weekly targets"],
        "reward_milestones": ["Celebration points"],
        "progress_tracking": "How student sees progress"
    }}
}}

Ensure the path is:
1. Realistic given time constraints
2. Builds on existing knowledge
3. Addresses weaknesses systematically
4. Incorporates spaced repetition
5. Maintains motivation
6. Adapts to learning style
7. Includes regular assessment"""

    @staticmethod
    def mnemonic_generation(
        concept: str,
        key_points: List[str],
        learning_style: LearningStyle
    ) -> str:
        """Generate effective mnemonics for medical concepts"""

        style_specific = {
            LearningStyle.VISUAL: "Create visual imagery and spatial relationships",
            LearningStyle.AUDITORY: "Use rhymes, rhythms, and sound patterns",
            LearningStyle.KINESTHETIC: "Use physical actions and movements",
            LearningStyle.READ_WRITE: "Use acronyms and written structures",
            LearningStyle.ANALYTICAL: "Use logical frameworks and systematic patterns",
            LearningStyle.CLINICAL: "Use clinical scenarios and patient stories"
        }

        key_points_str = "\n".join(f"- {point}" for point in key_points)

        return f"""Create effective memory aids for medical students.

Concept: {concept}
Learning style: {learning_style.value}
Style-specific approach: {style_specific[learning_style]}

Key points to remember:
{key_points_str}

Generate multiple mnemonic devices:

{{
    "primary_mnemonic": {{
        "type": "acronym/visual/story/rhyme/etc",
        "mnemonic": "The actual mnemonic",
        "explanation": "How to use it",
        "what_it_represents": {{"letter/element": "what it stands for"}}
    }},
    "alternative_mnemonics": [
        {{
            "type": "...",
            "mnemonic": "...",
            "best_for": "When this works better"
        }}
    ],
    "visual_representation": "Description of mental image to create",
    "clinical_association": "Link to clinical scenario",
    "common_errors_to_avoid": ["What students often confuse"],
    "reinforcement_technique": "How to practice this mnemonic",
    "example_usage": "How this appears in a test question"
}}

Make mnemonics:
1. Memorable and sticky
2. Clinically relevant
3. Easy to recall under pressure
4. Appropriate for the learning style
5. Medically accurate"""


class ContextManager:
    """Manage conversation context and memory"""

    def __init__(self, max_short_term: int = 10, max_long_term: int = 50):
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term
        self.sessions = {}  # session_id -> conversation history

    def add_interaction(
        self,
        session_id: str,
        user_message: str,
        assistant_response: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Add interaction to session history"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []

        interaction = {
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_response,
            "metadata": metadata or {}
        }

        self.sessions[session_id].append(interaction)

        # Trim if too long
        if len(self.sessions[session_id]) > self.max_long_term:
            self.sessions[session_id] = self.sessions[session_id][-self.max_long_term:]

    def get_context(
        self,
        session_id: str,
        num_recent: Optional[int] = None
    ) -> str:
        """Get formatted context for prompts"""
        if session_id not in self.sessions:
            return ""

        history = self.sessions[session_id]
        if num_recent:
            history = history[-num_recent:]

        context_parts = []
        for interaction in history:
            context_parts.append(f"User: {interaction['user']}")
            context_parts.append(f"Assistant: {interaction['assistant']}")

        return "\n".join(context_parts)

    def get_summary(self, session_id: str) -> Dict[str, Any]:
        """Get session summary"""
        if session_id not in self.sessions:
            return {}

        history = self.sessions[session_id]
        topics_discussed = set()
        questions_asked = 0

        for interaction in history:
            if interaction["metadata"].get("topic"):
                topics_discussed.add(interaction["metadata"]["topic"])
            if "?" in interaction["user"]:
                questions_asked += 1

        return {
            "total_interactions": len(history),
            "topics_discussed": list(topics_discussed),
            "questions_asked": questions_asked,
            "session_start": history[0]["timestamp"] if history else None,
            "last_interaction": history[-1]["timestamp"] if history else None
        }


# Example usage
if __name__ == "__main__":
    # Example: Generate adaptive teaching prompt
    prompt = PromptTemplates.adaptive_teaching(
        concept="Cardiac action potential",
        user_level=3,
        learning_style=LearningStyle.VISUAL,
        recent_errors=["Confused Phase 0 and Phase 2", "Mixed up fast and slow channels"],
        context="Previously discussed membrane potential basics"
    )
    print(prompt)