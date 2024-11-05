cd ..

try {
    # Check for Node.js
    $nodeVersion = Get-Command "node" -ErrorAction Stop
    Write-Host "Node.js is installed. Version: " -NoNewline; node --version

    # Check for npm
    $npmVersion = Get-Command "npm" -ErrorAction Stop
    Write-Host "npm is installed. Version: " -NoNewline; npm --version

} catch {
    Write-Host "Error: $_.Exception.Message"
    Write-Host "Make sure Node.js and npm are installed and added to the PATH."
}

# Build the frontend for selvhosting
npm run build

# Build the docker, migrate the server and run the server
docker compose -f docker-compose-dev.yml build
docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py flush
docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py makemigrations
docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py migrate
docker compose -f docker-compose-dev.yml up