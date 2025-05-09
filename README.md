# OMNI-SYS

## Setup Instructions

### 1. Create and Activate a Virtual Environment (Linux)

```bash
python3 -m venv env
source env/bin/activate
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
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
python manage.py runserver 0.0.0.0:8000
```
open http://172.21.71.192:28000 in browser


### Run React Frontend
From the /frontend directory:

```bash
npm run dev -- --host
```
open http://172.21.71.192:25173 in browser



### Systemd Automatically start
Start Frontend and Backend both with one command 

```bash
./start-myproject.sh
```

Or start Frontend and Backend separately using:

```bash
sudo systemctl start kap-project-backend
sudo systemctl start kap-project-frontend
```

To check their status:

```bash
sudo systemctl status kap-project-backend
sudo systemctl status kap-project-frontend
```

Stop services:

```bash
sudo systemctl stop kap-project-backend
sudo systemctl stop kap-project-frontend
```