package com.rehabcenter.testsupport

import com.rehabcenter.bootstrap.RehabSeedContent
import com.rehabcenter.repo.AbsenceRepository
import com.rehabcenter.repo.CashboxCountRepository
import com.rehabcenter.repo.CashboxEntryRepository
import com.rehabcenter.repo.ConsequenceRepository
import com.rehabcenter.repo.CounselorScheduleRepository
import com.rehabcenter.repo.DailySummaryRepository
import com.rehabcenter.repo.FinanceRepository
import com.rehabcenter.repo.HouseRepository
import com.rehabcenter.repo.MedDistributionRepository
import com.rehabcenter.repo.MedRepository
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.repo.PhoneRepository
import com.rehabcenter.repo.ResidentGroupRepository
import com.rehabcenter.repo.RoomRepository
import com.rehabcenter.repo.ShiftDistRepository
import com.rehabcenter.repo.ShiftRepository
import com.rehabcenter.repo.TherapistAssignmentRepository
import com.rehabcenter.repo.TherapySessionRepository
import com.rehabcenter.repo.UserRepository
import org.springframework.beans.factory.ObjectProvider
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.cache.CacheManager
import org.springframework.context.annotation.Bean
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.support.TransactionTemplate

@TestConfiguration
class TestSupportConfig {
    @Bean
    fun integrationTestFixture(
        houses: HouseRepository,
        rooms: RoomRepository,
        users: UserRepository,
        patients: PatientRepository,
        meds: MedRepository,
        shifts: ShiftRepository,
        consequences: ConsequenceRepository,
        phones: PhoneRepository,
        medDistributions: MedDistributionRepository,
        shiftDist: ShiftDistRepository,
        dailySummaries: DailySummaryRepository,
        therapySessions: TherapySessionRepository,
        therapistAssignments: TherapistAssignmentRepository,
        absences: AbsenceRepository,
        finances: FinanceRepository,
        cashboxCounts: CashboxCountRepository,
        cashboxEntries: CashboxEntryRepository,
        residentGroups: ResidentGroupRepository,
        schedules: CounselorScheduleRepository,
        passwordEncoder: PasswordEncoder,
        transactionTemplate: TransactionTemplate,
        cacheManager: ObjectProvider<CacheManager>,
    ): IntegrationTestFixture =
        IntegrationTestFixture(
            houses,
            rooms,
            users,
            patients,
            meds,
            shifts,
            consequences,
            phones,
            medDistributions,
            shiftDist,
            dailySummaries,
            therapySessions,
            therapistAssignments,
            absences,
            finances,
            cashboxCounts,
            cashboxEntries,
            residentGroups,
            schedules,
            passwordEncoder,
            transactionTemplate,
            cacheManager,
        )
}

class IntegrationTestFixture(
    private val houses: HouseRepository,
    private val rooms: RoomRepository,
    private val users: UserRepository,
    private val patients: PatientRepository,
    private val meds: MedRepository,
    private val shifts: ShiftRepository,
    private val consequences: ConsequenceRepository,
    private val phones: PhoneRepository,
    private val medDistributions: MedDistributionRepository,
    private val shiftDist: ShiftDistRepository,
    private val dailySummaries: DailySummaryRepository,
    private val therapySessions: TherapySessionRepository,
    private val therapistAssignments: TherapistAssignmentRepository,
    private val absences: AbsenceRepository,
    private val finances: FinanceRepository,
    private val cashboxCounts: CashboxCountRepository,
    private val cashboxEntries: CashboxEntryRepository,
    private val residentGroups: ResidentGroupRepository,
    private val schedules: CounselorScheduleRepository,
    private val passwordEncoder: PasswordEncoder,
    private val transactionTemplate: TransactionTemplate,
    private val cacheManager: ObjectProvider<CacheManager>,
) {
    fun resetAndSeed() {
        cacheManager.ifAvailable { cm ->
            cm.cacheNames.forEach { name -> cm.getCache(name)?.clear() }
        }
        transactionTemplate.executeWithoutResult {
            dailySummaries.deleteAll()
            therapySessions.deleteAll()
            therapistAssignments.deleteAll()
            absences.deleteAll()
            finances.deleteAll()
            cashboxCounts.deleteAll()
            cashboxEntries.deleteAll()
            residentGroups.deleteAll()
            schedules.deleteAll()
            consequences.deleteAll()
            phones.deleteAll()
            medDistributions.deleteAll()
            shiftDist.deleteAll()
            shifts.deleteAll()
            meds.deleteAll()
            patients.deleteAll()
            users.deleteAll()
            rooms.deleteAll()
            houses.deleteAll()
            RehabSeedContent.seed(
                houses = houses,
                rooms = rooms,
                users = users,
                patients = patients,
                meds = meds,
                shifts = shifts,
                consequences = consequences,
                phones = phones,
                passwordEncoder = passwordEncoder,
                finances = finances,
                cashboxEntries = cashboxEntries,
                cashboxCounts = cashboxCounts,
                schedules = schedules,
                dailySummaries = dailySummaries,
                therapistAssignments = therapistAssignments,
                therapySessions = therapySessions,
                residentGroups = residentGroups,
            )
        }
    }
}
