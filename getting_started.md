# Getting Started

##### Table of Contents

- [Quickstart](#quickstart)
- [Setting up self hosting](#setup_selfhost)
  - [Nginx Proxy](#nginx_proxy)
  - [SMTP Server](#smtp-email)
- [To start developing on a new computer](#start_dev_on_new_computer)
  - [Learning resources](#learning_resources)
    - [Docker](#docker)
  - [Development with Docker (Windows)](#development_with_docker_windows)
  - [Development with Docker (Mac)](#development_with_docker_mac)
  - [Development (Linux)](#development_linux)
    - [Build Django and PostgreSQL services](#build_django_and_postgresql_services)
    - [Build Front-End Main Entry Point](#build_front_end_main_entry_point)
  - [Django: Dealing with files](#django_dealing_with_files)
    - [Saving File in View](#saving_file_in_view)
    - [Passing File from a Link, Through a View](#passing_file_from_a_link_through_a_view)
  - [Django: Entities (Apps), Fields, Migrations and Views](#django_entities_apps_fields_migrations_and_views)
    - [Creating new entities / Apps](#creating_new_entities_apps)
    - [Adding fields to a model](#adding_fields_to_a_model)
    - [Adding default data to a model](#adding_default_data_to_a_model)
    - [Creating views](#creating_views)
    - [Creating React Components (Example)](#creating_react_components_example)
    - [Lifting up states in React (Example)](#lifting_up_states_in_react_example)
  - [Install remaining dependencies (Windows)](#install_remaining_dependencies_windows)
  - [Production Tech Stack and server maintenance](#production_tech_stack_and_server_maintenance)
    - [Tech stack, running on production](#tech_stack_running_on_production)
    - [Current Maintenance](#current_maintenance)
- [Testing the Code](#testing_the_code)
  - [Testing of generic Python functions](#testing_of_generic_python_functions)
- [Create a copy of the database on local server](#create_a_copy_of_the_database_on_local_server)
- [Update DB through PG Admin](#update_db_through_pg_admin)
- [Set up PG Admin locally](#set_up_pg_admin_locally)

## Quickstart

Make sure docker and other dependencies are installed. Then follow these steps:

### Create a .env file (it can be left empty)

Then set a value within the string quotes.

### Build the project. This can be done using:
```bash
docker compose -f docker-compose-dev.yml build
```
or for mac / linux:
```bash
docker compose -f docker-compose-dev-mac.yml build
```

### Build frontend using npm:
```bash
npm i
```
```bash
npm run build
```

### Run the project:
```bash
docker compose -f docker-compose-dev.yml up
```

### Access dokuly:
In your web browser, dokuly can be accessed at 
**http://oss.dokuly.localhost:8000**.   


### Logging in for the first time on localhost:

The PLM comes with some default data. A user is created with the username "ossuser" and password: "oss_password".
This can be used to login with for the first time to start using and configuring dokuly for your use-case.

<a name="setup_selfhost" />

## Setup self hosting of Dokuly

To start hosting the service on your own machine you have to have all dependencies installed. This includes docker and node. See the table of contents for more information on installing these dependencies. 
<a name="nginx_proxy" />

### Nginx proxy
## Local Hosting Setup Guide


To enable access to your locally hosted project on your local network or VPN, follow these steps to configure an NGINX proxy. Directly using your machine's local IP address might not suffice, hence the need for these adjustments:

1. **Locate the NGINX Configuration**
   - Navigate to the `nginx` folder where crucial configuration files reside.

2. **Edit the Configuration File**
   - Within the `nginx` folder, find and open the `nginx.conf` file for editing.
     - **Update IP Address**: Search for a line starting with `server_name`, typically containing an IP like `10.0.0.21`. Replace it with your machine's local network IP. To find your IP address:
       - On **Linux/Mac**: Open a terminal and enter `ifconfig`.
       - On **Windows**: Open Command Prompt and type `ipconfig`.
       Look for the IPv4 address under your network connection, usually formatted as `192.168.x.x`.
     - **Set Project Name**: Locate the line `proxy_set_header Host` and change the adjacent value to your project's name. If you haven't set up a project name, run the `self_host_create_new_tenant` script.

3. **Save and Close**
   - After making the necessary edits, save the changes and close the `nginx.conf` file.

4. **Restart NGINX**
   - To apply your changes, execute the `self_host_restart.ps1` script located in the `self_hosting` folder.

By following these steps, your locally hosted project should become accessible to others on the same network or VPN using your computer's local IP address.

### SMTP Email

Dokuly has support for smtp email, and some basic functions via email like resetting your user's password. To setup the smtp you will need your own smtp server setup, and then in the .env file add the following fields:

```ini
EMAIL_HOST = "your_smtp_provider_address"
EMAIL_PORT = your_port
EMAIL_HOST_USER = "your_smtp_username"
EMAIL_HOST_PASSWORD = "your_smtp_password"
EMAIL_SENDER = 'your_smtp_sender_address'
```

Replace the values with your own information from your smtp provider.

<a name="start_dev_on_new_computer"/>

## To start developing on a new computer

<a name="learning_resources"/>

### Learning Resources

<a name="docker"/>

#### Docker

Dokuly can run in a Docker container to streamline the toolchain configuration.

A video on how Django with Postgres is set up in Docker can be found [here](https://www.youtube.com/watch?v=oBQxFn1CDno).

If Docker desktop refuses to delete containers, the following command can help:

This will remove:

- all stopped containers.
- all networks not used by at least one container.
- all images without at least one container associated to them.
- all build cache.

```bash
docker system prune -a
```

If this doesn't help, a reboot might be necessary (on Windows).

<a name="development_with_docker_windows"/>

### Development with Docker (Windows)

1. Install WSL2 and set it as default WSL version.
   Download from [here](https://docs.microsoft.com/nb-no/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package).

   ```bash
   wsl --set-default-version 2
   ```

2. Enable Hardware virtualization in BIOS.
   Follow this [link](https://www.asus.com/support/FAQ/1038245/).

3. Install Docker Desktop.
   Download from [here](https://www.docker.com/products/docker-desktop).

4. Run `./localServer.ps1` script to build and run images. The localServer.ps1 script takes care of the migrations and has a cleanup function, clearing old images from cache, if you do not want to clear, run the following:

   ```bash
   docker compose -f docker-compose-dev.yml build

   docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py makemigrations

   docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py migrate

   docker compose -f docker-compose-dev.yml up
   ```

   localServer.ps1 builds both Django and PostgreSQL services

5. Run start_webpack ( or `npm run dev` ) to build main.
   If Node.js is not installed, follow steps 2 and 12 for Install Remaining Dependencies
   Make sure to install with Node.js version 14.19.0 and npm 6.14.16.
   Download from [here](https://community.chocolatey.org/packages/nodejs.install/14.19.0).

   Install webpack `npm install --save-dev webpack`.

   Local Django development server should run on localhost:8000

   Both db (postgres / psql) and Django are accessible through CLI in the docker desktop

<a name="development_with_docker_mac"/>

### Development with Docker (Mac)

When developing with Apple silicon (M1), a special Docker version must be installed.

Find the correct package [here](https://docs.docker.com/desktop/mac/apple-silicon/).

<a name="development_linux"/>

### Development (Linux)

If working on Debian Linux. Run the script debain_install_dependencies, to install the necessary dependencies to run the dokuly Docker.

<a name="build_django_and_postgresql_services"/>

#### Build Django and PostgreSQL services

1. Confirm Docker Compose-version and download Docker Compose for Linux.

   ```bash
   mkdir -p ~/.docker/cli-plugins/
   curl -SL https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
   ```

2. Restart the machine.

   ```bash
   sudo systemctl reboot
   ```

3. Set permission so that Docker Compose is executable.

   ```bash
   chmod +x ~/.docker/cli-plugins/docker-compose
   sudo chown $USER /var/run/docker.sock
   ```

4. Verify the installation.

   ```bash
   docker compose version

   # output should be similar to this:
   Docker Compose version v.2.2.3
   ```

5. Run and build containers from root of dokuly project.

   ```bash
   docker compose -f docker-compose-dev.yml build
   docker compose -f docker-compose-dev.yml run -u root web python /dokuly_image/dokuly/manage.py makemigrations
   docker compose -f docker-compose-dev.yml run -u root web python /dokuly_image/dokuly/manage.py migrate
   docker compose -f docker-compose-dev.yml up
   ```

   On Mac:

     ```bash
   docker compose -f docker-compose-dev-mac.yml build
   docker compose -f docker-compose-dev-mac.yml run -u root web python /dokuly_image/dokuly/manage.py makemigrations
   docker compose -f docker-compose-dev-mac.yml run -u root web python /dokuly_image/dokuly/manage.py migrate
   docker compose -f docker-compose-dev-mac.yml up
   ```

   If you enconter the error:

   ```bash
   Status: cgroups: cgroup mountpoint does not exist: unknown, Code: 1
   ```

   Run the following workaround:

   ```bash
   sudo mkdir /sys/fs/cgroup/systemd
   sudo mount -t cgroup -o none,name=systemd cgroup /sys/fs/cgroup/systemd
   ```

   This will build both Django and PostgreSQL, as they are built together in the same docker-compose file.

<a name="build_front_end_main_entry_point"/>

#### Build Front-End Main Entry Point

The Docker stack needs the compiled JSX from the Frontend Django Application. Building the entry point is done with webpack, which needs to be running in order to watch live changes appear while developing. NOTE: Remember that the main entry point is built before pushing any changes to git.

1. Install necessary dependencies.

   ```bash
   dnf install npm
   npm install --save-dev webpack
   ```

2. Start the web server.

   ```bash
   npm i
   npm run dev
   ```

<a name="django_dealing_with_files"/>

### Django: Dealing with files

<a name="saving_file_in_view"/>

#### Saving File in View

To save a file to DB from within a view, see the following example.

```python
@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def save_doc_file(request, documentId):
    """Method for updating documents, and triggering regeneration of pdf documents.
    """
    # Extracts the data filled in the UI form. Assumes presence of relevant data.
    data = request.data
    document_obj = Document.objects.get(id=documentId)
    # Check if file is included in view data, and save it.
    if "document_file" in data:
        file = request.FILES['document_file']
        document_obj.document_file.save(file.name, file)

    return Response(serializer.data, status=status.HTTP_200_OK)
```

<a name="passing_file_from_a_link_through_a_view"/>

#### Passing File from a Link, Through a View

To enable secure sharing of files with clients, files have to be passed through a view.

The following example shows how a file can be accessed by using the view's URL.

The file is downloaded similarly to static files.

No axios query is necessary.

In `urls.py`:

```python
urlpatterns = [
    path("api/pcbas/download/manufacture_pdf/<int:pcba_id>/", views.download_manufacture_pdf),
]

urlpatterns += router.urls
```

In `views.py`:

```python
@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def download_manufacture_pdf(request, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    """
    # Fetch file from DB
    pcba_obj = Pcba.objects.get(id=pcba_id)
    return  FileResponse(pcba_obj.manufacture_pdf.open('rb'), as_attachment=True)
```

Access the file in front-end like the following JSX example:

The URL is on the form: `api/pcbas/download/manufacture_pdf/1/`

```jsx
// Download button
uri != "" ? (
  <a href={uri} download>
    {/* download icon (button) */)}
    <img width="25px" src="../../static/icons/file-download.svg" alt="icon" />
  </a>
) : (
  ""
);
```

<a name="django_entities_apps_fields_migrations_and_views"/>

### Django: Entities (Apps), Fields, Migrations and Views

Django is the database and web server for dokuly.

<a name="creating_new_entities_apps"/>

#### Creating new entities / Apps

1. Create the new entity using the manage.py file.

   ```bash
   python ./dokuly/manage.py startapp "appname"
   ```

2. Create the files api.py and serializers.py in your new entity ./dokuly/"appname"/

3. Example api.py

   ```python
   from appname.models import AppnameModel
   from rest_framework import viewsets, permissions
   from rest_framework.permissions import IsAuthenticated
   from knox.auth import TokenAuthentication
   from .serializers import AppNameSerializer

   # This class is used for the basic GET, PUT, POST, DELETE methods, using all objects stored in the database as the queryset.

   class AppNameViewSet(viewsets.ModelViewSet):
       authetiation_classis = (TokenAuthentication,)
       permission_classes = (IsAuthenticated,)
       queryset = AppnameModel.objects.all()
       serializer_class = AppNameSerializer

       def perform_create(self, serializer):
           serializer.save()

   ```

4. Example serializers.py:

   ```python
   from rest_framework import serializers
   from appname.models import AppnameModel
   from rest_framework.fields import ListField

   # A basic serializer

   class AppnameSerializer(serializers.ModelSerializer):

       class Meta:
           model = AppnameModel
           fields = '__all__'

   ```

5. Configure the urls.py file:

   ```python
   from django.urls.conf import path
   from rest_framework import routers
   from .api import AppNameViewSet
   from . import views

   router = routers.DefaultRouter()
   router.register('api/appname', AppNameViewSet, 'appname')

   urlpatterns = [
       # Add additional views:
       path('api/appname/update/item/<int:id>/<str:string>/', views.update_item),
       path('api/appname/get/item/<int:id>/', views.fetch_data),
   ]

   urlpatterns += router.urls
   ```

6. Finally add the appname to installed apps in settings.py

   ```python
   ./dokuly/dokuly/settings.py
   # Application definition

   INSTALLED_APPS = [
       'django.contrib.admin',
       'django.contrib.auth',
       'django.contrib.contenttypes',
       'pcbs',
       'rest_framework',
       'appname', # New app goes here
       ...
   ]
   ```

<a name="adding_fields_to_a_model"/>

#### Adding fields to a model

1. Locate the model to be altered inside ./system_platform

2. Find the models.py file

3. Add a field to the model, by adding a variable to the class:

   ```python
   class Pcba(models.Model):

       # A standard integer field, can be used for ids, etc. All Django models come with a standard incrementing auto id field when saved to PostgreSQL.
       part_number = models.IntegerField(blank=True, null=True)
       # Blank=True, means the field is not required in forms for the model (PUT, POST)
       # null=True, means the field gets initialized as null, and we are allowed to set it to null after altercation

       # Adding a new char field to the model, with a max size (max_length) and blank=True
       new_field = models.CharField(max_length=100, blank=True, default='test')
       # default is for initializing with a value other than a blank string or null
   ```

4. After the model is updated, run migrateDockerServer.ps1 if on Windows, or if on Linux run:

   ```bash
       docker compose -f docker-compose-dev.yml run -u root web python /dokuly_image/dokuly/manage.py makemigrations
       docker compose -f docker-compose-dev.yml run -u root web python /dokuly_image/dokuly/manage.py migrate
   ```

   This will migrate the changes made from Django and save them to the PostgreSQL server.

<a name="adding_default_data_to_a_model"/>

#### Adding default data to a model

To add data to a model, create a new view and follow the template below.

```python
from django.db import migrations, models

def add_default_doc_types(apps, schema_editor):
    Document_Prefix = apps.get_model('documents', 'Document_Prefix')

    # Check if the field exits.
    tn_exists = Document_Prefix.objects.filter(prefix="TN")
    if not(tn_exists):
        prefix = Document_Prefix.objects.create(
            prefix="TN",
            display_name='Technical Note',
        )
        prefix.save()

class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0023_auto_20220623_0800'),
    ]

    operations = [
        migrations.RunPython(add_default_doc_types),
    ]

```

<a name="creating_views"/>

#### Creating views

A Django view is a customizable function that takes a web response and returns a web response, much like a resolver or a custom express API call.

The request is sent from axios and the response can be anything, from a string or a queryset to XML or HTML. Example on how to write a view and connect it to the Django API:

1. Create the function(s) in the views.py file.

   ```python
   from rest_framework.response import Response
   from rest_framework.decorators import api_view, renderer_classes
   from rest_framework.renderers import JSONRenderer
   from rest_framework import status
   from .models import AppnameModel
   from .serializers import AppnameSerializer

   # Define the renderer classes (return types) and the allowed HTTP requests
   @api_view(('GET', 'PUT', )) # GET and PUT are allowed
   @renderer_classes((JSONRenderer, )) # Return JSON
   def example_view(request, objectId): # Request is the HTTP request sent from axios, object id is parameter
       data = list(request.data.values()) # Access form data sent with the request
       method = request.method # Access the request method
       databaseObject = AppnameModel.objects.get(id=objectId) # Fetch a database object
       if method == 'GET': # Let's return the object if the request is GET
           # The serializer lets us return the databaseObject as a JSON Object, set many=True if the query set contains more than 1 entry.
           serializer = AppnameSerializer(databaseObject, many=False)
           return Response(serializer.data, status=status.HTTP_200_OK) # Return the serialized data
       elif method == 'PUT': # Update the object if the request is PUT
           someFormData = data[0] # Can also access request data with keys, data['name']
           AppnameModel.objects.filter(id=objectId).update(name=someFormData) # Single row and col update
           newObject = AppnameModel.objects.get(id=objectId) # Fetch updated object
           serializer = AppnameSerializer(newObject, many=False)
           return Response(serializer.data, status=status.HTTP_200_OK) # Return the serialized updated data
       else: # No request here, return error
           return Response("%s not allowed" % method, status=status.HTTP_400_BAD_REQUEST)
   ```

2. Connect the view to the API in the urls.py file.

   ```python
   from django.urls.conf import path
   from rest_framework import routers
   from .api import AppNameViewSet
   from . import views

   router = routers.DefaultRouter()
   router.register('api/appname', AppNameViewSet, 'appname')

   # View paths goes here
   urlpatterns = [
       # The <int:objectId> need to correspond to the parameter set in the view function
       path('api/appname/customView/<int:objectId>/', views.example_view),
   ]

   urlpatterns += router.urls

   ```

3. Call it using axios from frontend, add a function to an existing queries.js file, create a new one if the component does not have one (usually found in the functions folder for a component).

```JS
import axios from 'axios'
import { tokenConfig } from '....../actions/auth'

export const callCustomView = (objectId) => {
    // URL used in the axios call needs to match the URL added to the Django API
    const promise = axios.get(`api/appname/customView/${objectId}/`)
    // Any data sent from the view saved in this const
    const dataPromise = axios.then((res) => res.data)
    // Catch errors
    const error = axois.catch((err) => err)
    if(error != null) {
        return error
    }
    return dataPromise
}

// From any component, to call the query:
import { callCustomView } from './functions/query'

callCustomView.
then((res) => {
    // Do anything with the data
})
.finally(() => {
    // Finish loading
})

```

<a name="creating_react_components_example"/>

#### Creating React Components (Example)

This is an empty example skeleton file of a React component. Components needs to return a value that is not null, so make sure the default return always returns a value that is not null, e.g. an empty div tag. JSX requires a parent element and tags should always have a corresponding closing tag.

```JS
import React, {useState, useEffect} from 'react' // Basic React imports
import { useSpring, animated, config } from 'react-spring' // React Spring Animation imports
import { useAlert } from 'react-alert' // Premade hook for React alerts

// Component name and parameters
const Example = (props) => {

    // Basic state hook. Has a value and a setter: [value, setter]
    const [refresh, setRefresh] = useState(false)
    // To change the value of "refresh" use:
    setRefresh(true)

    // To access props value ( Check the props below in Example Usage)
    // In a state
    const [propValue, setPropValue] = useState(props.data)
    // Or basic variable
    let value = props.value

    // Usage of custom hooks example
    const alertHook = useAlert()
    alertHook.show("This will create an alert!")

    // UseEffect = ComponentDidMount
    // All logic done inside will be applied to states before render of JSX
    useEffect(() => {
        if(refresh) {
            // Do something new
        }
    }, [props, refresh]) // Rerender array. If any of these update, run useEffect and rerender

    return (
        // See Bootstrap documentation for more className presets
        <div className="card-body bg-white m-3 shadow-sm rounded">
            {/* JSX elements here */}
        </div>
    )
}

export default Example // Export to grant other files access to this file

// To use the component in a different file
import Example from './exampleFile'
// The tags inside are the prop values, the attribute names define the prop value field names
<Example props={props} value={value} data={data}/>
```

<a name="lifting_up_states_in_react_example"/>

#### Lifting up states in React (Example)

In React, it's easy to pass states down to different components, and here is the trick to pass states from a child component to a parent component, or in other words pass a state upward:

```JS
// In child component:
const ChildComponent = (props) => {
    const [state, setState] = useState(0) // Create a standard number state
    setState(1) // Set the new state
    props.liftState(state) // Call the function passed with the props
}
export default ChildComponent

// In parent component:
const ParentComponent = (props) => {
    const [childState, setChildState] = useState(0) // Create a state that will hold child state
    const liftState = (childData) => { // Create a function that takes the child data as parameter
        setChildState(childData) // if called we will set the parent state based on child state
    }

    return (
        // Send the liftState function down to the child component
        <ChildComponent liftState={liftState}>
    )
}
```

<a name="production_tech_stack_and_server_maintenance"/>

### Production Tech Stack and server maintenance

<a name="tech_stack_running_on_production"/>

#### Tech stack, running on production

Dokuly runs on the Django framework, where different entities are their own Django application, including the frontend. From top to bottom:

1. Frontend
   Technologies: React Redux (Mix of hooks and classes) and Bootstrap CSS
   Package manager: Node.js and npm

2. Middleware
   Standard Django middleware, configured in the settings.py file, found at ./dokuly/dokuly/

3. Backend
   Technologies: Django
   Package manager: pip and choco

4. Database
   Technologies: PostgreSQL

<a name="current_maintenance"/>

#### Current Maintenance

1. Github CI for main entry point errors, Django testing and commit linting

2. git_fetch_script.sh and Crontab is setup server side to check for updates. Crontab is a Linux job scheduler and runs the git_fetch_script every minute. We run `git fetch` and if a change is detected on master we reset the head to the local branch, kill the running server and restart it.

<a name="testing_the_code"/>

## Testing the Code

<a name="testing_of_generic_python_functions"/>

### Testing of generic Python functions

A GitHub action for Python doctests is set up, as in the example `under.def col_to_list(column_name, dict_reader_obj, skip_rows=0)`:

```python
def col_to_list(column_name, dict_reader_obj, skip_rows=0):
    Extract a column from a DictReader object.
    This function iterates over the object and essentially consumates it.
    The function can only by tun once on a DataReader object.
    :param column_name: Name of the column.
    :type column_name: str
    :param dict_reader_obj: "dataframe"
    :type dict_reader_obj: DictReader
    :return: the column as a list.
    :rtype: [str]
    ## Example
    >>> csv_file = open('./tests/data/fusion360Bom.csv')
    >>> df=csv.DictReader(csv_file, delimiter=',')
    >>> mpn_list = col_to_list('MPN', df)
    >>> print(mpn_list)
    ['RCS06030000Z0EA', 'CRCW06031K00FKEAC', '', 'FCR7350B', 'FCR7350R', '5-146280-4', '', '', '', '', 'KPT-1608EC', 'PCB1221A']
    >>> csv_file.close()
```

1. Create a doctest for a function.
2. Add the following at the bottom of the file:

   ```python
   if __name__ == "__main__":
       import doctest
       doctest.testmod()
   ```

3. Add a run of the Python file in the shell script `test/python_test.sh`

<a name="create_a_copy_of_the_database_on_local_server"/>

## Create a copy of the database on local server

```bash
docker exec -t sdp_db_OSS pg_dump -U postgres DokulyOSS > local_backup.sql
```

<a name="update_db_through_pg_admin"/>

## Update DB through PG Admin

If the IDs are reset, they can be corrected through this interface.

```SQL
SELECT setval('nd.timetracking_employeetime_id_seq', (SELECT MAX(id) FROM nd.timetracking_employeetime)+1);
```

<a name="set_up_pg_admin_locally"/>

## Set up PG Admin locally

<img width="371" alt="image" src="https://user-images.githubusercontent.com/50493445/224538415-de490828-e79b-465a-bbd8-9925374435d0.png">

<img width="694" alt="image" src="https://user-images.githubusercontent.com/50493445/224538399-991bb2d8-b84e-436d-ab33-9750826a9331.png">
