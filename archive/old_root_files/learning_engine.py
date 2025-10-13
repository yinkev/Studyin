"""
Medical Learning Platform - Learning Engine
Orchestrates AI-powered adaptive learning experiences
"""

import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

from llm_integration import LLMOrchestrator, LLMRequest, TaskComplexity
from rag_pipeline import RAGRetriever, AdaptiveRetrieval
from medical_prompts import (
    PromptTemplates, LearningStyle, DifficultyLevel,
    QuestionType, ContextManager
)


class SessionPhase(Enum):
    """Different phases of a learning session"""
    WARMUP = "warmup"
    TEACHING = "teaching"
    PRACTICE = "practice"
    ASSESSMENT = "assessment"
    REVIEW = "review"


@dataclass
class UserProfile:
    """Comprehensive user learning profile"""
    user_id: str
    level: int = 3  # 1-5 scale
    learning_style: LearningStyle = LearningStyle.CLINICAL
    completed_topics: List[str] = field(default_factory=list)
    in_progress_topics: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    error_patterns: List[Dict[str, Any]] = field(default_factory=list)
    total_questions_answered: int = 0
    correct_answers: int = 0
    average_time_per_question: float = 90.0  # seconds
    study_hours_per_day: int = 4
    target_exam_date: Optional[datetime] = None
    last_session: Optional[datetime] = None
    performance_history: List[Dict[str, Any]] = field(default_factory=list)

    @property
    def accuracy(self) -> float:
        """Calculate overall accuracy"""
        if self.total_questions_answered == 0:
            return 0.0
        return self.correct_answers / self.total_questions_answered

    @property
    def days_until_exam(self) -> int:
        """Days remaining until exam"""
        if not self.target_exam_date:
            return 90  # Default
        return (self.target_exam_date - datetime.now()).days


@dataclass
class LearningSession:
    """Active learning session state"""
    session_id: str
    user_id: str
    phase: SessionPhase
    current_topic: Optional[str] = None
    questions_this_session: List[Dict[str, Any]] = field(default_factory=list)
    concepts_covered: List[str] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    target_questions: int = 20
    current_difficulty: int = 3


class AdaptiveLearningEngine:
    """Core adaptive learning engine"""

    def __init__(
        self,
        llm_orchestrator: LLMOrchestrator,
        rag_retriever: RAGRetriever,
        config: Dict[str, Any]
    ):
        self.llm = llm_orchestrator
        self.rag = rag_retriever
        self.adaptive_rag = AdaptiveRetrieval(rag_retriever)
        self.context_manager = ContextManager()
        self.config = config

        # Learning parameters
        self.target_accuracy = 0.75
        self.difficulty_window = 5  # questions to consider for adjustment
        self.max_consecutive_wrong = 3

    async def start_session(
        self,
        user_profile: UserProfile,
        focus_topics: Optional[List[str]] = None
    ) -> LearningSession:
        """Start a new learning session"""

        session_id = f"{user_profile.user_id}_{datetime.now().isoformat()}"

        # Determine starting topic
        if focus_topics:
            current_topic = focus_topics[0]
        else:
            current_topic = await self._select_next_topic(user_profile)

        session = LearningSession(
            session_id=session_id,
            user_id=user_profile.user_id,
            phase=SessionPhase.WARMUP,
            current_topic=current_topic,
            current_difficulty=user_profile.level
        )

        return session

    async def _select_next_topic(self, user_profile: UserProfile) -> str:
        """Intelligently select the next topic to study"""

        # Use LLM to analyze progress and recommend topic
        prompt = PromptTemplates.learning_path_generation(
            user_profile={
                "completed_topics": user_profile.completed_topics,
                "strengths": user_profile.strengths,
                "weaknesses": user_profile.weaknesses,
                "level": user_profile.level,
                "learning_style": user_profile.learning_style.value,
                "study_hours_per_day": user_profile.study_hours_per_day
            },
            time_available=user_profile.days_until_exam
        )

        request = LLMRequest(
            task_type="learning_path_generation",
            prompt=prompt,
            complexity=TaskComplexity.COMPLEX,
            user_id=user_profile.user_id
        )

        response = await self.llm.call_with_fallback(request)

        # Parse response to get next recommended topic
        try:
            path_data = json.loads(response.content)
            if path_data.get("phases") and path_data["phases"][0].get("topics"):
                return path_data["phases"][0]["topics"][0]["topic"]
        except:
            pass

        # Fallback: focus on weaknesses
        if user_profile.weaknesses:
            return user_profile.weaknesses[0]

        return "General Medicine"

    async def teach_concept(
        self,
        session: LearningSession,
        user_profile: UserProfile,
        concept: str
    ) -> str:
        """Adaptive teaching of a medical concept"""

        # Get relevant context from RAG
        context = await self.adaptive_rag.retrieve_adaptive(
            query=concept,
            user_id=user_profile.user_id,
            session_context={
                "current_level": user_profile.level,
                "learning_style": user_profile.learning_style.value
            }
        )

        # Format context for teaching
        context_text = "\n\n".join([
            f"Reference {i+1}: {chunk['content']}"
            for i, chunk in enumerate(context[:3])
        ])

        # Get conversation context
        conversation_context = self.context_manager.get_context(
            session.session_id,
            num_recent=3
        )

        # Generate adaptive teaching content
        recent_errors = [
            err["pattern"] for err in user_profile.error_patterns[-3:]
        ]

        prompt = PromptTemplates.adaptive_teaching(
            concept=concept,
            user_level=user_profile.level,
            learning_style=user_profile.learning_style,
            recent_errors=recent_errors,
            context=f"{conversation_context}\n\nRelevant material:\n{context_text}"
        )

        request = LLMRequest(
            task_type="socratic_teaching",
            prompt=prompt,
            complexity=TaskComplexity.COMPLEX,
            user_id=user_profile.user_id,
            session_id=session.session_id,
            temperature=0.8  # More creative for teaching
        )

        response = await self.llm.call_with_fallback(request)

        # Record interaction
        self.context_manager.add_interaction(
            session_id=session.session_id,
            user_message=f"Teach me: {concept}",
            assistant_response=response.content,
            metadata={
                "topic": concept,
                "phase": session.phase.value,
                "cost": response.cost
            }
        )

        session.concepts_covered.append(concept)

        return response.content

    async def generate_question(
        self,
        session: LearningSession,
        user_profile: UserProfile,
        topic: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate adaptive USMLE-style question"""

        topic = topic or session.current_topic

        # Determine appropriate difficulty
        current_difficulty = self._calculate_adaptive_difficulty(
            session,
            user_profile
        )

        # Get context for question generation
        rag_context = await self.rag.get_context_for_question(
            question=f"Generate question about {topic}",
            user_level=current_difficulty
        )

        # Generate question using specialized prompt
        prompt = PromptTemplates.nbme_question_generation(
            topic=topic,
            difficulty=DifficultyLevel(current_difficulty),
            tested_concept=f"Clinical application of {topic}",
            question_type=QuestionType.CLINICAL_VIGNETTE
        )

        # Add RAG context to prompt
        full_prompt = f"{prompt}\n\nReference material for accuracy:\n{rag_context}"

        request = LLMRequest(
            task_type="mcq_generation",
            prompt=full_prompt,
            complexity=TaskComplexity.MODERATE,
            user_id=user_profile.user_id,
            session_id=session.session_id,
            max_tokens=2500
        )

        response = await self.llm.call_with_fallback(request)

        # Parse question
        try:
            question_data = json.loads(response.content)
            question_data["generated_difficulty"] = current_difficulty
            question_data["topic"] = topic
            question_data["generation_cost"] = response.cost
            return question_data
        except json.JSONDecodeError:
            # Fallback: create structured question from text
            return {
                "vignette": "Error generating question",
                "question": response.content[:200],
                "options": {},
                "correct_answer": "A",
                "error": True
            }

    async def process_answer(
        self,
        session: LearningSession,
        user_profile: UserProfile,
        question: Dict[str, Any],
        user_answer: str,
        time_spent: float
    ) -> Dict[str, Any]:
        """Process user's answer and provide feedback"""

        is_correct = user_answer == question["correct_answer"]

        # Record question performance
        question_record = {
            "question_id": len(session.questions_this_session),
            "topic": question.get("topic", session.current_topic),
            "difficulty": question.get("generated_difficulty", session.current_difficulty),
            "user_answer": user_answer,
            "correct_answer": question["correct_answer"],
            "is_correct": is_correct,
            "time_spent": time_spent,
            "timestamp": datetime.now().isoformat()
        }

        session.questions_this_session.append(question_record)
        user_profile.total_questions_answered += 1
        if is_correct:
            user_profile.correct_answers += 1

        # Generate detailed feedback
        feedback = await self._generate_feedback(
            question=question,
            user_answer=user_answer,
            is_correct=is_correct,
            user_profile=user_profile
        )

        # Update error patterns if incorrect
        if not is_correct:
            await self._update_error_patterns(
                user_profile=user_profile,
                question=question,
                user_answer=user_answer
            )

        # Check if difficulty adjustment needed
        should_adjust, new_difficulty = self._should_adjust_difficulty(
            session,
            user_profile
        )

        if should_adjust:
            session.current_difficulty = new_difficulty

        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "explanations": question.get("explanations", {}),
            "difficulty_adjusted": should_adjust,
            "new_difficulty": new_difficulty if should_adjust else session.current_difficulty,
            "performance_summary": self._get_session_performance(session)
        }

    def _calculate_adaptive_difficulty(
        self,
        session: LearningSession,
        user_profile: UserProfile
    ) -> int:
        """Calculate appropriate difficulty for next question"""

        if len(session.questions_this_session) < 3:
            # Use user's profile level initially
            return user_profile.level

        # Analyze recent performance
        recent_questions = session.questions_this_session[-self.difficulty_window:]
        recent_correct = sum(1 for q in recent_questions if q["is_correct"])
        recent_accuracy = recent_correct / len(recent_questions)

        current_difficulty = session.current_difficulty

        # Adjust based on performance
        if recent_accuracy > 0.85:
            # Performing well, increase difficulty
            return min(5, current_difficulty + 1)
        elif recent_accuracy < 0.60:
            # Struggling, decrease difficulty
            return max(1, current_difficulty - 1)
        else:
            # Optimal range, maintain difficulty
            return current_difficulty

    def _should_adjust_difficulty(
        self,
        session: LearningSession,
        user_profile: UserProfile
    ) -> tuple[bool, int]:
        """Determine if difficulty should be adjusted"""

        if len(session.questions_this_session) < self.difficulty_window:
            return False, session.current_difficulty

        recent_questions = session.questions_this_session[-self.difficulty_window:]
        recent_correct = sum(1 for q in recent_questions if q["is_correct"])
        recent_accuracy = recent_correct / len(recent_questions)

        new_difficulty = session.current_difficulty

        # Check for adjustment triggers
        if recent_accuracy > 0.85:
            new_difficulty = min(5, session.current_difficulty + 1)
        elif recent_accuracy < 0.60:
            new_difficulty = max(1, session.current_difficulty - 1)

        # Check consecutive errors
        consecutive_wrong = 0
        for q in reversed(session.questions_this_session):
            if not q["is_correct"]:
                consecutive_wrong += 1
            else:
                break

        if consecutive_wrong >= self.max_consecutive_wrong:
            new_difficulty = max(1, session.current_difficulty - 1)

        should_adjust = new_difficulty != session.current_difficulty

        return should_adjust, new_difficulty

    async def _generate_feedback(
        self,
        question: Dict[str, Any],
        user_answer: str,
        is_correct: bool,
        user_profile: UserProfile
    ) -> str:
        """Generate personalized feedback"""

        if is_correct:
            feedback = f"✓ Correct! {question['explanations']['correct_answer']['why_correct']}\n\n"
            feedback += "Key takeaways:\n"
            for pearl in question['explanations']['correct_answer'].get('clinical_pearls', []):
                feedback += f"• {pearl}\n"
        else:
            correct_answer = question['correct_answer']
            feedback = f"✗ Incorrect. You selected {user_answer}, but the correct answer is {correct_answer}.\n\n"
            feedback += f"Why you were wrong:\n{question['explanations']['distractors'].get(user_answer, 'Explanation unavailable')}\n\n"
            feedback += f"Why {correct_answer} is correct:\n{question['explanations']['correct_answer']['why_correct']}\n"

        return feedback

    async def _update_error_patterns(
        self,
        user_profile: UserProfile,
        question: Dict[str, Any],
        user_answer: str
    ):
        """Analyze and update user's error patterns"""

        error_pattern = {
            "topic": question.get("topic"),
            "difficulty": question.get("generated_difficulty"),
            "user_answer": user_answer,
            "correct_answer": question["correct_answer"],
            "concepts_tested": question.get("concepts_tested", []),
            "timestamp": datetime.now().isoformat()
        }

        user_profile.error_patterns.append(error_pattern)

        # Keep only recent errors (last 50)
        if len(user_profile.error_patterns) > 50:
            user_profile.error_patterns = user_profile.error_patterns[-50:]

        # Update weaknesses
        topic = question.get("topic")
        if topic and topic not in user_profile.weaknesses:
            # Check if this is a consistent weakness
            topic_errors = sum(
                1 for err in user_profile.error_patterns[-10:]
                if err["topic"] == topic
            )
            if topic_errors >= 3:
                user_profile.weaknesses.append(topic)

    def _get_session_performance(self, session: LearningSession) -> Dict[str, Any]:
        """Get current session performance metrics"""

        if not session.questions_this_session:
            return {"questions_answered": 0}

        correct = sum(1 for q in session.questions_this_session if q["is_correct"])
        total = len(session.questions_this_session)
        avg_time = sum(q["time_spent"] for q in session.questions_this_session) / total

        return {
            "questions_answered": total,
            "correct": correct,
            "accuracy": correct / total,
            "average_time": avg_time,
            "current_difficulty": session.current_difficulty,
            "topics_covered": list(set(q["topic"] for q in session.questions_this_session))
        }

    async def analyze_session(
        self,
        session: LearningSession,
        user_profile: UserProfile
    ) -> Dict[str, Any]:
        """Comprehensive session analysis"""

        if not session.questions_this_session:
            return {"error": "No questions answered in session"}

        # Prepare question history for analysis
        prompt = PromptTemplates.performance_analysis(
            question_history=session.questions_this_session,
            user_id=user_profile.user_id
        )

        request = LLMRequest(
            task_type="performance_analysis",
            prompt=prompt,
            complexity=TaskComplexity.COMPLEX,
            user_id=user_profile.user_id,
            session_id=session.session_id
        )

        response = await self.llm.call_with_fallback(request)

        try:
            analysis = json.loads(response.content)
            analysis["session_metadata"] = {
                "duration": (datetime.now() - session.start_time).total_seconds() / 60,
                "questions_answered": len(session.questions_this_session),
                "concepts_covered": session.concepts_covered,
                "analysis_cost": response.cost
            }
            return analysis
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse analysis",
                "raw_response": response.content
            }

    async def generate_study_plan(
        self,
        user_profile: UserProfile,
        timeframe_days: int = 7
    ) -> Dict[str, Any]:
        """Generate personalized study plan"""

        prompt = PromptTemplates.learning_path_generation(
            user_profile={
                "completed_topics": user_profile.completed_topics,
                "strengths": user_profile.strengths,
                "weaknesses": user_profile.weaknesses,
                "level": user_profile.level,
                "learning_style": user_profile.learning_style.value,
                "study_hours_per_day": user_profile.study_hours_per_day
            },
            time_available=timeframe_days
        )

        request = LLMRequest(
            task_type="learning_path_generation",
            prompt=prompt,
            complexity=TaskComplexity.COMPLEX,
            user_id=user_profile.user_id,
            max_tokens=4000
        )

        response = await self.llm.call_with_fallback(request)

        try:
            return json.loads(response.content)
        except json.JSONDecodeError:
            return {
                "error": "Failed to generate plan",
                "raw_response": response.content
            }


# Example usage
async def main():
    """Example usage of the learning engine"""

    # Initialize components (you'll need to configure these)
    from llm_integration import LLMOrchestrator
    from rag_pipeline import RAGRetriever

    config = {
        "ANTHROPIC_API_KEY": "your-key",
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
    }

    llm = LLMOrchestrator(config)
    rag = RAGRetriever({"url": "localhost", "port": 6333})

    engine = AdaptiveLearningEngine(llm, rag, {})

    # Create user profile
    user = UserProfile(
        user_id="user123",
        level=3,
        learning_style=LearningStyle.CLINICAL,
        weaknesses=["Cardiology", "Pharmacology"],
        target_exam_date=datetime.now() + timedelta(days=90)
    )

    # Start session
    session = await engine.start_session(user, focus_topics=["Cardiology"])

    # Teach a concept
    teaching = await engine.teach_concept(
        session, user, "Myocardial infarction pathophysiology"
    )
    print("Teaching:", teaching[:200])

    # Generate practice question
    question = await engine.generate_question(session, user)
    print("\nQuestion:", question.get("question"))

    # Simulate answer
    result = await engine.process_answer(
        session, user, question, "C", time_spent=75.0
    )
    print("\nFeedback:", result["feedback"][:200])

    # Session analysis
    analysis = await engine.analyze_session(session, user)
    print("\nSession Analysis:", analysis.get("overall_performance"))


if __name__ == "__main__":
    asyncio.run(main())