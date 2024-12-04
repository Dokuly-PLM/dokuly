# Quickstart

Make sure docker and other dependencies are installed.
To find the dependencies take a look at the **Installation** tab in the top navbar.
Then follow these steps:

#### Create a .env file (it can be left empty)

Then set a value within the string quotes.
Next; Build the project. This can be done using

```bash
docker compose -f docker-compose-dev.yml build
```

or for mac / linux:

```bash
docker compose -f docker-compose-dev-mac.yml build
```

#### Build frontend using npm

```bash
npm i
```

```bash
npm run build
```

#### Run the project

Run migrations

```bash
docker compose -f docker-compose-dev.yml run web python /dokuly_image/dokuly/manage.py migrate
```

```bash
docker compose -f docker-compose-dev.yml up
```

#### Access dokuly

In your web browser, dokuly can be accessed at

[http://oss.dokuly.localhost:8000](http://oss.dokuly.localhost:8000).

#### Logging in for the first time on localhost

The PLM comes with some default data. A user is created with the username "ossuser" and password: "oss_password".
This can be used to login with for the first time to start using and configuring dokuly for your use-case.

<a name="setup_selfhost" />

## Configure self hosting of Dokuly

To start hosting the service on your own machine you have to have all dependencies installed. This includes docker and node. See the table of contents for more information on installing these dependencies. 
<a name="nginx_proxy" />

### Nginx proxy

### Local Hosting Setup Guide

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