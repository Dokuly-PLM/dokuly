import json
import logging
import requests
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status

from parts.models import PartType
from documents.models import Document_Prefix
from .models import IntegrationSettings
from .viewsIntegrations import get_user_organization

logger = logging.getLogger(__name__)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def suggest_name(request):
    try:
        if not request.user or not request.user.is_authenticated:
            return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "User organization not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        integration_settings, _ = IntegrationSettings.objects.get_or_create(
            organization=organization
        )

        if not integration_settings.ai_api_key:
            return Response(
                {"error": "AI API key not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        draft_name = data.get("draft_name", "").strip()
        entity_type = data.get("entity_type", "")
        type_id = data.get("type_id")

        if not draft_name:
            return Response(
                {"error": "draft_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if entity_type not in ("part", "document"):
            return Response(
                {"error": "entity_type must be 'part' or 'document'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Load naming convention
        naming_convention = None
        type_name = ""

        if entity_type == "part":
            try:
                pt = PartType.objects.get(id=type_id)
                naming_convention = pt.naming_convention
                type_name = pt.name or "Unknown"
            except PartType.DoesNotExist:
                return Response(
                    {"error": "Part type not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            try:
                dp = Document_Prefix.objects.get(id=type_id)
                naming_convention = dp.naming_convention
                type_name = dp.display_name or "Unknown"
            except Document_Prefix.DoesNotExist:
                return Response(
                    {"error": "Document prefix not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not naming_convention:
            return Response(
                {"error": "No naming convention configured for this type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build prompt and call Anthropic API
        system_prompt = (
            "You are a part naming assistant for a PLM system. Given a draft name and naming "
            "convention rules, suggest a corrected/completed name. Return ONLY valid JSON: "
            '{"suggestion": "...", "explanation": "..."}. The explanation should be one sentence '
            "describing what was changed and why."
        )

        user_prompt = (
            f"Type: {type_name}\n"
            f"Naming convention:\n{naming_convention}\n\n"
            f"Draft name: {draft_name}"
        )

        model = integration_settings.ai_model or "claude-sonnet-4-20250514"

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": integration_settings.ai_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 300,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            timeout=30,
        )

        if response.status_code != 200:
            logger.error(f"Anthropic API error: {response.status_code} {response.text}")
            return Response(
                {"error": "AI service returned an error"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        result = response.json()
        text = result.get("content", [{}])[0].get("text", "")

        try:
            parsed = json.loads(text)
            return Response(
                {
                    "suggestion": parsed.get("suggestion", ""),
                    "explanation": parsed.get("explanation", ""),
                },
                status=status.HTTP_200_OK,
            )
        except json.JSONDecodeError:
            return Response(
                {"suggestion": text, "explanation": ""},
                status=status.HTTP_200_OK,
            )

    except requests.RequestException as e:
        logger.error(f"AI API request failed: {e}")
        return Response(
            {"error": "Failed to connect to AI service"},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as e:
        logger.error(f"Error in suggest_name: {e}")
        return Response(
            {"error": "Failed to generate suggestion", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
