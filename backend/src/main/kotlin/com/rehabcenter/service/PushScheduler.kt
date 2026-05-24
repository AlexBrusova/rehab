package com.rehabcenter.service

import com.rehabcenter.repo.PhoneRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalTime
import java.time.format.DateTimeParseException

@Component
class PushScheduler(
    private val phones: PhoneRepository,
    private val push: PushSender,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    fun checkLatePhones() {
        val now = LocalTime.now()
        val active = phones.findAllActiveWithPatient()
        for (phone in active) {
            if (phone.late) continue
            val returnBy = try {
                LocalTime.parse(phone.returnBy)
            } catch (_: DateTimeParseException) {
                continue
            }
            if (now.isAfter(returnBy)) {
                phone.late = true
                phones.save(phone)
                val houseId = phone.patient?.houseId ?: continue
                val patientName = phone.patient?.name ?: "Patient"
                push.sendToHouse(
                    houseId,
                    title = "📱 Phone Not Returned",
                    body = "$patientName has not returned their phone (due ${ phone.returnBy})",
                    url = "/phones",
                )
                log.info("Late phone notification sent for patient {} house {}", phone.patientId, houseId)
            }
        }
    }
}
