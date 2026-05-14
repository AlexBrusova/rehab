package com.rehabcenter.bootstrap

import com.rehabcenter.domain.AppUser
import com.rehabcenter.domain.CashboxCount
import com.rehabcenter.domain.CashboxEntry
import com.rehabcenter.domain.Consequence
import com.rehabcenter.domain.CounselorSchedule
import com.rehabcenter.domain.DailySummary
import com.rehabcenter.domain.Finance
import com.rehabcenter.domain.GroupAttendance
import com.rehabcenter.domain.GroupAttendanceId
import com.rehabcenter.domain.House
import com.rehabcenter.domain.Med
import com.rehabcenter.domain.Patient
import com.rehabcenter.domain.Phone
import com.rehabcenter.domain.ResidentGroup
import com.rehabcenter.domain.Room
import com.rehabcenter.domain.Shift
import com.rehabcenter.domain.TherapistAssignment
import com.rehabcenter.domain.TherapySession
import com.rehabcenter.domain.UserHouseAccess
import com.rehabcenter.domain.UserHouseAccessId
import com.rehabcenter.repo.CashboxCountRepository
import com.rehabcenter.repo.CashboxEntryRepository
import com.rehabcenter.repo.ConsequenceRepository
import com.rehabcenter.repo.CounselorScheduleRepository
import com.rehabcenter.repo.DailySummaryRepository
import com.rehabcenter.repo.FinanceRepository
import com.rehabcenter.repo.HouseRepository
import com.rehabcenter.repo.MedRepository
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.repo.PhoneRepository
import com.rehabcenter.repo.ResidentGroupRepository
import com.rehabcenter.repo.RoomRepository
import com.rehabcenter.repo.ShiftRepository
import com.rehabcenter.repo.TherapistAssignmentRepository
import com.rehabcenter.repo.TherapySessionRepository
import com.rehabcenter.repo.UserRepository
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.cache.CacheManager
import org.springframework.context.annotation.Profile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.format.DateTimeFormatter

/**
 * Демо-данные и те же тестовые учётные записи, что в прежнем Prisma seed (`db/`, пароль **1234** для всех).
 * В Docker-профиле вызывается один раз при пустой таблице [User].
 */
@Component
@Profile("docker")
class RehabDemoSeeder(
    private val houses: HouseRepository,
    private val rooms: RoomRepository,
    private val users: UserRepository,
    private val patients: PatientRepository,
    private val meds: MedRepository,
    private val shifts: ShiftRepository,
    private val consequences: ConsequenceRepository,
    private val phones: PhoneRepository,
    private val finances: FinanceRepository,
    private val cashboxEntries: CashboxEntryRepository,
    private val cashboxCounts: CashboxCountRepository,
    private val schedules: CounselorScheduleRepository,
    private val dailySummaries: DailySummaryRepository,
    private val therapistAssignments: TherapistAssignmentRepository,
    private val therapySessions: TherapySessionRepository,
    private val residentGroups: ResidentGroupRepository,
    private val passwordEncoder: PasswordEncoder,
    private val cacheManager: CacheManager,
) : ApplicationRunner {

    @Transactional
    override fun run(args: ApplicationArguments) {
        if (users.count() > 0L) return
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
        cacheManager.getCache("houses")?.clear()
    }
}

object RehabSeedContent {
    private val ukDate: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val ukShort: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM")

    @Suppress("LongMethod")
    fun seed(
        houses: HouseRepository,
        rooms: RoomRepository,
        users: UserRepository,
        patients: PatientRepository,
        meds: MedRepository,
        shifts: ShiftRepository,
        consequences: ConsequenceRepository,
        phones: PhoneRepository,
        passwordEncoder: PasswordEncoder,
        finances: FinanceRepository,
        cashboxEntries: CashboxEntryRepository,
        cashboxCounts: CashboxCountRepository,
        schedules: CounselorScheduleRepository,
        dailySummaries: DailySummaryRepository,
        therapistAssignments: TherapistAssignmentRepository,
        therapySessions: TherapySessionRepository,
        residentGroups: ResidentGroupRepository,
    ) {
        val now = Instant.now()
        val hash = passwordEncoder.encode("1234")
        val localDate = java.time.LocalDate.now()
        val todayIso = localDate.toString()
        val todayUk = localDate.format(ukDate)
        val todayShort = localDate.format(ukShort)
        val y1 = localDate.minusDays(1)
        val y2 = localDate.minusDays(2)
        val y3 = localDate.minusDays(3)
        val yesterdayIso = y1.toString()
        val yesterdayUk = y1.format(ukDate)
        val yesterdayShort = y1.format(ukShort)
        val d2Uk = y2.format(ukDate)
        val d2Short = y2.format(ukShort)
        val d3Uk = y3.format(ukDate)
        val d3Short = y3.format(ukShort)
        val tomorrowIso = localDate.plusDays(1).toString()

        houses.saveAll(
            listOf(
                House("h1", "House A", "Tel Aviv", "#0d7377", now, now),
                House("h2", "House B", "Haifa", "#1e5fa8", now, now),
                House("h3", "House C", "Jerusalem", "#5c2d91", now, now),
            ),
        )

        rooms.saveAll(
            listOf(
                Room("r1", "Room 1", "Building A", 2, "h1", null, now),
                Room("r2", "Room 2", "Building A", 2, "h1", null, now),
                Room("r3", "Room 3", "Building A", 2, "h1", null, now),
                Room("r5", "Room 1", "Building A", 2, "h2", null, now),
                Room("r7", "Room 1", "Main Building", 2, "h3", null, now),
            ),
        )

        data class U(
            val id: String,
            val username: String,
            val name: String,
            val role: String,
            val roleLabel: String,
            val initials: String,
            val color: String,
            val allHousesAccess: Boolean,
            val houseId: String?,
            val allowed: List<String>,
        )

        val defs =
            listOf(
                U("u1", "org_manager1", "Jonathan Barak", "org_manager", "Org Manager", "JB", "#1e5fa8", true, null, listOf("h1", "h2", "h3")),
                U("u8", "org_manager2", "Tal Abramowitz", "org_manager", "Org Manager", "TA", "#1e5fa8", true, null, listOf("h1", "h2", "h3")),
                U("u2", "manager1", "Dana Katz", "manager", "House Manager", "DK", "#0d7377", false, "h1", listOf("h1")),
                U("u3", "manager2", "Rami Shapira", "manager", "House Manager", "RS", "#1e5fa8", false, "h2", listOf("h2", "h3")),
                U("u9", "manager3", "Liat Golan", "manager", "House Manager", "LG", "#5c2d91", false, "h3", listOf("h1", "h2", "h3")),
                U("u4", "counselor1", "Amir Menachem", "counselor", "Counselor", "AM", "#0d7377", false, null, listOf("h1", "h2")),
                U("u5", "counselor2", "Miriam Saad", "counselor", "Counselor", "MS", "#0d7377", false, null, listOf("h1")),
                U("u10", "counselor3", "Gil Bernstein", "counselor", "Counselor", "GB", "#0d7377", false, null, listOf("h1")),
                U("u11", "counselor4", "Shira Levi", "counselor", "Counselor", "SL", "#1e5fa8", false, null, listOf("h2")),
                U("u12", "counselor5", "Avi Cohen", "counselor", "Counselor", "AC", "#1e5fa8", false, null, listOf("h2", "h3")),
                U("u13", "counselor6", "Rachel David", "counselor", "Counselor", "RD", "#5c2d91", false, null, listOf("h3")),
                U("u14", "counselor7", "Noam Israeli", "counselor", "Counselor", "NI", "#5c2d91", false, null, listOf("h3")),
                U("u6", "doctor1", "Dr. Sarah Levi", "doctor", "Doctor", "SL", "#5c2d91", true, null, listOf("h1", "h2", "h3")),
                U("u7", "therapist1", "Naama Golan", "therapist", "Therapist", "NG", "#c55a11", false, "h1", listOf("h1", "h2")),
            )

        for (d in defs) {
            val u =
                AppUser(
                    id = d.id,
                    username = d.username,
                    passwordHash = hash,
                    name = d.name,
                    role = d.role,
                    roleLabel = d.roleLabel,
                    initials = d.initials,
                    color = d.color,
                    phone = null,
                    allHousesAccess = d.allHousesAccess,
                    houseId = d.houseId,
                    createdAt = now,
                    updatedAt = now,
                )
            u.allowedHouses.clear()
            for (hid in d.allowed) {
                u.allowedHouses.add(UserHouseAccess(UserHouseAccessId(d.id, hid), u))
            }
            users.save(u)
        }

        patients.saveAll(
            listOf(
                Patient(
                    id = "p1",
                    name = "Abraham Cohen",
                    dob = "15/03/1985",
                    admitDate = "03/02/2025",
                    daysInRehab = 95,
                    mood = 8,
                    roomId = "r1",
                    houseId = "h1",
                    patientRecordStatus = "active",
                    alert = false,
                    dischargeType = null,
                    dischargeDate = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Patient(
                    id = "p2",
                    name = "Yossi Levi",
                    dob = "22/07/1990",
                    admitDate = "01/04/2025",
                    daysInRehab = 37,
                    mood = 5,
                    roomId = "r2",
                    houseId = "h1",
                    patientRecordStatus = "active",
                    alert = false,
                    dischargeType = null,
                    dischargeDate = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Patient(
                    id = "p3",
                    name = "Yael Shemesh",
                    dob = "08/11/1995",
                    admitDate = "17/04/2025",
                    daysInRehab = 21,
                    mood = 6,
                    roomId = "r3",
                    houseId = "h1",
                    patientRecordStatus = "active",
                    alert = true,
                    dischargeType = null,
                    dischargeDate = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Patient(
                    id = "p16",
                    name = "Assaf Biton",
                    dob = "05/05/1990",
                    admitDate = "10/02/2025",
                    daysInRehab = 88,
                    mood = 7,
                    roomId = "r5",
                    houseId = "h2",
                    patientRecordStatus = "active",
                    alert = false,
                    dischargeType = null,
                    dischargeDate = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Patient(
                    id = "p31",
                    name = "Shlomo Golan",
                    dob = "04/07/1987",
                    admitDate = "17/02/2025",
                    daysInRehab = 81,
                    mood = 7,
                    roomId = "r7",
                    houseId = "h3",
                    patientRecordStatus = "active",
                    alert = false,
                    dischargeType = null,
                    dischargeDate = null,
                    createdAt = now,
                    updatedAt = now,
                ),
            ),
        )

        meds.saveAll(
            listOf(
                Med(
                    id = "m1",
                    patientId = "p1",
                    name = "Methadone",
                    dose = "40",
                    unit = "mg",
                    times = listOf("morning"),
                    startDate = null,
                    endDate = null,
                    prescribedBy = null,
                    notes = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Med(
                    id = "m-demo-2",
                    patientId = "p1",
                    name = "Quetiapine",
                    dose = "50",
                    unit = "mg",
                    times = listOf("evening"),
                    startDate = null,
                    endDate = null,
                    prescribedBy = "Dr. Sarah Levi",
                    notes = "Take with food",
                    createdAt = now,
                    updatedAt = now,
                ),
                Med(
                    id = "m4",
                    patientId = "p2",
                    name = "Clonazepam",
                    dose = "0.5",
                    unit = "mg",
                    times = listOf("morning", "noon"),
                    startDate = null,
                    endDate = null,
                    prescribedBy = null,
                    notes = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Med(
                    id = "m-demo-5",
                    patientId = "p2",
                    name = "Antabuse",
                    dose = "250",
                    unit = "mg",
                    times = listOf("morning"),
                    startDate = null,
                    endDate = null,
                    prescribedBy = null,
                    notes = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Med(
                    id = "m-demo-6",
                    patientId = "p3",
                    name = "Naltrexone",
                    dose = "50",
                    unit = "mg",
                    times = listOf("morning"),
                    startDate = null,
                    endDate = null,
                    prescribedBy = null,
                    notes = null,
                    createdAt = now,
                    updatedAt = now,
                ),
            ),
        )

        shifts.saveAll(
            listOf(
                Shift(
                    id = "s-demo-1",
                    houseId = "h1",
                    counselorId = "u4",
                    date = todayIso,
                    shift = "24h",
                    status = "ACTIVE",
                    note = "Current demo shift",
                    receivedFrom = null,
                    handedTo = null,
                    accepted = true,
                    start = "08:00",
                    end = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Shift(
                    id = "s-demo-2",
                    houseId = "h1",
                    counselorId = "u5",
                    date = yesterdayIso,
                    shift = "24h",
                    status = "completed",
                    note = "Handover OK",
                    receivedFrom = "u10",
                    handedTo = "u4",
                    accepted = true,
                    start = "08:00",
                    end = "08:00",
                    createdAt = now,
                    updatedAt = now,
                ),
                Shift(
                    id = "s-demo-3",
                    houseId = "h1",
                    counselorId = "u10",
                    date = tomorrowIso,
                    shift = "24h",
                    status = "pending",
                    note = null,
                    receivedFrom = null,
                    handedTo = null,
                    accepted = false,
                    start = null,
                    end = null,
                    createdAt = now,
                    updatedAt = now,
                ),
            ),
        )

        consequences.saveAll(
            listOf(
                Consequence(
                    id = "c-demo-1",
                    patientId = "p1",
                    houseId = "h1",
                    type = "verbal_warning",
                    description = "Demo consequence — pending approval",
                    date = todayUk,
                    status = "pending",
                    approvedBy = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                Consequence(
                    id = "c-demo-2",
                    patientId = "p2",
                    houseId = "h1",
                    type = "written_warning",
                    description = "Late to group — approved",
                    date = yesterdayUk,
                    status = "approved",
                    approvedBy = "u2",
                    createdAt = now,
                    updatedAt = now,
                ),
            ),
        )

        phones.saveAll(
            listOf(
                Phone(
                    id = "ph-demo-1",
                    patientId = "p2",
                    givenAt = "10:00",
                    returnBy = "11:00",
                    returnedAt = null,
                    late = false,
                    status = "active",
                    createdAt = now,
                ),
                Phone(
                    id = "ph-demo-2",
                    patientId = "p1",
                    givenAt = "09:15",
                    returnBy = "09:45",
                    returnedAt = "09:40",
                    late = false,
                    status = "returned",
                    createdAt = now,
                ),
                Phone(
                    id = "ph-demo-3",
                    patientId = "p3",
                    givenAt = "14:00",
                    returnBy = "15:00",
                    returnedAt = "15:12",
                    late = true,
                    status = "returned",
                    createdAt = now,
                ),
            ),
        )

        finances.saveAll(
            listOf(
                Finance(
                    id = "f-p1-001",
                    patientId = "p1",
                    type = "deposit",
                    amount = 500,
                    source = "Family",
                    note = "Initial deposit",
                    date = d3Uk,
                    balance = 500,
                    createdAt = now,
                ),
                Finance(
                    id = "f-p1-002",
                    patientId = "p1",
                    type = "withdrawal",
                    amount = 120,
                    source = "Personal",
                    note = "Weekly allowance",
                    date = d2Uk,
                    balance = 380,
                    createdAt = now,
                ),
                Finance(
                    id = "f-p1-003",
                    patientId = "p1",
                    type = "deposit",
                    amount = 200,
                    source = "Family",
                    note = "Top-up",
                    date = yesterdayUk,
                    balance = 580,
                    createdAt = now,
                ),
                Finance(
                    id = "f-p2-001",
                    patientId = "p2",
                    type = "deposit",
                    amount = 300,
                    source = "Family",
                    note = "Demo balance",
                    date = d2Uk,
                    balance = 300,
                    createdAt = now,
                ),
                Finance(
                    id = "f-p2-002",
                    patientId = "p2",
                    type = "withdrawal",
                    amount = 50,
                    source = "Canteen",
                    note = "Snacks",
                    date = yesterdayUk,
                    balance = 250,
                    createdAt = now,
                ),
                Finance(
                    id = "f-p16-001",
                    patientId = "p16",
                    type = "deposit",
                    amount = 150,
                    source = "Family",
                    note = "House B demo",
                    date = todayUk,
                    balance = 150,
                    createdAt = now,
                ),
            ),
        )

        cashboxEntries.saveAll(
            listOf(
                CashboxEntry(
                    id = "cb-demo-1",
                    houseId = "h1",
                    type = "deposit",
                    amount = 2000,
                    cat = "Family",
                    note = "Float top-up",
                    date = d3Uk,
                    time = "09:00",
                    byStaff = "Dana Katz",
                    balance = 2000,
                    createdAt = now,
                ),
                CashboxEntry(
                    id = "cb-demo-2",
                    houseId = "h1",
                    type = "withdrawal",
                    amount = 350,
                    cat = "Supplies",
                    note = "Kitchen supplies",
                    date = d2Uk,
                    time = "11:30",
                    byStaff = "Amir Menachem",
                    balance = 1650,
                    createdAt = now,
                ),
                CashboxEntry(
                    id = "cb-demo-3",
                    houseId = "h1",
                    type = "withdrawal",
                    amount = 150,
                    cat = "Transport",
                    note = "Taxi receipt",
                    date = yesterdayUk,
                    time = "16:00",
                    byStaff = "Miriam Saad",
                    balance = 1500,
                    createdAt = now,
                ),
            ),
        )

        cashboxCounts.save(
            CashboxCount(
                id = "cbc-demo-1",
                houseId = "h1",
                countedBy = "Dana Katz",
                amount = 1495,
                expected = 1500,
                diff = -5,
                date = yesterdayUk,
                time = "20:00",
                notes = "Minor variance — recounted twice",
                createdAt = now,
            ),
        )

        val schedCounselors = listOf("u4", "u5", "u10")
        val schedDays = listOf(1, 5, 10, 15, 20, 25).filter { it <= localDate.lengthOfMonth() }
        val scheduleRows =
            schedDays.mapIndexed { i, day ->
                val d = localDate.withDayOfMonth(day).toString()
                CounselorSchedule(
                    id = "sch-seed-h1-${localDate.year}-${localDate.monthValue}-$day",
                    houseId = "h1",
                    counselorId = schedCounselors[i % schedCounselors.size],
                    date = d,
                    shiftType = "24h",
                    note = if (day == localDate.dayOfMonth) "Today (demo)" else null,
                    createdAt = now,
                )
            }
        schedules.saveAll(scheduleRows)

        dailySummaries.saveAll(
            listOf(
                DailySummary(
                    id = "ds-demo-1",
                    counselorId = "u4",
                    houseId = "h1",
                    date = yesterdayShort,
                    generalText = "Quiet day overall; one resident needed extra check-in after lunch.",
                    patientSummaries =
                    linkedMapOf(
                        "p1" to "Participated well in morning group.",
                        "p2" to "Slightly anxious — follow up tomorrow.",
                        "p3" to "Good engagement in house chores.",
                    ),
                    notifiedAt = "20:15",
                    createdAt = now,
                ),
                DailySummary(
                    id = "ds-demo-2",
                    counselorId = "u5",
                    houseId = "h1",
                    date = d2Short,
                    generalText = "Weekly goals review completed.",
                    patientSummaries =
                    linkedMapOf(
                        "p1" to "On track with therapy homework.",
                        "p2" to "Reported better sleep.",
                    ),
                    notifiedAt = "19:45",
                    createdAt = now,
                ),
            ),
        )

        therapistAssignments.saveAll(
            listOf(
                TherapistAssignment(patientId = "p1", therapistId = "u7"),
                TherapistAssignment(patientId = "p2", therapistId = "u7"),
                TherapistAssignment(patientId = "p3", therapistId = "u7"),
                TherapistAssignment(patientId = "p16", therapistId = "u7"),
            ),
        )

        therapySessions.saveAll(
            listOf(
                TherapySession(
                    id = "ts-demo-1",
                    patientId = "p1",
                    therapistId = "u7",
                    date = yesterdayShort,
                    topic = "Emotional regulation",
                    notes = "Practiced breathing exercises; homework: journal 5 min daily.",
                    urgency = "NORMAL",
                    counselorNote = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                TherapySession(
                    id = "ts-demo-2",
                    patientId = "p1",
                    therapistId = "u7",
                    date = d2Short,
                    topic = "Family boundaries",
                    notes = "Discussed weekend visit plan.",
                    urgency = "URGENT",
                    counselorNote = "Share with house manager before Friday.",
                    createdAt = now,
                    updatedAt = now,
                ),
                TherapySession(
                    id = "ts-demo-3",
                    patientId = "p2",
                    therapistId = "u7",
                    date = todayShort,
                    topic = "Coping skills",
                    notes = "Role-play for high-risk situations.",
                    urgency = "NORMAL",
                    counselorNote = null,
                    createdAt = now,
                    updatedAt = now,
                ),
                TherapySession(
                    id = "ts-demo-4",
                    patientId = "p3",
                    therapistId = "u7",
                    date = d3Short,
                    topic = "Sleep hygiene",
                    notes = "Short session; resident tired.",
                    urgency = "NORMAL",
                    counselorNote = null,
                    createdAt = now,
                    updatedAt = now,
                ),
            ),
        )

        fun saveGroup(
            id: String,
            houseId: String,
            date: String,
            topic: String,
            leaderId: String?,
            notes: String?,
            attendance: List<Pair<String, String>>,
        ) {
            val g =
                ResidentGroup(
                    id = id,
                    houseId = houseId,
                    date = date,
                    topic = topic,
                    type = "therapeutic",
                    time = "",
                    status = "active",
                    leaderId = leaderId,
                    notes = notes,
                    createdAt = now,
                )
            for ((pid, st) in attendance) {
                val ga = GroupAttendance(id = GroupAttendanceId(id, pid), status = st)
                ga.group = g
                ga.patient = patients.getReferenceById(pid)
                g.attendance.add(ga)
            }
            residentGroups.save(g)
        }

        saveGroup(
            id = "g-demo-1",
            houseId = "h1",
            date = yesterdayIso,
            topic = "Morning honesty circle",
            leaderId = "u4",
            notes = "Demo group from seed",
            attendance =
            listOf(
                "p1" to "present",
                "p2" to "absent",
                "p3" to "present",
            ),
        )
        saveGroup(
            id = "g-demo-2",
            houseId = "h1",
            date = todayIso,
            topic = "CBT skills — triggers",
            leaderId = "u5",
            notes = "Afternoon session",
            attendance =
            listOf(
                "p1" to "present",
                "p2" to "present",
                "p3" to "absent",
            ),
        )
        saveGroup(
            id = "g-demo-3",
            houseId = "h2",
            date = todayIso,
            topic = "House B check-in",
            leaderId = "u11",
            notes = null,
            attendance = listOf("p16" to "present"),
        )
    }
}
