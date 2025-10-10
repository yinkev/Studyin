"""Secure file validation utilities."""
from __future__ import annotations

import hashlib
import logging
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException

from app.config import settings

try:
    import magic  # type: ignore
except ImportError as exc:  # pragma: no cover - dependency optional in tests
    raise RuntimeError(
        "python-magic is required for file validation. Install via pip."
    ) from exc

try:
    import clamd  # type: ignore
except ImportError:  # pragma: no cover - clamav optional at runtime
    clamd = None  # type: ignore


logger = logging.getLogger(__name__)
security_logger = logging.getLogger("security")


class FileValidator:
    """Multi-layer file validation service."""

    ALLOWED_MIMES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/png",
        "image/jpeg",
    }

    EXTENSION_MAP = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/plain": ".txt",
        "image/png": ".png",
        "image/jpeg": ".jpg",
    }

    EXTENSION_NORMALIZATION = {
        ".jpeg": ".jpg",
    }

    def __init__(self) -> None:
        self.mime_detector = magic.Magic(mime=True)
        self.clamav_available = False
        self._clamd_client = None

        if clamd is not None:  # pragma: no branch - simple capability check
            try:
                if settings.CLAMAV_SOCKET:
                    self._clamd_client = clamd.ClamdUnixSocket(settings.CLAMAV_SOCKET)  # type: ignore[attr-defined]
                elif settings.CLAMAV_HOST:
                    self._clamd_client = clamd.ClamdNetworkSocket(settings.CLAMAV_HOST, settings.CLAMAV_PORT)  # type: ignore[attr-defined]
                else:
                    self._clamd_client = clamd.ClamdUnixSocket()  # type: ignore[attr-defined]

                self._clamd_client.ping()
                self.clamav_available = True
                logger.info("ClamAV connection established")
            except Exception as exc:  # pragma: no cover - environment dependent
                self.clamav_available = False
                logger.warning("ClamAV unavailable: %s", exc)

    async def validate_file(self, file_content: bytes, original_filename: str | None) -> Tuple[str, str]:
        """Validate uploaded file and return (mime_type, extension)."""

        file_size = len(file_content)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(413, "File too large. Maximum allowed size exceeded.")

        if file_size == 0:
            raise HTTPException(400, "Empty file uploaded")

        try:
            actual_mime = self.mime_detector.from_buffer(file_content[:2048])
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Magic number detection failed: %s", exc)
            raise HTTPException(400, "Unable to determine file type")

        if actual_mime not in self.ALLOWED_MIMES:
            raise HTTPException(
                400,
                f"File type not allowed. Detected: {actual_mime}. Allowed: PDF, DOCX, TXT, PNG, JPEG",
            )

        safe_name = (Path(original_filename or "uploaded").name).replace("\x00", "")
        original_extension = Path(safe_name).suffix.lower()
        normalized_original_extension = self.EXTENSION_NORMALIZATION.get(
            original_extension, original_extension
        )
        expected_extension = self.EXTENSION_MAP.get(actual_mime, ".bin")
        valid_extensions = {expected_extension}
        for alias, canonical in self.EXTENSION_NORMALIZATION.items():
            if canonical == expected_extension:
                valid_extensions.add(alias)

        if normalized_original_extension and normalized_original_extension not in valid_extensions:
            security_logger.warning(
                "file_extension_mismatch",
                extra={
                    "original_extension": normalized_original_extension,
                    "expected_extension": expected_extension,
                    "mime": actual_mime,
                    "filename": safe_name,
                },
            )
            raise HTTPException(
                400,
                "File extension does not match the detected file type. Please upload a valid file.",
            )

        if self.clamav_available and self._clamd_client is not None:
            try:
                scan_result = self._clamd_client.instream(file_content)  # type: ignore[attr-defined]
            except Exception as exc:  # pragma: no cover - environment dependent
                logger.error("ClamAV scan failed: %s", exc)
            else:
                stream_result = scan_result.get("stream") if scan_result else None
                if stream_result:
                    status, virus_name = stream_result
                    if status == "FOUND":
                        logger.warning(
                            "Malware detected (%s) in file %s", virus_name, original_filename
                        )
                        security_logger.error(
                            "malware_detected",
                            extra={
                                "virus": virus_name,
                                "filename": original_filename,
                            },
                        )
                        raise HTTPException(
                            400,
                            "File failed security scan. Please contact support if this persists.",
                        )

        if actual_mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            # Basic macro detection for DOCX files – block if vba project present
            try:
                with zipfile.ZipFile(BytesIO(file_content)) as archive:
                    if any(name.endswith("vbaProject.bin") for name in archive.namelist()):
                        security_logger.warning(
                            "docx_macro_blocked",
                            extra={"filename": safe_name},
                        )
                        raise HTTPException(
                            400,
                            "Macro-enabled Word documents are not allowed. Please remove macros and try again.",
                        )
            except zipfile.BadZipFile:
                raise HTTPException(400, "Corrupted document upload.")

        checksum = hashlib.sha256(file_content).hexdigest()
        logger.debug(
            "file_validated",
            extra={
                "filename": safe_name,
                "mime": actual_mime,
                "size": file_size,
                "sha256": checksum,
            },
        )

        extension = self.EXTENSION_MAP.get(actual_mime, ".bin")
        return actual_mime, extension


file_validator = FileValidator()
