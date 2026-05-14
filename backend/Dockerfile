# syntax=docker/dockerfile:1
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /workspace
COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle ./gradle
RUN chmod +x gradlew
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN useradd --system --home /app --shell /usr/sbin/nologin appuser
COPY --from=builder /workspace/build/libs/rehab-backend.jar /app/app.jar
USER appuser
EXPOSE 4000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
