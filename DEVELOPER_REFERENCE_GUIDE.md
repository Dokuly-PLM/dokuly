# Dokuly PLM System - Developer Reference Guide

## Overview

Dokuly is an open-source Product Lifecycle Management (PLM) system built with Django (backend) and React (frontend). It's designed for teams that need to manage product data, documents, projects, and manufacturing processes.

## Quick Reference - Docker Commands

### **Essential Commands**
```bash
# Check container status
docker-compose -f docker-compose-dev-mac.yml ps

# Django shell with command execution
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
print('PCBAs:', Pcba.objects.count())
"

# Database migrations
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py migrate

# Run tests
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test

# View logs
docker-compose -f docker-compose-dev-mac.yml logs web
```

### **File Paths in Docker**
- **Manage.py**: `/dokuly_image/dokuly/manage.py`
- **Project root**: `/dokuly_image/`
- **Django app**: `/dokuly_image/dokuly/`

### **Docker Compose File Selection**
- **Mac Development**: `docker-compose-dev-mac.yml` (used in examples above)
- **Linux/Windows Development**: `docker-compose-dev.yml`
- **Production**: `docker-compose.yml`

## System Architecture

### Backend (Django)
- **Framework**: Django 4.2.11 with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: Django Knox + Custom email authentication
- **File Storage**: Azure Blob Storage (production) / Local storage (development)
- **API**: RESTful API with project-based access control

### Frontend (React)
- **Framework**: React 18.2.0
- **Build Tool**: Vite
- **Package manager / runtime**: Bun
- **UI Components**: React Bootstrap, custom components
- **State Management**: React hooks and context
- **Routing**: React Router v6

## Core Django Apps

### 1. **accounts** - User Authentication
- **Purpose**: User management and authentication
- **Key Models**: Extends Django's User model
- **Features**: Email authentication, password reset, user registration

### 2. **profiles** - User Profiles
- **Purpose**: Extended user information and permissions
- **Key Models**: 
  - `Profile`: Extended user data with roles and permissions
  - `Notification`: User notifications system
- **Features**: Role-based access control, 2FA, notification settings

### 3. **organizations** - Multi-tenancy
- **Purpose**: Organization management and subscriptions
- **Key Models**:
  - `Organization`: Customer organizations
  - `Subscription`: Billing and subscription management
  - `OrganizationAPIKey`: API key management with project-based access
- **Features**: Multi-tenant architecture, subscription management, API key control

### 4. **projects** - Project Management
- **Purpose**: Project organization and access control
- **Key Models**:
  - `Project`: Main project entity
  - `Task`: Project tasks with Gantt support
  - `Tag`: Categorization system
  - `Gantt`: Project planning
- **Features**: Project-based access control, task management, Gantt charts, issue tracking

### 5. **parts** - Part Management
- **Purpose**: Individual components
- **Key Models**:
  - `Part`: Individual parts/components
  - `PartType`: Custom part types
- **Features**: Part numbering, revision control, specifications, alternative parts, inventory tracking

### 6. **assemblies** - Assembly Management
- **Purpose**: Assembled products and sub-assemblies
- **Key Models**:
  - `Assembly`: Assembled products
- **Features**: Assembly management, revision control, BOM integration

### 7. **pcbas** - PCB Assembly Management
- **Purpose**: Printed Circuit Board Assemblies
- **Key Models**:
  - `Pcba`: PCB Assembly entities
- **Features**: Gerber file management, PCB layer visualization, manufacturing documentation

### 8. **assembly_bom** - Bill of Materials
- **Purpose**: BOM management for assemblies and PCBAs
- **Key Models**:
  - `Assembly_bom`: BOM collections
  - `Bom_item`: Individual BOM items
- **Features**: Multi-level BOMs, quantity tracking, designator management

#### BOM Structure and Relationships
```
Assembly/Pcba (1) ──→ (N) Assembly_bom (1) ──→ (N) Bom_item
                                                      │
                                                      ├──→ Part
                                                      ├──→ Assembly  
                                                      └──→ Pcba
```

**BOM Item Properties:**
- `designator`: Reference designator (e.g., "R1", "C5", "U3")
- `quantity`: Number of items needed
- `is_mounted`: Whether component is mounted (DNM - Do Not Mount)
- `comment`: Additional notes for the BOM item
- `temporary_mpn/manufacturer`: For imported BOMs before part matching

**BOM Attachment:**
- Assemblies and PCBAs can have multiple BOM variants
- Each BOM variant contains multiple BOM items
- BOM items can reference Parts, Assemblies, or PCBAs
- Supports multi-level BOMs (assemblies containing other assemblies)

### 9. **documents** - Document Management
- **Purpose**: Document storage and management
- **Key Models**:
  - `Document`: Document entities
  - `MarkdownText`: Markdown content storage
  - `Document_Prefix`: Document type definitions
  - `Reference_List`: Document reference management
- **Features**: Document numbering, PDF generation, markdown support, revision control

#### Document Attachment System
Documents can be attached to multiple entity types through various mechanisms:

**File Attachments:**
- Parts, Assemblies, PCBAs: `files` ManyToManyField to File model
- Documents: Direct file fields (`document_file`, `pdf`, `zip_file`)

**Markdown Notes:**
- Parts, Assemblies, PCBAs: `markdown_notes` ForeignKey to MarkdownText
- Multiple markdown tabs: `markdown_note_tabs` ManyToManyField to MarkdownText

**Reference Documents:**
- All entities have `reference_list_id` for document references
- `Reference_List` model manages document references with specification flags
- Documents can reference other documents via `referenced_documents` ManyToManyField

### 10. **customers** - Customer Management
- **Purpose**: Customer relationship management
- **Key Models**:
  - `Customer`: Customer entities
- **Features**: Customer information, project associations

### 11. **inventory** - Inventory Management
- **Purpose**: Stock and location management
- **Key Models**:
  - `Inventory`: Stock transaction log
  - `Location`: Physical storage locations
  - `LocationTypes`: Location type definitions
- **Features**: Stock tracking, location management, transaction logging

### 12. **production** - Production Management
- **Purpose**: Manufacturing and production tracking
- **Key Models**: Production lots and tracking
- **Features**: Production tracking, lot management

### 13. **purchasing** - Procurement
- **Purpose**: Purchase order and supplier management
- **Features**: PO generation, supplier management, cost tracking

### 14. **requirements** - Requirements Management
- **Purpose**: Requirements tracking and management
- **Features**: Hierarchical requirements, traceability

### 15. **timetracking** - Time Management
- **Purpose**: Time tracking and reporting
- **Features**: Time logging, project-based time tracking

## Issues and Notes System

### Issues Management
Issues are tracked through the `projects.issuesModel.Issues` model and can be attached to any entity:

**Issue Attachment:**
- Issues are linked to objects via `object_id` and `app` fields
- Supported apps: "Pcba", "Assemblies", "Part", "Document", "Project"
- Issues can be created, updated, closed, and reopened
- Project owners receive notifications on issue creation/closure

**Issue Properties:**
- `object_id`: ID of the related entity (Part, Assembly, PCBA, Document, Project)
- `app`: Type of entity the issue is attached to
- `status`: Open/Closed state
- `priority`: Issue priority level
- `description`: Detailed issue description
- `created_by`: User who created the issue
- `assigned_to`: User assigned to resolve the issue

**Issue Workflow:**
1. Create issue: `POST /api/issues/`
2. Get issues for object: `GET /api/issues/<object_id>/<app>/`
3. Update issue: `PUT /api/issues/<issue_id>/`
4. Close issue: `POST /api/issues/close/<issue_id>/`
5. Reopen issue: `POST /api/issues/reopen/<issue_id>/`

### Notes and Documentation System

#### Markdown Notes
All main entities (Parts, Assemblies, PCBAs) support markdown notes:

**Single Markdown Note:**
- `markdown_notes`: ForeignKey to `MarkdownText` model
- Used for primary documentation/notes

**Multiple Markdown Tabs:**
- `markdown_note_tabs`: ManyToManyField to `MarkdownText` model
- Allows multiple organized note sections
- Each tab has a `title` and `text` field

**MarkdownText Model:**
```python
class MarkdownText(models.Model):
    text = models.TextField(blank=True, null=True, default="")
    title = models.CharField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

#### Revision Notes and Errata
Each entity type supports revision documentation:

**Revision Notes:**
- `revision_notes`: TextField for documenting changes between revisions
- Used in revision tables and change documentation
- Supports markdown formatting

**Errata:**
- `errata`: TextField for documenting errors and corrections
- Used to track known issues and fixes
- Supports markdown formatting

#### File Attachments
Files can be attached to entities through the File model:

**File Attachment Methods:**
1. **ManyToManyField**: Parts, Assemblies, PCBAs use `files` ManyToManyField
2. **Direct File Fields**: Documents use direct file fields (`document_file`, `pdf`, `zip_file`)
3. **Specialized Fields**: PCBAs have specialized file fields (`gerber_file`, `assembly_pdf`, `manufacture_pdf`)

**File Management:**
- Files are stored in Azure Blob Storage (production) or local storage (development)
- Files can be archived (soft deleted) by setting `archived` field
- File associations are managed through the File model relationships

## Database Schema Relationships

### Core Entity Relationships
```
Organization (1) ──→ (N) Profile
Organization (1) ──→ (N) Project
Project (1) ──→ (N) Part
Project (1) ──→ (N) Assembly
Project (1) ──→ (N) Pcba
Project (1) ──→ (N) Document
```

### Product Hierarchy
```
Part (1) ──→ (N) Bom_item
Assembly (1) ──→ (N) Bom_item
Pcba (1) ──→ (N) Bom_item
Assembly_bom (1) ──→ (N) Bom_item
```

### File Management
```
Part ──→ (M2M) File
Assembly ──→ (M2M) File
Pcba ──→ (M2M) File
Document ──→ File
```

### Access Control
- **Project-based**: All main entities (Parts, Assemblies, PCBAs, Documents) are linked to Projects
- **Role-based**: User roles (Viewer, User, Admin, Owner) control access levels
- **API Keys**: Project-specific API access with expiration dates

## External API Documentation

### API Structure Overview

The Dokuly system provides a comprehensive REST API (v1) for external integrations and programmatic access.

#### **API Authentication**
- **Token-based**: Django Knox tokens (96-hour TTL)
- **API Keys**: Organization-specific with project restrictions
- **Email Authentication**: Custom backend for email-based login
- **Project-based Access Control**: API keys can be scoped to specific projects

#### **API Base URL**
```
Production: https://your-domain.com/api/v1/
Development: http://localhost:8000/api/v1/
```

### API v1 Endpoints

#### **Parts API**
```bash
# GET - List all parts (latest revisions)
GET /api/v1/parts/

# GET - Get single part by ID
GET /api/v1/parts/<int:pk>/

# POST - Create new part
POST /api/v1/parts/new/

# POST - Create new revision
POST /api/v1/parts/revision/<int:pk>/

# PUT - Update part
PUT /api/v1/parts/update/<int:pk>/

# PUT - Archive part
PUT /api/v1/parts/archive/<int:pk>/

# POST - Upload file to part
POST /api/v1/parts/upload/<int:part_id>/

# GET - Download all files from part as ZIP
GET /api/v1/parts/<int:part_id>/files/

# POST - Upload image to part
POST /api/v1/parts/image/<int:part_id>/
```

#### **Assemblies API**
```bash
# GET - List all assemblies (latest revisions)
GET /api/v1/assemblies/

# GET - Get single assembly by ID
GET /api/v1/assemblies/<int:pk>/

# POST - Create new assembly
POST /api/v1/assemblies/new/

# POST - Create new revision
POST /api/v1/assemblies/revision/<int:pk>/

# PUT - Update assembly
PUT /api/v1/assemblies/update/<int:pk>/

# PUT - Archive assembly
PUT /api/v1/assemblies/archive/<int:pk>/

# POST - Upload file to assembly
POST /api/v1/assemblies/upload/<int:assembly_id>/

# GET - Download all files from assembly as ZIP
GET /api/v1/assemblies/<int:assembly_id>/files/

# POST - Upload BOM CSV file to assembly
POST /api/v1/assemblies/bom/<int:assembly_id>/

# POST - Upload image to assembly
POST /api/v1/assemblies/image/<int:assembly_id>/
```

#### **PCBAs API**
```bash
# GET - List all PCBAs (latest revisions)
GET /api/v1/pcbas/

# GET - Get single PCBA by ID
GET /api/v1/pcbas/<int:pk>/

# POST - Create new PCBA
POST /api/v1/pcbas/new/

# POST - Create new revision
POST /api/v1/pcbas/revision/<int:pk>/

# PUT - Update PCBA
PUT /api/v1/pcbas/update/<int:pk>/

# PUT - Archive PCBA
PUT /api/v1/pcbas/archive/<int:pk>/

# POST - Upload file to PCBA
POST /api/v1/pcbas/upload/<int:pcba_id>/

# POST - Upload BOM CSV file to PCBA
POST /api/v1/pcbas/bom/<int:pcba_id>/

# GET - Download all files from PCBA as ZIP
GET /api/v1/pcbas/<int:pcba_id>/files/

# POST - Upload image to PCBA
POST /api/v1/pcbas/image/<int:pcba_id>/
```

#### **Projects API**
```bash
# GET - List all projects
GET /api/v1/projects/

# GET - Get single project by ID
GET /api/v1/projects/<int:pk>/

# POST - Create new project
POST /api/v1/projects/new/

# PUT - Update project
PUT /api/v1/projects/update/<int:pk>/
```

#### **Documents API**
```bash
# GET - List all documents
GET /api/v1/documents/

# GET - Get single document by ID
GET /api/v1/documents/<int:pk>/

# POST - Create new document
POST /api/v1/documents/new/

# POST - Create new revision
POST /api/v1/documents/revision/<int:pk>/

# PUT - Update document
PUT /api/v1/documents/update/<int:pk>/

# PUT - Archive document
PUT /api/v1/documents/archive/<int:pk>/
```

#### **Customers API**
```bash
# GET - List all customers
GET /api/v1/customers/

# GET - Get single customer by ID
GET /api/v1/customers/<int:pk>/

# POST - Create new customer
POST /api/v1/customers/new/

# PUT - Update customer
PUT /api/v1/customers/update/<int:pk>/
```

### API Request/Response Format

#### **Standard Request Headers**
```bash
Authorization: Token <your-token>
Content-Type: application/json
X-API-Key: <your-api-key>  # Optional, for API key authentication
```

#### **Standard Response Format**
```json
{
  "id": 123,
  "display_name": "Example Part",
  "part_number": 1001,
  "full_part_number": "PRT1001",
  "revision": "1-0",
  "is_latest_revision": true,
  "project": {
    "id": 45,
    "title": "Example Project"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_updated": "2024-01-15T10:30:00Z",
  "created_by": {
    "id": 1,
    "username": "user@example.com"
  }
}
```

#### **Error Response Format**
```json
{
  "error": "Validation failed",
  "details": {
    "field_name": ["This field is required."]
  },
  "status_code": 400
}
```

### API Development Guidelines

#### **Adding New API Endpoints**

When adding new features that need API access:

1. **Create API Views**: Add to `api.py` files in respective apps
2. **Add URL Patterns**: Update `urls_*.py` files in `API/v1/`
3. **Implement Permissions**: Use `@permission_classes([IsAuthenticated | APIAndProjectAccess])`
4. **Add Serializers**: Create serializers for API responses
5. **Update Documentation**: Add endpoints to this guide

#### **API Requirements Checklist**
- ✅ **GET by ID**: Retrieve single entity
- ✅ **GET all**: List entities (with filtering)
- ✅ **POST**: Create new entity
- ✅ **PUT by ID**: Update entity
- ✅ **ARCHIVE (PUT) by ID**: Soft delete entity
- ✅ **File Upload**: Handle file attachments
- ✅ **Authentication**: Token or API key based
- ✅ **Project Access Control**: Filter by user's projects

#### **API Versioning Strategy**

**Current Version**: v1
- **Base URL**: `/api/v1/`
- **Backward Compatibility**: Maintained for 12 months
- **New Features**: Added to v1 with proper documentation
- **Breaking Changes**: New version (v2) required

#### **API Documentation Maintenance**

**When Adding New Features:**
1. **Update API Endpoints**: Add new endpoints to this guide
2. **Update Request/Response Examples**: Include new fields
3. **Update Authentication**: Document new permission requirements
4. **Update Error Codes**: Add new error scenarios
5. **Test API Endpoints**: Ensure all endpoints work correctly

**When Modifying Existing Features:**
1. **Version Control**: Consider if changes are backward compatible
2. **Update Documentation**: Reflect changes in this guide
3. **Deprecation Notice**: Give advance notice for breaking changes
4. **Migration Guide**: Provide upgrade path for API consumers

#### **API Testing**

**Manual Testing:**
```bash
# Test authentication
curl -H "Authorization: Token <token>" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/v1/parts/

# Test creation
curl -X POST \
     -H "Authorization: Token <token>" \
     -H "Content-Type: application/json" \
     -d '{"display_name": "Test Part", "project": 1}' \
     https://your-domain.com/api/v1/parts/new/
```

**Automated Testing:**
```bash
# Run all tests
docker-compose exec web python manage.py test

# Run specific app tests
docker-compose exec web python manage.py test parts

# Run specific test file
docker-compose exec web python manage.py test parts.tests

# Run specific test method
docker-compose exec web python manage.py test parts.tests.PartTestCase.test_api_part_creation

# Run tests with verbose output
docker-compose exec web python manage.py test --verbosity=2

# Run tests with coverage
docker-compose exec web python manage.py test --coverage
```

### API Integration Examples

#### **Python Integration**
```python
import requests

class DokulyAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
    
    def get_parts(self):
        response = requests.get(f'{self.base_url}/api/v1/parts/', headers=self.headers)
        return response.json()
    
    def create_part(self, data):
        response = requests.post(f'{self.base_url}/api/v1/parts/new/', 
                               json=data, headers=self.headers)
        return response.json()
```

#### **JavaScript Integration**
```javascript
class DokulyAPI {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    async getParts() {
        const response = await fetch(`${this.baseUrl}/api/v1/parts/`, {
            headers: this.headers
        });
        return response.json();
    }
    
    async createPart(data) {
        const response = await fetch(`${this.baseUrl}/api/v1/parts/new/`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        return response.json();
    }
}
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── App.js                    # Main application component
│   ├── accounts/                 # Authentication components
│   ├── admin/                    # Admin interface
│   ├── assemblies/               # Assembly management
│   ├── common/                   # Shared components
│   │   ├── bom/                  # BOM management
│   │   ├── dokuly_components/    # Custom UI components
│   │   └── hooks/                # Custom React hooks
│   ├── documents/                # Document management
│   ├── layout/                   # Layout components
│   ├── parts/                    # Part management
│   ├── pcbas/                    # PCBA management
│   ├── projects/                 # Project management
│   └── purchasing/               # Procurement interface
```

### Key Frontend Features
- **Responsive Design**: Bootstrap-based responsive layout
- **Component Library**: Custom `dokuly_components` for consistent UI
- **File Management**: Drag-and-drop file uploads, PDF viewers
- **Data Tables**: Advanced table components with sorting/filtering
- **Forms**: Comprehensive form components with validation
- **Visualization**: Charts, Gantt charts, 3D model viewers

## Dokuly Color Scheme

The Dokuly system uses a consistent color palette throughout the application. This color scheme should be used when creating new components or modifying existing ones.

### Primary Color Palette

#### **Main Brand Colors**
```css
/* Primary Green - Main brand color */
--dokuly-primary: #165216ff;
--dokuly-primary-hover: #104610ff;
--dokuly-primary-active: #0e3a0eff;

/* Secondary Colors */
--dokuly-secondary: #108e82ff;    /* Teal */
--dokuly-info: #da4678ff;         /* Pink */
--dokuly-success: #07a20fff;      /* Green */
--dokuly-warning: #f6c208ff;     /* Yellow */
--dokuly-danger: #B00020;         /* Red */
```

#### **Background Colors**
```css
/* Background variants */
--dokuly-bg-white: #ffffffff;
--dokuly-bg-light: #dbe0e1ff;
--dokuly-bg-dark: #100c0cff;
--dokuly-bg-lightwhite: #f1f1f1;
--dokuly-bg-primary: #165216ff;
--dokuly-bg-secondary: #108e82ff;
--dokuly-bg-info: #da4678ff;
--dokuly-bg-success: #07a20fff;
--dokuly-bg-warning: #f6c208ff;
--dokuly-bg-danger: #B00020;
```

#### **Text Colors**
```css
/* Text color variants */
--dokuly-white: #ffffffff;
--dokuly-light: #dbe0e1ff;
--dokuly-dark: #100c0cff;
--dokuly-primary: #165216ff;
--dokuly-secondary: #108e82ff;
--dokuly-info: #da4678ff;
--dokuly-success: #07a20fff;
--dokuly-warning: #f6c208ff;
--dokuly-danger: #B00020;
```

### Component-Specific Colors

#### **Button Colors**
```css
/* Primary Button */
.dokuly-bg-primary {
  background-color: #165216ff;
  color: #ffffff;
  border-color: #165216ff;
}

.dokuly-bg-primary:hover {
  background-color: #104610ff;
  border-color: #165216ff;
}

.dokuly-bg-primary:active {
  background-color: #0e3a0eff;
  box-shadow: 0 0 5px #165216ff;
}

/* Danger Button */
.dokuly-bg-danger {
  background-color: #B00020;
  color: #ffffff;
  border-color: #B00020;
}

.dokuly-bg-danger:hover {
  background-color: #970018;
  border-color: #B00020;
}

.dokuly-bg-danger:active {
  background-color: #7a0016;
  box-shadow: 0 0 5px #7a0016;
}
```

#### **Form Elements**
```css
/* Form Input Focus */
.dokuly-form-input:focus {
  border: 1px solid #165216ff;
  box-shadow: 0 0 5px #165216ff;
}

/* Checkbox */
.dokuly-checkbox {
  accent-color: #165216ff;
}

.dokuly-checkbox:focus {
  border-color: #165216ff;
  box-shadow: 0 0 5px #165216ff;
}
```

#### **Navigation Colors**
```css
/* Sidebar */
.sidebar-bg-color {
  background-color: #fbfeffff;
}

/* Top Header */
.topheader-bg-color {
  background-color: rgb(228, 248, 245);
  border-bottom: 1px solid rgb(226, 226, 226);
}

/* Active Navigation */
.nav-item-active {
  border-left: 3px solid #23655d;
  color: #333;
}
```

#### **Table and List Colors**
```css
/* Table Row Hover */
.table-row-hover:hover {
  filter: brightness(95%);
}

/* List Item Hover */
.list-group-item:hover {
  background: #d7d7d7;
}

/* Selected Row States */
.selected-row-marked-danger {
  background-color: #b000205c;
}

.selected-row-marked-warning {
  background-color: #f6c2085c;
}
```

### Color Usage Guidelines

#### **Primary Green (#165216)**
- **Usage**: Primary actions, buttons, links, focus states
- **Context**: Submit buttons, navigation active states, form focus
- **Accessibility**: High contrast with white text

#### **Danger Red (#B00020)**
- **Usage**: Delete actions, error states, warnings
- **Context**: Delete buttons, error messages, critical alerts
- **Accessibility**: High contrast with white text

#### **Warning Yellow (#f6c208)**
- **Usage**: Caution states, pending actions
- **Context**: Warning messages, pending status indicators
- **Accessibility**: Use with dark text for readability

#### **Success Green (#07a20f)**
- **Usage**: Success states, completed actions
- **Context**: Success messages, completed status indicators
- **Accessibility**: High contrast with white text

#### **Info Pink (#da4678)**
- **Usage**: Information states, neutral actions
- **Context**: Info messages, neutral status indicators
- **Accessibility**: High contrast with white text

### CSS Classes for Color Application

#### **Background Classes**
```css
.dokuly-bg-primary    /* Green background */
.dokuly-bg-secondary  /* Teal background */
.dokuly-bg-info       /* Pink background */
.dokuly-bg-success    /* Green background */
.dokuly-bg-warning    /* Yellow background */
.dokuly-bg-danger     /* Red background */
.dokuly-bg-white      /* White background */
.dokuly-bg-light      /* Light gray background */
.dokuly-bg-dark       /* Dark background */
```

#### **Text Color Classes**
```css
.dokuly-primary       /* Green text */
.dokuly-secondary     /* Teal text */
.dokuly-info          /* Pink text */
.dokuly-success       /* Green text */
.dokuly-warning       /* Yellow text */
.dokuly-danger        /* Red text */
.dokuly-white         /* White text */
.dokuly-light        /* Light gray text */
.dokuly-dark          /* Dark text */
```

#### **Border Classes**
```css
.dokuly-border-primary    /* Green border */
.btn-outline-primary     /* Green outline button */
```

### Color Accessibility

#### **Contrast Ratios**
- **Primary Green (#165216)**: Meets WCAG AA standards with white text
- **Danger Red (#B00020)**: Meets WCAG AA standards with white text
- **Warning Yellow (#f6c208)**: Use with dark text for readability
- **Success Green (#07a20f)**: Meets WCAG AA standards with white text

#### **Focus States**
```css
/* Consistent focus styling */
:focus {
  outline: 0px solid #165216ff;
  box-shadow: 0 0 5px #165216ff;
}
```

### Implementation Examples

#### **Button Implementation**
```jsx
// Primary button
<button className="btn dokuly-bg-primary">
  Submit
</button>

// Danger button
<button className="btn dokuly-bg-danger">
  Delete
</button>

// Transparent button
<button className="btn btn-bg-transparent">
  Cancel
</button>
```

#### **Form Implementation**
```jsx
// Form input with focus styling
<input 
  className="dokuly-form-input"
  type="text"
  placeholder="Enter text"
/>

// Checkbox with primary color
<input 
  className="dokuly-checkbox"
  type="checkbox"
/>
```

#### **Card Implementation**
```jsx
// Card with primary styling
<div className="dokuly-bg-primary dokuly-white">
  Primary Card
</div>

// Card with light background
<div className="dokuly-bg-light dokuly-dark">
  Light Card
</div>
```

### Color Customization

When creating new components, follow these guidelines:

1. **Use existing color classes** when possible
2. **Maintain consistency** with the established palette
3. **Test accessibility** with color contrast checkers
4. **Follow the naming convention** (`dokuly-*`)
5. **Document new colors** in this guide if added

This color scheme ensures a consistent, professional appearance throughout the Dokuly application while maintaining accessibility standards.

## Development Workflow

### Backend Development
1. **Models**: Define in `models.py` files
2. **Serializers**: Create in `serializers.py` for API
3. **Views**: Implement in `views.py` and `api.py`
4. **URLs**: Configure routing in `urls.py`
5. **Migrations**: Run `python manage.py makemigrations` and `migrate`

### Frontend Development
1. **Components**: Create React components in appropriate directories
2. **API Integration**: Use axios for API calls
3. **State Management**: Use React hooks and context
4. **Styling**: Use Bootstrap classes and custom CSS
5. **Build**: Run `bun run dev` for development, `bun run build` for production

### Database Management
- **Migrations**: Django handles schema changes
- **Data**: Use Django admin or custom management commands
- **Backups**: PostgreSQL backup/restore procedures

## Key Features for Developers

### 1. **Multi-tenancy**
- Organizations have isolated data
- Project-based access control
- API keys scoped to projects

### 2. **Revision Control System**

The Dokuly system implements a comprehensive revision control system for all main entities (Parts, Assemblies, PCBAs, Documents).

#### **Revision Model Structure**
All revision-controlled entities share common fields:
```python
# Common revision fields in all entities
revision = models.CharField(max_length=10, blank=True, null=True)
is_latest_revision = models.BooleanField(default=False, blank=True)
revision_notes = models.CharField(max_length=20000, null=True, blank=True)
```

#### **Revision System Features**

**Revision Numbering:**
- **Number-based revisions**: Can start at 0 (0, 1, 2, 3...) or 1 (1, 2, 3, 4...) - configurable per organization
- **Major-Minor revisions**: Major can start at 0 (0-0, 0-1, 1-0...) or 1 (1-0, 1-1, 2-0...). Minor revisions always start at 0
- **Letter-based revisions**: A, B, C... or A-A, A-B, B-A... (major-minor format)
- **Custom revision formats**: Dash (-) or dot (.) separators
- **Organization settings**: `use_number_revisions`, `revision_format`, `start_major_revision_at_one`

**Revision States:**
- **Latest Revision**: `is_latest_revision = True` (only one per entity)
- **Historical Revisions**: `is_latest_revision = False`
- **Archived Revisions**: `is_archived = True` (soft deleted)

**Revision Workflow:**
1. **Create New Revision**: `POST /api/parts/newRevision/<id>/`
2. **Get Revision List**: `GET /api/parts/get/revisions/<id>/`
3. **Get Latest Revisions**: `GET /api/parts/get/latestRevisions/`
4. **Archive Revision**: `POST /api/parts/archivePart/<id>/`

#### **Revision Data Management**

**Revision Notes:**
- **Purpose**: Document changes between revisions
- **Field**: `revision_notes` (TextField, max 20,000 chars)
- **Usage**: Change documentation, revision tables
- **Format**: Markdown supported

**Errata:**
- **Purpose**: Document errors and corrections
- **Field**: `errata` (TextField, max 20,000 chars)
- **Usage**: Known issues, fixes, corrections
- **Format**: Markdown supported

**Revision History:**
- **Previous Revision**: `previoius_revision_id` (for Documents)
- **Revision Chain**: Maintains linked list of revisions
- **Revision Timeline**: Track all changes over time

#### **Revision API Endpoints**

**Parts:**
```bash
# Create new revision
POST /api/parts/newRevision/<int:pk>/

# Get revision list
GET /api/parts/get/revisions/<int:id>/

# Get latest revisions
GET /api/parts/get/latestRevisions/

# Archive revision
POST /api/parts/archivePart/<int:pk>/
```

**Assemblies:**
```bash
# Create new revision
POST /api/assemblies/newAsmRevision/<int:pk>/

# Get revision list
GET /api/assemblies/get/revisions/<int:asmId>/

# Archive revision
POST /api/assemblies/archiveRevision/<int:pk>/
```

**Documents:**
```bash
# Create new revision
POST /api/documents/newRevision/<int:pk>/

# Get revision list
GET /api/documents/get/revisions/<int:id>/
```

#### **Revision System Configuration**

**Organization Settings:**
```python
# In Organization model
use_number_revisions = models.BooleanField(default=False)
revision_format = models.CharField(
    max_length=20, 
    default="major-minor",
    choices=[
        ("major-only", "Major Only"),
        ("major-minor", "Major-Minor")
    ]
)
start_major_revision_at_one = models.BooleanField(
    default=False,
    help_text="When enabled, major revisions display starting at 1 instead of 0. Minor revisions always start at 0."
)
```

**Revision Display Examples:**
- **Number-based, start at 0, major-only**: 0, 1, 2, 3...
- **Number-based, start at 1, major-only**: 1, 2, 3, 4...
- **Number-based, start at 0, major-minor**: 0-0, 0-1, 1-0, 1-1, 2-0...
- **Number-based, start at 1, major-minor**: 1-0, 1-1, 2-0, 2-1, 3-0...
- **Letter-based, major-only**: A, B, C, D...
- **Letter-based, major-minor**: A-A, A-B, B-A, B-B, C-A...

#### **Revision Best Practices**

**Creating Revisions:**
1. Always create new revision for significant changes
2. Document changes in `revision_notes`
3. Update `is_latest_revision` flags appropriately
4. Archive old revisions when no longer needed

**Revision Notes:**
1. Use clear, descriptive change summaries
2. Include technical details for complex changes
3. Reference related issues or requirements
4. Use markdown formatting for readability

**Revision Management:**
1. Keep revision history for audit purposes
2. Use consistent revision numbering
3. Archive obsolete revisions
4. Maintain revision chain integrity

### 3. **File Management**
- Azure Blob Storage integration
- File associations with entities
- PDF generation and processing

### 4. **BOM Management**
- Multi-level bill of materials
- Quantity and designator tracking
- Alternative parts support

### 5. **Inventory Tracking**
- Stock level monitoring
- Location-based inventory
- Transaction logging

### 6. **Project Organization**
- All entities belong to projects
- Project-based permissions
- Cross-project references

## Development Environment Setup

### Prerequisites
- Docker and Docker Compose
- Bun ([https://bun.sh](https://bun.sh)) for frontend
- Python 3.x (for local development without Docker)
- PostgreSQL (included in Docker setup)

### Backend Setup (Docker Compose)
The backend runs using Docker Compose for both development and production:

```bash
# Development environment
docker-compose -f docker-compose-dev.yml up --build

# Development on Mac
docker-compose -f docker-compose-dev-mac.yml up --build

# Production environment
docker-compose up --build
```

### Frontend Setup
```bash
bun install
bun run dev
```

### Manual Backend Setup (Alternative)
If running without Docker:
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Running Python Commands
When using Docker Compose, Python commands must be run through the Docker container. The system uses different Docker Compose files for different environments:

#### **Docker Compose File Selection**
- **Development (Mac)**: `docker-compose-dev-mac.yml`
- **Development (Linux/Windows)**: `docker-compose-dev.yml`
- **Production**: `docker-compose.yml`

#### **Basic Django Commands**
```bash
# Database migrations
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py migrate

# Create superuser
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py createsuperuser

# Django shell (interactive)
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell

# Django shell with command execution
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
print('Total PCBAs:', Pcba.objects.count())
"

# Collect static files
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py collectstatic

# Run tests
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test
```

#### **Django Shell Best Practices**
For complex operations, use the Django shell with command execution:

```bash
# Single command execution
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
from assemblies.models import Assembly
print('PCBAs:', Pcba.objects.count())
print('Assemblies:', Assembly.objects.count())
"

# Multi-line commands (use quotes and escape characters)
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
pcbas = Pcba.objects.all()
for p in pcbas:
    print(f'ID {p.id}: {p.display_name}')
"

# Interactive shell for complex operations
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell
```

#### **Container Management**
```bash
# Check running containers
docker-compose -f docker-compose-dev-mac.yml ps

# View container logs
docker-compose -f docker-compose-dev-mac.yml logs web

# Restart services
docker-compose -f docker-compose-dev-mac.yml restart web

# Stop all services
docker-compose -f docker-compose-dev-mac.yml down

# Start services
docker-compose -f docker-compose-dev-mac.yml up -d
```

#### **File Paths in Docker**
When running commands in Docker containers, use these paths:
- **Django project root**: `/dokuly_image/`
- **Manage.py location**: `/dokuly_image/dokuly/manage.py`
- **Project files**: `/dokuly_image/dokuly/`
- **Static files**: `/dokuly_image/dokuly/static/`
- **Media files**: `/dokuly_image/media/`

#### **Database Operations and Data Management**
For database operations and data manipulation:

```bash
# Check current data in models
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
from assemblies.models import Assembly
print('PCBAs:', Pcba.objects.count())
print('Assemblies:', Assembly.objects.count())
for p in Pcba.objects.all()[:5]:
    print(f'PCBA {p.id}: {p.display_name}')
"

# Bulk data operations
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
# Update all PCBAs
for pcba in Pcba.objects.all():
    pcba.display_name = f'Updated {pcba.display_name}'
    pcba.save()
print('Updated all PCBAs')
"

# Create test data
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py shell -c "
from pcbas.models import Pcba
from projects.models import Project
# Create a new PCBA
project = Project.objects.first()
pcba = Pcba.objects.create(
    display_name='Test PCBA',
    project=project,
    part_number=9999
)
print(f'Created PCBA: {pcba.id}')
"
```

#### **Common Docker Issues and Solutions**
```bash
# If containers are not running
docker-compose -f docker-compose-dev-mac.yml up -d

# If you get "service not found" errors, check container names
docker-compose -f docker-compose-dev-mac.yml ps

# If you get "no such file" errors, verify the file path
docker-compose -f docker-compose-dev-mac.yml exec web ls -la /dokuly_image/dokuly/

# If Django setup fails, ensure the container is running
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py check
```

## Dependencies and Component Architecture

### Backend Dependencies
The system uses several key dependency patterns:

**Core Django Dependencies:**
- `Django 4.2.11` - Main framework
- `djangorestframework` - API framework
- `django_rest_knox` - Token authentication
- `django_cors_headers` - CORS handling
- `django_storages` - File storage abstraction

**Database Dependencies:**
- `psycopg2-binary` - PostgreSQL adapter
- `django_cryptography` - Encrypted fields
- `django_tenants` - Multi-tenancy support

**File Storage Dependencies:**
- `google-cloud-storage` - Google Cloud Storage
- `django-storages[azure]` - Azure Blob Storage
- `whitenoise` - Static file serving

**Frontend Dependencies:**
- `react` - UI framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `react-bootstrap` - UI components
- `vite` - Build tool (Bun as package manager)

### Dependency Management
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies (requires Bun: https://bun.sh)
bun install

# Docker dependencies (recommended)
docker-compose up --build
```

## Reusable Components Architecture

### Backend Reusable Patterns

#### **Generic Model Mixins**
```python
# Common patterns for all entities
class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
class ProjectMixin(models.Model):
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)
    
class ArchiveMixin(models.Model):
    is_archived = models.BooleanField(default=False)
    archived_date = models.DateField(null=True, blank=True)
```

#### **Generic Serializers**
```python
# Reusable serializer patterns
class ProjectBasedSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.title', read_only=True)
    
class ArchiveSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        validated_data['is_archived'] = False
        return super().create(validated_data)
```

#### **Generic ViewSets**
```python
# Common CRUD operations
class ProjectBasedViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return self.queryset.filter(project__in=self.request.user.profile.projects.all())
```

### Frontend Reusable Components

#### **Component Hierarchy**
```
src/components/
├── common/
│   ├── dokuly_components/     # Core reusable components
│   │   ├── dokulyForm/        # Form components
│   │   ├── dokulyTable/       # Table components
│   │   ├── dokulyModal/       # Modal components
│   │   └── dokulyTags/        # Tag components
│   ├── bom/                   # BOM-specific components
│   ├── hooks/                 # Custom React hooks
│   └── functions.js           # Utility functions
```

#### **Generic Component Patterns**

**Generic Table Component:**
```javascript
// Reusable table with common functionality
const GenericTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onArchive,
  projectFilter = true 
}) => {
  // Common table logic
};
```

**Generic Form Component:**
```javascript
// Reusable form with validation
const GenericForm = ({ 
  fields, 
  onSubmit, 
  validationSchema,
  projectField = true 
}) => {
  // Common form logic
};
```

**Generic Modal Component:**
```javascript
// Reusable modal wrapper
const GenericModal = ({ 
  show, 
  onHide, 
  title, 
  children,
  size = "lg" 
}) => {
  // Common modal logic
};
```

### Reusable Hooks

**Custom Hooks for Common Patterns:**
```javascript
// Project-based data fetching
const useProjectData = (endpoint, projectId) => {
  // Common project data logic
};

// Form state management
const useFormState = (initialValues, validationSchema) => {
  // Common form state logic
};

// API error handling
const useApiError = () => {
  // Common error handling logic
};
```

## Common Development Patterns

### 1. **Adding New Features**
1. Create/update models in appropriate app
2. Create serializers for API
3. Implement views and URL patterns
4. Create frontend components
5. Add navigation and routing

#### **Working with BOMs, Issues, and Notes**
When adding features that involve BOMs, issues, or notes:

**BOM Integration:**
- Use `Assembly_bom` and `Bom_item` models for BOM functionality
- Implement BOM import/export features
- Handle multi-level BOM relationships
- Support designator and quantity management

**Issues Integration:**
- Use the Issues model for tracking problems
- Implement issue creation/update/close workflows
- Add notification systems for issue events
- Support issue filtering and search

**Notes Integration:**
- Use `MarkdownText` model for rich text content
- Implement markdown rendering in frontend
- Support multiple note tabs per entity
- Handle revision notes and errata

### 2. **Creating Reusable Components**

#### **Backend Reusable Patterns**

**Model Mixins for Common Functionality:**
```python
# Timestamp mixin for all entities
class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

# Project-based mixin for access control
class ProjectBasedMixin(models.Model):
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        abstract = True

# Archive mixin for soft deletion
class ArchiveMixin(models.Model):
    is_archived = models.BooleanField(default=False)
    archived_date = models.DateField(null=True, blank=True)
    
    class Meta:
        abstract = True
```

**Generic Serializers:**
```python
# Base serializer with common functionality
class BaseSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        abstract = True

# Archive-aware serializer
class ArchiveSerializer(BaseSerializer):
    def create(self, validated_data):
        validated_data['is_archived'] = False
        return super().create(validated_data)
```

**Generic ViewSets:**
```python
# Project-based ViewSet with common permissions
class ProjectBasedViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user_projects = self.request.user.profile.projects.all()
        return self.queryset.filter(project__in=user_projects)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

#### **Frontend Reusable Components**

**Component Design Principles:**
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Build complex components from simple ones
3. **Props Interface**: Clear, well-documented prop interfaces
4. **Default Values**: Sensible defaults for optional props
5. **Error Boundaries**: Graceful error handling

**Generic Table Component:**
```javascript
// Reusable table with common functionality
const DokulyTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onArchive,
  projectFilter = true,
  searchable = true,
  sortable = true,
  pagination = true 
}) => {
  const [filteredData, setFilteredData] = useState(data);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Common table logic
  const handleSort = (key) => {
    // Sort logic
  };
  
  const handleFilter = (searchTerm) => {
    // Filter logic
  };
  
  return (
    <div className="dokuly-table">
      {searchable && <SearchInput onSearch={handleFilter} />}
      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.title}
                {sortable && <SortIcon />}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
              ))}
              <td>
                <ActionButtons 
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onArchive={onArchive}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {pagination && <Pagination />}
    </div>
  );
};
```

**Generic Form Component:**
```javascript
// Reusable form with validation
const DokulyForm = ({ 
  fields, 
  onSubmit, 
  validationSchema,
  projectField = true,
  submitText = "Submit",
  cancelText = "Cancel"
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation logic
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {projectField && <ProjectSelector />}
      {fields.map(field => (
        <FormField 
          key={field.name}
          field={field}
          value={formData[field.name]}
          onChange={setFormData}
          error={errors[field.name]}
        />
      ))}
      <div className="form-actions">
        <Button type="submit" variant="primary">{submitText}</Button>
        <Button type="button" variant="secondary">{cancelText}</Button>
      </div>
    </form>
  );
};
```

**Custom Hooks for Reusability:**
```javascript
// Project-based data fetching
const useProjectData = (endpoint, projectId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${endpoint}?project=${projectId}`);
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [endpoint, projectId]);
  
  return { data, loading, error, refetch: () => fetchData() };
};

// Form state management
const useFormState = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validation
    if (validationSchema) {
      try {
        validationSchema.validateSyncAt(name, { [name]: value });
        setErrors(prev => ({ ...prev, [name]: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, [name]: err.message }));
      }
    }
  };
  
  return { values, errors, touched, handleChange, setValues };
};
```

#### **Component Composition Patterns**

**Higher-Order Components:**
```javascript
// HOC for project-based components
const withProject = (WrappedComponent) => {
  return (props) => {
    const { projectId } = useParams();
    const { data: project } = useProjectData('/api/projects', projectId);
    
    return <WrappedComponent {...props} project={project} />;
  };
};

// HOC for authentication
const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) return <LoginPrompt />;
    
    return <WrappedComponent {...props} user={user} />;
  };
};
```

**Render Props Pattern:**
```javascript
// Generic data fetcher with render props
const DataFetcher = ({ endpoint, children }) => {
  const { data, loading, error } = useApiData(endpoint);
  
  return children({ data, loading, error });
};

// Usage
<DataFetcher endpoint="/api/parts">
  {({ data, loading, error }) => (
    <PartsTable data={data} loading={loading} error={error} />
  )}
</DataFetcher>
```

### 2. **Database Changes**
1. Modify models
2. Create migrations: `docker-compose exec web python manage.py makemigrations`
3. Apply migrations: `docker-compose exec web python manage.py migrate`
4. Update serializers if needed

### 3. **API Development**
1. Define model relationships
2. Create serializers with proper field mapping
3. Implement ViewSets for CRUD operations
4. Add custom endpoints for specific functionality
5. Test with API client or frontend

### 4. **Frontend Integration**
1. Create API service functions
2. Build React components
3. Implement state management
4. Add routing and navigation
5. Style with Bootstrap and custom CSS

## Security Considerations

### Authentication & Authorization
- Token-based authentication with expiration
- Role-based access control (Viewer, User, Admin, Owner)
- Project-based data isolation
- API key management with project scoping

### Data Protection
- Encrypted fields for sensitive data
- Secure file storage
- Input validation and sanitization
- CSRF protection

### Multi-tenancy Security
- Organization data isolation
- Project-based access control
- API key scoping
- Secure file storage per organization

## Performance Considerations

### Database Optimization
- Proper indexing on foreign keys
- Query optimization with select_related/prefetch_related
- Pagination for large datasets
- Database connection pooling

### Frontend Performance
- Component lazy loading
- Image optimization
- Bundle splitting
- Caching strategies

### File Storage
- Azure Blob Storage for production
- Local storage for development
- File compression and optimization
- CDN integration

## Testing Strategy

### Backend Testing
- **Unit tests**: Models and views testing
- **API endpoint testing**: REST API functionality
- **Database transaction testing**: Data integrity
- **Authentication testing**: User permissions and access control

**Testing Commands:**
```bash
# Run all backend tests
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test

# Run tests for specific app
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test parts
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test assemblies
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test projects

# Run tests with coverage
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test --coverage

# Run tests with verbose output
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test --verbosity=2

# Run specific test method
docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test parts.tests.PartTestCase.test_api_part_creation
```

### Frontend Testing
- **Component unit tests**: React component testing
- **Integration tests**: Component interaction testing
- **API integration testing**: Frontend-backend communication
- **User interaction testing**: End-to-end user workflows

**Testing Commands:**
```bash
# Run frontend tests (if configured)
bun test

# Run tests in watch mode (if configured)
bun run test:watch

# Run tests with coverage (if configured)
bun run test:coverage
```

## Deployment

### Production Environment
- Django with Gunicorn
- PostgreSQL database
- Azure Blob Storage
- Nginx reverse proxy
- SSL/TLS encryption

### Development Environment
- Django development server (via Docker Compose)
- PostgreSQL container
- Local file storage
- Hot reloading for frontend
- Docker Compose for backend services

## Troubleshooting

### Common Issues
1. **Database migrations**: Ensure all migrations are applied using `docker-compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py migrate`
2. **File permissions**: Check file storage permissions
3. **API authentication**: Verify token validity and project access
4. **Frontend build**: Clear dependency cache and reinstall with `rm -rf node_modules && bun install`
5. **Database connections**: Check PostgreSQL connection settings in Docker Compose
6. **Docker container issues**: Use `docker-compose -f docker-compose-dev-mac.yml logs web` to check backend logs
7. **Django shell access**: Use the correct file path `/dokuly_image/dokuly/manage.py` when running shell commands
8. **Container not running**: Check container status with `docker-compose -f docker-compose-dev-mac.yml ps`
9. **Service not found**: Verify the correct service name (usually `web`) in docker-compose commands
10. **File path errors**: Ensure you're using the correct Docker volume mount paths (`/dokuly_image/`)

### Debug Tools
- Django Debug Toolbar (development)
- Browser developer tools
- Django logging configuration
- Database query analysis

This reference guide provides a comprehensive overview of the Dokuly PLM system architecture, helping developers understand the codebase structure, relationships, and development patterns for building new features effectively.
