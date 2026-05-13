package com.rehabcenter.testsupport

import org.testcontainers.DockerClientFactory

object DockerEnv {
    @JvmStatic
    fun dockerAvailable(): Boolean =
        try {
            DockerClientFactory.instance().isDockerAvailable
        } catch (_: Throwable) {
            false
        }
}
