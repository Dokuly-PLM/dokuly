from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .issuesModel import Issues
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from documents.models import Document, MarkdownText
from django.db.models import Q
from typing import Type, Union, Optional, Tuple
from django.db import models
from .serializers import IssuesSerializer
from assembly_bom.models import Assembly_bom, Bom_item
from pcbas.models import Pcba
from .viewsIssues import APP_TO_MODEL, MODEL_TO_MODEL_STRING


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_bom_issues(request, object_id, app):
    try:
        # Get the bom
        bom = None
        # Only assemblies and pcba have bom
        if app == 'assemblies':
            bom = Assembly_bom.objects.get(assembly_id=object_id)
        else:
            pcba = Pcba.objects.get(id=object_id)
            bom = Assembly_bom.objects.get(pcba=pcba)
        if not bom:
            return Response("BOM not found", status=status.HTTP_404_NOT_FOUND)
        bom_issues = collect_bom_issues(bom.id, app)
        if len(bom_issues) == 0:
            return Response("No issues found", status=status.HTTP_204_NO_CONTENT)
        return Response(bom_issues, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def collect_bom_issues(bom_id, app: str):
    # Start processing with the root BOM
    root_bom = Assembly_bom.objects.get(id=bom_id)
    bom_items = Bom_item.objects.filter(bom=root_bom).prefetch_related('part', 'pcba', 'assembly')
    flat_bom = flatten_bom(bom_items)

    # Collect IDs for issue queries
    part_ids = {details['id'] for details in flat_bom.values() if details['app'] == 'parts'}
    pcba_ids = {details['id'] for details in flat_bom.values() if details['app'] == 'pcbas'}
    assembly_ids = {details['id'] for details in flat_bom.values() if details['app'] == 'assemblies'}

    # Determine the model string for the BOM item's app
    model = APP_TO_MODEL[app]
    model_string = MODEL_TO_MODEL_STRING[model]

    # Get the issues
    issue_query = Q(parts__id__in=part_ids) | Q(pcbas__id__in=pcba_ids) | Q(assemblies__id__in=assembly_ids)
    all_issues = Issues.objects.filter(issue_query).distinct().prefetch_related('parts', 'pcbas', 'assemblies', 'tags',
                                                                                'description',
                                                                                'created_by',
                                                                                'closed_by',
                                                                                f'closed_in_{model_string}')
    # Serialize all issues at once, avoids any N+1 query issues
    serialized_issues = IssuesSerializer(all_issues, many=True).data

    # Create a dictionary to map from BOM item IDs to serialized issue data
    issue_map = {}
    for issue in serialized_issues:
        for part_id in issue['parts']:
            if part_id not in issue_map:
                issue_map[part_id] = []
            if 'part' in flat_bom.get(part_id, {}).get('app', ''):
                issue_map[part_id].append(issue)

        for pcba_id in issue['pcbas']:
            if pcba_id not in issue_map:
                issue_map[pcba_id] = []
            if 'pcba' in flat_bom.get(pcba_id, {}).get('app', ''):
                issue_map[pcba_id].append(issue)

        for assembly_id in issue['assemblies']:
            if assembly_id not in issue_map:
                issue_map[assembly_id] = []
            if 'assemblies' in flat_bom.get(assembly_id, {}).get('app', ''):
                issue_map[assembly_id].append(issue)

    # Enrich issues with related BOM item details
    enriched_issues = []
    for item_id, details in flat_bom.items():
        if item_id in issue_map:
            for issue in issue_map[item_id]:
                issue_data = issue.copy()  # Work with a copy to avoid mutating the original serialized data
                issue_data['related_bom_item'] = details
                enriched_issues.append(issue_data)

    return enriched_issues


def flatten_bom(bom_items, flat_bom=None, visited=None):
    if visited is None:
        visited = set()
    if flat_bom is None:
        flat_bom = {}

    for item in bom_items:
        # Skip items already processed to avoid infinite loops
        if item.id in visited:
            continue
        visited.add(item.id)

        app_type = None
        item_id = None
        revision = ''
        full_part_number = ''

        # Determine the type of item and its details
        if item.part:
            app_type = 'parts'
            item_id = item.part.id
            revision = item.part.revision
            full_part_number = item.part.full_part_number
            thumbnail = item.part.thumbnail.id if item.part.thumbnail else None
            display_name = item.part.display_name if hasattr(item.part, 'display_name') else None
        elif item.pcba:
            app_type = 'pcbas'
            item_id = item.pcba.id
            revision = item.pcba.revision
            full_part_number = item.pcba.full_part_number
            thumbnail = item.pcba.thumbnail.id if item.pcba.thumbnail else None
            display_name = item.pcba.display_name if hasattr(item.pcba, 'display_name') else None
            # Recurse to include items from this pcba's bom, if any
            child_bom = Assembly_bom.objects.filter(pcba=item.pcba).first()
            if child_bom:
                child_items = Bom_item.objects.filter(bom=child_bom).select_related('part', 'pcba', 'assembly')
                flatten_bom(child_items, flat_bom, visited)
        elif item.assembly:
            app_type = 'assemblies'
            item_id = item.assembly.id
            revision = item.assembly.revision
            full_part_number = item.assembly.full_part_number
            thumbnail = item.assembly.thumbnail.id if item.assembly.thumbnail else None
            display_name = item.assembly.display_name if hasattr(item.assembly, 'display_name') else None
            # Recurse to include items from this assembly's bom, if any
            child_bom = Assembly_bom.objects.filter(assembly_id=item.assembly.id).first()
            if child_bom:
                child_items = Bom_item.objects.filter(bom=child_bom).select_related('part', 'pcba', 'assembly')
                flatten_bom(child_items, flat_bom, visited)

        # Add details to the flat bom dictionary
        if app_type:
            flat_bom[item_id] = {
                'app': app_type,
                'id': item_id,
                'revision': revision,
                'full_part_number': full_part_number,
                'thumbnail': thumbnail,
                'display_name': display_name
            }

    return flat_bom