# Installation guide

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