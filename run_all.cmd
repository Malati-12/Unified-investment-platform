@echo off
echo ===================================================
echo   Starting Unified Investment Platform (Fullstack)
echo ===================================================
echo.

:: Start Spring Boot Backend in a separate window
echo [1/2] Starting Spring Boot Backend (Port 8085)...
start "UIP Backend" cmd /c "cd backend && set MAVEN_OPTS=-Djavax.net.ssl.trustStore=custom_cacerts -Djavax.net.ssl.trustStorePassword=changeit && mvnw.cmd spring-boot:run"

:: Start Vite React Frontend in a separate window
echo [2/2] Starting React Frontend (Port 5173)...
start "UIP Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Success! Services are spinning up:
echo   - Backend:  http://localhost:8085
echo   - Frontend: http://localhost:5173
echo ===================================================
echo.
echo Press any key to exit this launcher window.
pause
