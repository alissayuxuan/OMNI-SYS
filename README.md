# OMNI-SYS

## Prerequisites
Before running this project, you must have Docker installed. Choose **one** of these installation methods:

### 🖥️ Option 1: Docker Desktop (Recommended for most users)
1. Download Docker Desktop:
   - [Windows/Mac](https://www.docker.com/products/docker-desktop)
   - [Linux](https://docs.docker.com/desktop/install/linux-install/)
2. Install with default settings

### ⌨️ Option 2: Command Line Installation (Linux)
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

## Setup Instructions

### 1. Create and Activate a Virtual Environment (Linux)

```bash
python3 -m venv env
source env/bin/activate
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install poetry #if not installed yet
poetry install --no-root
```
#### To add any new dependencies

```bash
poetry add <package>
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Running the Application

### Run Django Backend
From the /backend directory:

```bash
python manage.py runserver
```

### Run React Frontend
From the /frontend directory:

```bash
npm run dev
```

### Run Communication System
#### 1. Launch Docker
```bash
Launch Docker Desktop and wait for it to be "ready"
```
or

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker 
```
#### 2. Start EMQX Docker Container
```bash
docker-compose up -d
```
#### 3. Run main.py
```bash
poetry run python backend/mqtt_backend/main.py
```
#### 4. Access EMQX Dashboard as Admin
Go to http://localhost:18083 and login to EMQX Dashboard with designated credentials.