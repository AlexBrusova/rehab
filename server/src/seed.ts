import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.therapistAssignment.deleteMany();
  await prisma.medDistribution.deleteMany();
  await prisma.med.deleteMany();
  await prisma.groupAttendance.deleteMany();
  await prisma.group.deleteMany();
  await prisma.phone.deleteMany();
  await prisma.consequence.deleteMany();
  await prisma.finance.deleteMany();
  await prisma.cashboxCount.deleteMany();
  await prisma.cashboxEntry.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.absenceHistory.deleteMany();
  await prisma.therapySession.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.room.deleteMany();
  await prisma.userHouseAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.house.deleteMany();

  // ── Houses ──────────────────────────────────────────────
  await prisma.house.createMany({
    data: [
      { id: "h1", name: "House A", city: "Tel Aviv",   color: "#0d7377" },
      { id: "h2", name: "House B", city: "Haifa",      color: "#1e5fa8" },
      { id: "h3", name: "House C", city: "Jerusalem",  color: "#5c2d91" },
    ],
  });
  console.log("✓ Houses");

  // ── Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("1234", 10);

  const users = [
    { id: "u1",  username: "org_manager1", name: "Jonathan Barak",   role: "org_manager" as const, roleLabel: "Org Manager",   initials: "JB", color: "#1e5fa8", allHousesAccess: true,  houseId: null,  allowedHouses: ["h1","h2","h3"] },
    { id: "u8",  username: "org_manager2", name: "Tal Abramowitz",   role: "org_manager" as const, roleLabel: "Org Manager",   initials: "TA", color: "#1e5fa8", allHousesAccess: true,  houseId: null,  allowedHouses: ["h1","h2","h3"] },
    { id: "u2",  username: "manager1",     name: "Dana Katz",        role: "manager" as const,     roleLabel: "House Manager", initials: "DK", color: "#0d7377", allHousesAccess: false, houseId: "h1", allowedHouses: ["h1"] },
    { id: "u3",  username: "manager2",     name: "Rami Shapira",     role: "manager" as const,     roleLabel: "House Manager", initials: "RS", color: "#1e5fa8", allHousesAccess: false, houseId: "h2", allowedHouses: ["h2","h3"] },
    { id: "u9",  username: "manager3",     name: "Liat Golan",       role: "manager" as const,     roleLabel: "House Manager", initials: "LG", color: "#5c2d91", allHousesAccess: false, houseId: "h3", allowedHouses: ["h1","h2","h3"] },
    { id: "u4",  username: "counselor1",   name: "Amir Menachem",    role: "counselor" as const,   roleLabel: "Counselor",     initials: "AM", color: "#0d7377", allHousesAccess: false, houseId: null,  allowedHouses: ["h1","h2"] },
    { id: "u5",  username: "counselor2",   name: "Miriam Saad",      role: "counselor" as const,   roleLabel: "Counselor",     initials: "MS", color: "#0d7377", allHousesAccess: false, houseId: null,  allowedHouses: ["h1"] },
    { id: "u10", username: "counselor3",   name: "Gil Bernstein",    role: "counselor" as const,   roleLabel: "Counselor",     initials: "GB", color: "#0d7377", allHousesAccess: false, houseId: null,  allowedHouses: ["h1"] },
    { id: "u11", username: "counselor4",   name: "Shira Levi",       role: "counselor" as const,   roleLabel: "Counselor",     initials: "SL", color: "#1e5fa8", allHousesAccess: false, houseId: null,  allowedHouses: ["h2"] },
    { id: "u12", username: "counselor5",   name: "Avi Cohen",        role: "counselor" as const,   roleLabel: "Counselor",     initials: "AC", color: "#1e5fa8", allHousesAccess: false, houseId: null,  allowedHouses: ["h2","h3"] },
    { id: "u13", username: "counselor6",   name: "Rachel David",     role: "counselor" as const,   roleLabel: "Counselor",     initials: "RD", color: "#5c2d91", allHousesAccess: false, houseId: null,  allowedHouses: ["h3"] },
    { id: "u14", username: "counselor7",   name: "Noam Israeli",     role: "counselor" as const,   roleLabel: "Counselor",     initials: "NI", color: "#5c2d91", allHousesAccess: false, houseId: null,  allowedHouses: ["h3"] },
    { id: "u6",  username: "doctor1",      name: "Dr. Sarah Levi",   role: "doctor" as const,      roleLabel: "Doctor",        initials: "SL", color: "#5c2d91", allHousesAccess: true,  houseId: null,  allowedHouses: ["h1","h2","h3"] },
    { id: "u7",  username: "therapist1",   name: "Naama Golan",      role: "therapist" as const,   roleLabel: "Therapist",     initials: "NG", color: "#c55a11", allHousesAccess: false, houseId: "h1", allowedHouses: ["h1","h2"] },
  ];

  for (const u of users) {
    const { allowedHouses, ...userData } = u;
    await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        allowedHouses: {
          create: allowedHouses.map((houseId) => ({ houseId })),
        },
      },
    });
  }
  console.log("✓ Users");

  // ── Rooms ────────────────────────────────────────────────
  await prisma.room.createMany({
    data: [
      { id: "r1",  number: "Room 1", building: "Building A",   capacity: 2, houseId: "h1" },
      { id: "r2",  number: "Room 2", building: "Building A",   capacity: 2, houseId: "h1" },
      { id: "r3",  number: "Room 3", building: "Building A",   capacity: 2, houseId: "h1" },
      { id: "r4",  number: "Room 4", building: "Building A",   capacity: 2, houseId: "h1" },
      { id: "r4b", number: "Room 5", building: "Building B",   capacity: 2, houseId: "h1" },
      { id: "r5",  number: "Room 1", building: "Building A",   capacity: 2, houseId: "h2" },
      { id: "r6",  number: "Room 2", building: "Building A",   capacity: 2, houseId: "h2" },
      { id: "r6b", number: "Room 3", building: "Building A",   capacity: 2, houseId: "h2" },
      { id: "r6c", number: "Room 4", building: "Building B",   capacity: 2, houseId: "h2" },
      { id: "r7",  number: "Room 1", building: "Main Building", capacity: 2, houseId: "h3" },
      { id: "r8",  number: "Room 2", building: "Main Building", capacity: 2, houseId: "h3" },
      { id: "r9",  number: "Room 3", building: "Main Building", capacity: 2, houseId: "h3" },
      { id: "r10", number: "Room 4", building: "Main Building", capacity: 2, houseId: "h3" },
    ],
  });
  console.log("✓ Rooms");

  // ── Patients ─────────────────────────────────────────────
  const patients = [
    { id:"p1",  name:"Abraham Cohen",    dob:"15/03/1985", admitDate:"03/02/2025", daysInRehab:95,  mood:8, roomId:"r1", houseId:"h1", status:"active"   as const },
    { id:"p2",  name:"Yossi Levi",       dob:"22/07/1990", admitDate:"01/04/2025", daysInRehab:37,  mood:5, roomId:"r2", houseId:"h1", status:"active"   as const },
    { id:"p3",  name:"Yael Shemesh",     dob:"08/11/1995", admitDate:"17/04/2025", daysInRehab:21,  mood:2, roomId:"r3", houseId:"h1", status:"active"   as const, alert:true },
    { id:"p4",  name:"David Mizrahi",    dob:"30/01/1988", admitDate:"04/03/2025", daysInRehab:64,  mood:7, roomId:"r4", houseId:"h1", status:"active"   as const },
    { id:"p5",  name:"Ron Katz",         dob:"14/05/1993", admitDate:"28/04/2025", daysInRehab:10,  mood:6, roomId:"r1", houseId:"h1", status:"active"   as const },
    { id:"p6",  name:"Sara Abraham",     dob:"03/09/1987", admitDate:"10/01/2025", daysInRehab:122, mood:7, roomId:"r2", houseId:"h1", status:"active"   as const },
    { id:"p7",  name:"Micha Shamir",     dob:"19/06/1991", admitDate:"15/02/2025", daysInRehab:83,  mood:8, roomId:"r3", houseId:"h1", status:"active"   as const },
    { id:"p8",  name:"Orit Ben David",   dob:"07/12/1989", admitDate:"20/03/2025", daysInRehab:49,  mood:4, roomId:"r4", houseId:"h1", status:"active"   as const },
    { id:"p9",  name:"Natan Peretz",     dob:"25/08/1994", admitDate:"05/04/2025", daysInRehab:33,  mood:6, roomId:"r1", houseId:"h1", status:"active"   as const },
    { id:"p10", name:"Haim Gabai",       dob:"11/02/1986", admitDate:"22/01/2025", daysInRehab:106, mood:9, roomId:"r2", houseId:"h1", status:"active"   as const },
    { id:"p11", name:"Limor Katz",       dob:"30/04/1992", admitDate:"08/04/2025", daysInRehab:30,  mood:3, roomId:"r3", houseId:"h1", status:"active"   as const, alert:true },
    { id:"p12", name:"Eran Malka",       dob:"17/09/1988", admitDate:"12/03/2025", daysInRehab:57,  mood:7, roomId:"r4", houseId:"h1", status:"active"   as const },
    { id:"p13", name:"Tal Rosen",        dob:"23/11/1996", admitDate:"02/05/2025", daysInRehab:6,   mood:5, roomId:"r1", houseId:"h1", status:"active"   as const },
    { id:"p14", name:"Galit Stern",      dob:"08/07/1991", admitDate:"19/02/2025", daysInRehab:79,  mood:8, roomId:"r2", houseId:"h1", status:"active"   as const },
    { id:"p15", name:"Yair Nahum",       dob:"14/03/1984", admitDate:"25/01/2025", daysInRehab:103, mood:6, roomId:"r3", houseId:"h1", status:"active"   as const },
    { id:"p16", name:"Assaf Biton",      dob:"05/05/1990", admitDate:"10/02/2025", daysInRehab:88,  mood:7, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p17", name:"Shoshana Mizrahi", dob:"28/08/1987", admitDate:"03/03/2025", daysInRehab:66,  mood:5, roomId:"r6", houseId:"h2", status:"active"   as const },
    { id:"p18", name:"Yaron Shalom",     dob:"16/12/1993", admitDate:"21/04/2025", daysInRehab:17,  mood:8, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p19", name:"Noa Cohen",        dob:"09/01/1995", admitDate:"07/04/2025", daysInRehab:31,  mood:3, roomId:"r6", houseId:"h2", status:"active"   as const, alert:true },
    { id:"p20", name:"Boaz Levi",        dob:"22/06/1988", admitDate:"14/01/2025", daysInRehab:114, mood:9, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p21", name:"Merav Gross",      dob:"14/10/1992", admitDate:"27/03/2025", daysInRehab:42,  mood:6, roomId:"r6", houseId:"h2", status:"active"   as const },
    { id:"p22", name:"Omer Fisher",      dob:"03/04/1991", admitDate:"06/02/2025", daysInRehab:92,  mood:7, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p23", name:"Hila Sagi",        dob:"19/07/1996", admitDate:"15/04/2025", daysInRehab:23,  mood:4, roomId:"r6", houseId:"h2", status:"active"   as const },
    { id:"p24", name:"Erez Navon",       dob:"31/05/1985", admitDate:"29/01/2025", daysInRehab:99,  mood:8, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p25", name:"Michal Dahan",     dob:"26/02/1993", admitDate:"11/03/2025", daysInRehab:58,  mood:6, roomId:"r6", houseId:"h2", status:"active"   as const },
    { id:"p26", name:"Shimon Ezra",      dob:"07/09/1989", admitDate:"24/04/2025", daysInRehab:14,  mood:5, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p27", name:"Ilana Barak",      dob:"15/11/1991", admitDate:"18/02/2025", daysInRehab:80,  mood:7, roomId:"r6", houseId:"h2", status:"active"   as const },
    { id:"p28", name:"Gadi Shemesh",     dob:"08/03/1986", admitDate:"31/01/2025", daysInRehab:97,  mood:9, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p29", name:"Rita Abutbul",     dob:"20/06/1994", admitDate:"09/04/2025", daysInRehab:29,  mood:2, roomId:"r6", houseId:"h2", status:"active"   as const, alert:true },
    { id:"p30", name:"Ziv Cohen",        dob:"12/08/1990", admitDate:"23/03/2025", daysInRehab:46,  mood:6, roomId:"r5", houseId:"h2", status:"active"   as const },
    { id:"p31", name:"Shlomo Golan",     dob:"04/07/1987", admitDate:"17/02/2025", daysInRehab:81,  mood:7, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p32", name:"Aviram Levi",      dob:"29/11/1993", admitDate:"04/04/2025", daysInRehab:34,  mood:5, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p33", name:"Nava Shapira",     dob:"13/01/1990", admitDate:"26/01/2025", daysInRehab:102, mood:8, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p34", name:"Vered Malmad",     dob:"25/09/1995", admitDate:"22/04/2025", daysInRehab:16,  mood:4, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p35", name:"Nissim Haim",      dob:"07/04/1988", admitDate:"08/02/2025", daysInRehab:90,  mood:6, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p36", name:"Anat Berger",      dob:"17/06/1992", admitDate:"16/03/2025", daysInRehab:53,  mood:7, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p37", name:"Roi Amir",         dob:"22/12/1991", admitDate:"30/01/2025", daysInRehab:99,  mood:9, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p38", name:"Mia Zahavi",       dob:"08/05/1994", admitDate:"13/04/2025", daysInRehab:25,  mood:3, roomId:"r7", houseId:"h3", status:"active"   as const, alert:true },
    { id:"p39", name:"Eli Menashe",      dob:"30/10/1986", admitDate:"19/01/2025", daysInRehab:109, mood:8, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p40", name:"Shira Nachmias",   dob:"14/08/1993", admitDate:"02/03/2025", daysInRehab:67,  mood:6, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p41", name:"Gal Omram",        dob:"03/02/1989", admitDate:"25/04/2025", daysInRehab:13,  mood:5, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p42", name:"Lilach Ben Haim",  dob:"21/07/1995", admitDate:"10/02/2025", daysInRehab:88,  mood:7, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p43", name:"Arie Kadosh",      dob:"09/04/1984", admitDate:"06/01/2025", daysInRehab:122, mood:8, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p44", name:"Hana Sabag",       dob:"18/03/1991", admitDate:"28/03/2025", daysInRehab:40,  mood:4, roomId:"r7", houseId:"h3", status:"active"   as const },
    { id:"p45", name:"Yuval Friedman",   dob:"26/11/1990", admitDate:"20/04/2025", daysInRehab:18,  mood:6, roomId:"r7", houseId:"h3", status:"active"   as const },
    // Archived
    { id:"pa1", name:"Michal David",     dob:"03/09/1987", admitDate:"10/01/2025", daysInRehab:115, mood:5, houseId:"h1", status:"archived" as const, dischargeType:"success", dischargeDate:"02/05/2025" },
    { id:"pa2", name:"Gadi Shapira",     dob:"17/02/1980", admitDate:"15/02/2025", daysInRehab:48,  mood:5, houseId:"h2", status:"archived" as const, dischargeType:"self",    dischargeDate:"03/04/2025" },
  ];

  await prisma.patient.createMany({ data: patients });
  console.log("✓ Patients");

  // ── Meds ─────────────────────────────────────────────────
  const toTimes = (m: boolean, n: boolean, e: boolean, ni: boolean) => {
    const t = [];
    if (m)  t.push("morning");
    if (n)  t.push("noon");
    if (e)  t.push("evening");
    if (ni) t.push("night");
    return t;
  };

  await prisma.med.createMany({
    data: [
      { id:"m1",  patientId:"p1", name:"Methadone",   dose:"40",   unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m2",  patientId:"p1", name:"Quetiapine",  dose:"50",   unit:"mg", times: toTimes(false,false,true,false), prescribedBy:"Dr. Levi" },
      { id:"m3",  patientId:"p1", name:"Vitamin D",   dose:"1000", unit:"IU", times: toTimes(true,false,false,false) },
      { id:"m4",  patientId:"p2", name:"Clonazepam",  dose:"0.5",  unit:"mg", times: toTimes(true,true,false,false) },
      { id:"m5",  patientId:"p2", name:"Antabuse",    dose:"250",  unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m6",  patientId:"p3", name:"Naltrexone",  dose:"50",   unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m7",  patientId:"p3", name:"Melatonin",   dose:"5",    unit:"mg", times: toTimes(false,false,false,true) },
      { id:"m8",  patientId:"p4", name:"Methadone",   dose:"30",   unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m9",  patientId:"p4", name:"Quetiapine",  dose:"25",   unit:"mg", times: toTimes(false,false,true,false) },
      { id:"m10", patientId:"p4", name:"Vitamin D",   dose:"1000", unit:"IU", times: toTimes(true,false,false,false) },
      { id:"m11", patientId:"p5", name:"Antabuse",    dose:"500",  unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m12", patientId:"p6", name:"Naltrexone",  dose:"50",   unit:"mg", times: toTimes(true,false,false,false) },
      { id:"m13", patientId:"p6", name:"Clonazepam",  dose:"1",    unit:"mg", times: toTimes(false,false,true,true) },
    ],
  });
  console.log("✓ Meds");

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
