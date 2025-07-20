# 🔗 URL Shortener

![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)
![Docker](https://img.shields.io/badge/Dockerized-%E2%9C%94-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A simple, fully containerized URL shortener built with **Node.js**, **MySQL**, and **Docker**.  
Accepts long URLs and returns short codes. Supports redirection and tracking.

---


## App Endpoints

| Endpoint              | Method | Description                      |
| --------------------- | ------ | -------------------------------- |
| `/shorten`            | POST   | Shortens a given long URL        |
| `/u/:shortCode`       | GET    | Retrieves the original long URL  |
| `/d/:shortCode`       | GET    | Redirects to the original URL    |
| `/disk-usage`         | GET    | Returns table size and row count |


## Run with Docker Compose

```bash
docker-compose up --build -d
```

## Test the API
```bash
curl -X POST http://localhost:<port>/shorten -H "Content-Type: application/json" -d '{"url": "https://example.com"}'
```


## Useful Docker Commands

Open MySQL shell:

```bash
docker exec -it mysql-container mysql -u appuser -p
```

Check MySQL data size:
```bash
docker exec -it mysql-container du -sh /var/lib/mysql
```

Rebuild app container only:
```bash
docker-compose up --build app
```