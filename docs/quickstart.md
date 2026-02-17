# Quickstart

Make sure docker and other dependencies are installed.
To find the dependencies take a look at the <a href="/installation">**Installation guide**</a> tab in the top navbar.
Then follow these steps:

<ol>
  <li>
    <strong>Create a .env file:</strong> 
    <p>It can be left empty.</p>
  </li>
  <li>
    <strong>Build the project:</strong>
    <p>In the root of the project, run:</p>
    <pre><code>docker compose -f docker-compose-dev.yml build</code></pre>
    <p>Or for Mac/Linux, use:</p>
    <pre><code>docker compose -f docker-compose-dev-mac.yml build</code></pre>
  </li>
  <li>
    <strong>Build the frontend:</strong>
    <p>Install dependencies and build (requires <a href="https://bun.sh" target="_blank">Bun</a>):</p>
    <pre><code>bun install</code></pre>
    <pre><code>bun run build</code></pre>
  </li>
  <li>
    <strong>Run the project:</strong>
    <p>First, in the root of the project, run:</p>
    <pre><code>docker compose -f docker-compose-dev.yml run web python /dokuly_image/dokuly/manage.py migrate</code></pre>
    <p>Then, start the local server using:</p>
    <pre><code>docker compose -f docker-compose-dev.yml up</code></pre>
  </li>
  <li>
    <strong>Access Dokuly:</strong>
    <p>In your web browser, access Dokuly at:
      <a href="http://localhost:8000" target="_blank">http://localhost:8000</a>
    </p>
  </li>
  <li>
    <strong>Log in for the first time:</strong>
    <p>Dokuly comes with default data. Use the following credentials to log in for the first time:</p>
    <ul>
      <li>Username: <code>ossuser</code></li>
      <li>Password: <code>oss_password</code></li>
    </ul>
    <p>You can now start using and configuring Dokuly for your use case.</p>
  </li>
</ol>

---

<a name="setup_selfhost" />

## Configure self hosting of Dokuly

To start hosting the service on your own machine you have to have all dependencies installed. This includes docker and Bun. See the table of contents for more information on installing these dependencies. 
<a name="nginx_proxy" />

### Nginx proxy

### Local Hosting Setup Guide

To enable access to your locally hosted project on your local network or VPN, follow these steps to configure an NGINX proxy. Directly using your machine's local IP address might not suffice, hence the need for these adjustments:

<ol>
  <li>
    <strong>Locate the NGINX Configuration:</strong>
    <p>Navigate to the <code>nginx</code> folder where crucial configuration files reside.</p>
  </li>
  <li>
    <strong>Edit the Configuration File:</strong>
    <p>Within the <code>nginx</code> folder, find and open the <code>nginx.conf</code> file for editing:</p>
    <ul>
      <li>
        <strong>Update IP Address:</strong>
        <p>Search for a line starting with <code>server_name</code>, typically containing an IP like <code>10.0.0.21</code>. Replace it with your machine's local network IP. To find your IP address:</p>
        <ul>
          <li>
            <strong>On Linux/Mac:</strong> Open a terminal and enter:
            <pre><code>ifconfig</code></pre>
          </li>
          <li>
            <strong>On Windows:</strong> Open Command Prompt and type:
            <pre><code>ipconfig</code></pre>
          </li>
        </ul>
        <p>Look for the IPv4 address under your network connection, usually formatted as <code>192.168.x.x</code>.</p>
      </li>
      <li>
        <strong>Set Project Name:</strong>
        <p>Locate the line <code>proxy_set_header Host</code> and change the adjacent value to your project's name. If you haven't set up a project name, run the <code>self_host_create_new_tenant</code> script.</p>
      </li>
    </ul>
  </li>
  <li>
    <strong>Save and Close:</strong>
    <p>After making the necessary edits, save the changes and close the <code>nginx.conf</code> file.</p>
  </li>
  <li>
    <strong>Restart NGINX:</strong>
    <p>To apply your changes, execute the <code>self_host_restart.ps1</code> script located in the <code>self_hosting</code> folder.</p>
  </li>
</ol>


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