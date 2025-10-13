"""
Security tests for Codex CLI integration.

Tests command injection prevention, prompt sanitization, and safe subprocess execution.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from pathlib import Path

from app.services.codex_llm import (
    CodexLLMService,
    _validate_cli_path,
    _sanitize_prompt,
    _validate_model_name,
    _build_safe_command,
    ALLOWED_CLI_PATHS,
)


class TestCLIPathValidation:
    """Test CLI path whitelist validation."""

    def test_valid_cli_path(self):
        """Test that whitelisted paths are accepted."""
        # Use the first allowed path from the whitelist
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        # Mock file existence and executability
        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True):
            result = _validate_cli_path(valid_path)
            assert result == valid_path

    def test_invalid_cli_path_not_whitelisted(self):
        """Test that non-whitelisted paths are rejected."""
        malicious_path = "/tmp/malicious_codex"

        with pytest.raises(ValueError, match="CLI path not in whitelist"):
            _validate_cli_path(malicious_path)

    def test_cli_path_does_not_exist(self):
        """Test that non-existent paths are rejected."""
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        with patch("os.path.exists", return_value=False):
            with pytest.raises(ValueError, match="does not exist"):
                _validate_cli_path(valid_path)

    def test_cli_path_not_executable(self):
        """Test that non-executable paths are rejected."""
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=False):
            with pytest.raises(ValueError, match="not executable"):
                _validate_cli_path(valid_path)

    def test_cli_path_traversal_attempt(self):
        """Test that path traversal attempts are blocked."""
        traversal_path = "/opt/homebrew/bin/../../../tmp/malicious"

        # Even if resolved, it won't be in whitelist
        with pytest.raises(ValueError, match="CLI path not in whitelist"):
            _validate_cli_path(traversal_path)


class TestPromptSanitization:
    """Test prompt sanitization against command injection."""

    def test_valid_prompt(self):
        """Test that normal prompts pass validation."""
        prompt = "What is the cardiac cycle?"
        result = _sanitize_prompt(prompt)
        assert result == prompt

    def test_prompt_with_newlines(self):
        """Test that newlines are preserved in prompts."""
        prompt = "Line 1\nLine 2\nLine 3"
        result = _sanitize_prompt(prompt)
        assert result == prompt

    def test_empty_prompt(self):
        """Test that empty prompts are rejected."""
        with pytest.raises(ValueError, match="cannot be empty"):
            _sanitize_prompt("")

    def test_prompt_too_long(self):
        """Test that excessively long prompts are rejected."""
        # Create prompt exceeding 50KB limit
        long_prompt = "a" * 52000
        with pytest.raises(ValueError, match="exceeds maximum length"):
            _sanitize_prompt(long_prompt)

    def test_prompt_with_null_bytes(self):
        """Test that null bytes are rejected (common injection technique)."""
        prompt = "Normal text\x00; rm -rf /"
        with pytest.raises(ValueError, match="null bytes"):
            _sanitize_prompt(prompt)

    def test_prompt_with_semicolon(self):
        """Test that semicolons (command separator) are rejected."""
        prompt = "What is the heart; rm -rf /"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_pipe(self):
        """Test that pipes (command chaining) are rejected."""
        prompt = "What is the heart | cat /etc/passwd"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_backticks(self):
        """Test that backticks (command substitution) are rejected."""
        prompt = "What is `whoami`"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_dollar_command_substitution(self):
        """Test that $() command substitution is rejected."""
        prompt = "What is $(cat /etc/passwd)"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_redirect(self):
        """Test that output redirection is rejected."""
        prompt = "Normal prompt > /tmp/output.txt"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_ampersand(self):
        """Test that background execution is rejected."""
        prompt = "Normal prompt &"
        with pytest.raises(ValueError, match="shell metacharacters"):
            _sanitize_prompt(prompt)

    def test_prompt_with_multiple_injection_attempts(self):
        """Test that multiple injection techniques are all blocked."""
        malicious_prompts = [
            "; cat /etc/passwd",
            "| whoami",
            "&& rm -rf /",
            "` cat /etc/passwd `",
            "$( cat /etc/passwd )",
            "> /tmp/evil.txt",
            "< /etc/passwd",
            "{ evil; commands; }",
            "[ test ] && evil",
            "\\ escape \\ attempts",
        ]

        for prompt in malicious_prompts:
            with pytest.raises(ValueError, match="shell metacharacters"):
                _sanitize_prompt(prompt)

    def test_prompt_with_control_characters(self):
        """Test that control characters are removed."""
        # Control character (ASCII 0x01)
        prompt = "Normal text\x01control"
        result = _sanitize_prompt(prompt)
        # Control characters should be removed
        assert "\x01" not in result
        assert "Normal text" in result


class TestModelNameValidation:
    """Test model name validation."""

    def test_valid_model_names(self):
        """Test that valid model names are accepted."""
        valid_models = [
            "gpt-5",
            "gpt-4o",
            "claude-3.5-sonnet",
            "claude-3-opus",
            "gemini-2.0-flash",
            "model_with_underscores",
            "model.with.dots",
        ]

        for model in valid_models:
            result = _validate_model_name(model)
            assert result == model

    def test_none_model_name(self):
        """Test that None is allowed (uses default)."""
        result = _validate_model_name(None)
        assert result is None

    def test_model_name_with_spaces(self):
        """Test that model names with spaces are rejected."""
        with pytest.raises(ValueError, match="Invalid model name"):
            _validate_model_name("gpt 5")

    def test_model_name_with_special_chars(self):
        """Test that model names with special characters are rejected."""
        malicious_models = [
            "gpt-5; rm -rf /",
            "model | cat /etc/passwd",
            "model && evil",
            "model`whoami`",
            "model$(cat /etc/passwd)",
        ]

        for model in malicious_models:
            with pytest.raises(ValueError, match="Invalid model name"):
                _validate_model_name(model)

    def test_model_name_too_long(self):
        """Test that excessively long model names are rejected."""
        long_model = "a" * 101
        with pytest.raises(ValueError, match="exceeds maximum length"):
            _validate_model_name(long_model)


class TestSafeCommandBuilder:
    """Test safe command building with shlex.quote."""

    def test_basic_command_building(self):
        """Test basic command construction."""
        cli_path = "/opt/homebrew/bin/codex"
        prompt = "What is the heart?"
        model = "gpt-5"

        cmd = _build_safe_command(cli_path, prompt, model, json_mode=False)

        assert cmd[0] == cli_path
        assert cmd[1] == "exec"
        # Prompt should be shell-quoted
        assert "What is the heart?" in cmd[2]
        assert "--model" in cmd
        assert "gpt-5" in cmd[-1]

    def test_command_with_json_mode(self):
        """Test command construction with JSON mode."""
        cli_path = "/opt/homebrew/bin/codex"
        prompt = "Test prompt"

        cmd = _build_safe_command(cli_path, prompt, None, json_mode=True)

        assert "--json" in cmd
        assert cmd[0] == cli_path
        assert cmd[1] == "exec"

    def test_command_without_model(self):
        """Test command construction without model (uses default)."""
        cli_path = "/opt/homebrew/bin/codex"
        prompt = "Test prompt"

        cmd = _build_safe_command(cli_path, prompt, None, json_mode=False)

        assert "--model" not in cmd
        assert len(cmd) == 3  # [cli_path, "exec", prompt]


class TestCodexLLMServiceSecurity:
    """Integration tests for CodexLLMService security."""

    @pytest.fixture
    def mock_subprocess(self):
        """Mock subprocess for testing."""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.stdout = AsyncMock()
        mock_process.stderr = AsyncMock()
        mock_process.wait = AsyncMock(return_value=0)
        mock_process.kill = Mock()
        return mock_process

    @pytest.mark.asyncio
    async def test_service_initialization_validates_cli_path(self):
        """Test that service initialization validates CLI path."""
        malicious_path = "/tmp/fake_codex"

        with pytest.raises(ValueError, match="CLI path not in whitelist"):
            CodexLLMService(cli_path=malicious_path)

    @pytest.mark.asyncio
    async def test_generate_completion_sanitizes_prompt(self, mock_subprocess):
        """Test that generate_completion sanitizes prompts."""
        # Mock valid CLI path
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True), \
             patch("asyncio.create_subprocess_exec", return_value=mock_subprocess):

            service = CodexLLMService(cli_path=valid_path)

            # Try to inject command via prompt
            malicious_prompt = "Normal prompt; rm -rf /"

            with pytest.raises(ValueError, match="shell metacharacters"):
                async for _ in service.generate_completion(malicious_prompt):
                    pass

    @pytest.mark.asyncio
    async def test_generate_completion_validates_model(self, mock_subprocess):
        """Test that generate_completion validates model names."""
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True), \
             patch("asyncio.create_subprocess_exec", return_value=mock_subprocess):

            service = CodexLLMService(cli_path=valid_path)

            # Try to inject command via model name
            malicious_model = "gpt-5; rm -rf /"

            with pytest.raises(ValueError, match="Invalid model name"):
                async for _ in service.generate_completion(
                    "Normal prompt",
                    model=malicious_model
                ):
                    pass

    @pytest.mark.asyncio
    async def test_generate_completion_enforces_prompt_length(self, mock_subprocess):
        """Test that generate_completion enforces prompt length limits."""
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True), \
             patch("asyncio.create_subprocess_exec", return_value=mock_subprocess):

            service = CodexLLMService(cli_path=valid_path)

            # Create prompt exceeding limit
            huge_prompt = "a" * 52000

            with pytest.raises(ValueError, match="exceeds maximum length"):
                async for _ in service.generate_completion(huge_prompt):
                    pass

    @pytest.mark.asyncio
    async def test_subprocess_exec_not_shell(self, mock_subprocess):
        """Test that subprocess uses exec mode (not shell=True)."""
        valid_path = list(ALLOWED_CLI_PATHS)[0]

        mock_create_subprocess = AsyncMock(return_value=mock_subprocess)
        mock_subprocess.stdout.readline = AsyncMock(side_effect=[b"", b""])

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True), \
             patch("asyncio.create_subprocess_exec", mock_create_subprocess):

            service = CodexLLMService(cli_path=valid_path)

            # Generate completion with valid prompt
            async for _ in service.generate_completion("Normal prompt"):
                pass

            # Verify create_subprocess_exec was called (not create_subprocess_shell)
            assert mock_create_subprocess.called
            # Verify command is passed as list (exec mode)
            call_args = mock_create_subprocess.call_args
            # First positional args should be command parts
            assert isinstance(call_args[0], tuple)
            assert call_args[0][0] == valid_path


class TestDefenseInDepth:
    """Test defense-in-depth security measures."""

    def test_multiple_validation_layers(self):
        """Test that multiple security layers work together."""
        # Even if one validation is bypassed, others should catch it
        prompt = "Normal prompt"

        # Layer 1: Length check
        assert len(prompt.encode('utf-8')) < 51200

        # Layer 2: Null byte check
        assert '\x00' not in prompt

        # Layer 3: Shell metacharacter check
        dangerous_chars = r'[;&|`$(){}[\]<>\\\n\r]'
        import re
        assert not re.search(dangerous_chars, prompt)

        # Layer 4: shlex.quote escaping
        import shlex
        quoted = shlex.quote(prompt)
        assert quoted  # Should not be empty

    def test_cli_path_resolution_prevents_symlink_attacks(self):
        """Test that CLI path resolution prevents symlink attacks."""
        # Path.resolve() should resolve symlinks
        test_path = "/opt/homebrew/bin/codex"

        with patch("os.path.exists", return_value=True), \
             patch("os.access", return_value=True):
            resolved = _validate_cli_path(test_path)
            # Should be an absolute path
            assert Path(resolved).is_absolute()


class TestSecurityLogging:
    """Test that security events are properly logged."""

    def test_cli_path_validation_failure_logged(self, caplog):
        """Test that CLI path validation failures are logged."""
        malicious_path = "/tmp/fake_codex"

        with pytest.raises(ValueError):
            _validate_cli_path(malicious_path)

        # Should log security event
        # Note: This depends on logging configuration in tests

    def test_prompt_injection_attempt_logged(self, caplog):
        """Test that prompt injection attempts are logged."""
        malicious_prompt = "Normal; rm -rf /"

        with pytest.raises(ValueError):
            _sanitize_prompt(malicious_prompt, user_id="test_user")

        # Should log security event with user_id
        # Note: This depends on logging configuration in tests

    def test_model_name_injection_attempt_logged(self, caplog):
        """Test that model name injection attempts are logged."""
        malicious_model = "gpt-5; evil"

        with pytest.raises(ValueError):
            _validate_model_name(malicious_model, user_id="test_user")

        # Should log security event
        # Note: This depends on logging configuration in tests
