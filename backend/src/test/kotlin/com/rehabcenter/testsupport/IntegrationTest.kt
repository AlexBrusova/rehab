package com.rehabcenter.testsupport

import org.junit.jupiter.api.condition.EnabledIf
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles
import java.lang.annotation.Inherited
import kotlin.annotation.AnnotationRetention
import kotlin.annotation.AnnotationTarget
import kotlin.annotation.Retention
import kotlin.annotation.Target

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Inherited
/** Spring Boot + PostgreSQL (Testcontainers). Без Docker JVM все интеграционные тесты с этой аннотацией пропускаются (`@EnabledIf`). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestSupportConfig::class, PostgresTestContainerConfiguration::class)
@EnabledIf("com.rehabcenter.testsupport.DockerEnv#dockerAvailable")
annotation class IntegrationTest
